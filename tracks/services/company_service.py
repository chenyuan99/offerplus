import requests
from typing import Optional, Dict
import openai
from django.conf import settings
from ..models import Company
from bs4 import BeautifulSoup
import logging
import json
from utils.langchain_utils import create_simple_chain

logger = logging.getLogger(__name__)

class CompanyService:
    @staticmethod
    def search_company_info(company_name: str) -> str:
        """
        Search for company information using a simple Google search
        """
        try:
            search_url = f"https://www.google.com/search?q={company_name}+company+about"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(search_url, headers=headers)
            return response.text
        except Exception as e:
            logger.error(f"Error searching company info: {str(e)}")
            return ""

    @staticmethod
    def _extract_logo_url(company_name: str, website: str = None) -> Optional[str]:
        """
        Extract company logo URL using multiple methods:
        1. Try to get favicon from website
        2. Try to find og:image or other meta image tags
        3. Try Google favicon API as fallback
        """
        if not website:
            # Try to guess website from company name
            website = f"https://www.{company_name.lower().replace(' ', '')}.com"
        
        try:
            # Method 1: Try to get favicon using favicon library
            import favicon
            icons = favicon.get(website)
            if icons:
                # Get the largest icon
                largest_icon = max(icons, key=lambda x: x.width if x.width else 0)
                return largest_icon.url
        except Exception as e:
            logger.debug(f"Failed to get favicon: {str(e)}")
        
        try:
            # Method 2: Try to get og:image or other meta images
            import requests
            from bs4 import BeautifulSoup
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(website, headers=headers, timeout=5)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Try og:image first
            og_image = soup.find('meta', property='og:image')
            if og_image and og_image.get('content'):
                return og_image['content']
                
            # Try other meta image tags
            meta_image = soup.find('meta', {'name': ['image', 'twitter:image']})
            if meta_image and meta_image.get('content'):
                return meta_image['content']
                
            # Try looking for logo in common paths
            for img in soup.find_all('img'):
                src = img.get('src', '')
                if 'logo' in src.lower():
                    # Convert relative URL to absolute
                    return requests.compat.urljoin(website, src)
                    
        except Exception as e:
            logger.debug(f"Failed to get meta images: {str(e)}")
        
        # Method 3: Try Google favicon API as fallback
        try:
            google_favicon_url = f"https://www.google.com/s2/favicons?domain={website}&sz=128"
            response = requests.head(google_favicon_url)
            if response.status_code == 200:
                return google_favicon_url
        except Exception as e:
            logger.debug(f"Failed to get Google favicon: {str(e)}")
        
        return None

    @staticmethod
    def get_or_create_company(company_name: str) -> Company:
        """Get or create a company with the given name"""
        try:
            company = Company.objects.get(name=company_name)
            if not company.logo_url:
                # Try to get logo if not already set
                logo_url = CompanyService._extract_logo_url(company_name, company.website)
                if logo_url:
                    company.logo_url = logo_url
                    company.save()
            return company
        except Company.DoesNotExist:
            # Create new company
            website = f"https://www.{company_name.lower().replace(' ', '')}.com"
            logo_url = CompanyService._extract_logo_url(company_name, website)
            return Company.objects.create(
                name=company_name,
                website=website,
                logo_url=logo_url or ''  # Use empty string if no logo found
            )

    @staticmethod
    def identify_company(company_name: str) -> Optional[Dict]:
        """
        Identify company details using OpenAI API and web search
        """
        try:
            # Get some context about the company from web search
            search_results = CompanyService.search_company_info(company_name)

            # Use OpenAI to extract company information
            prompt = f"""
            Based on the company name "{company_name}" and the following search results,
            extract key company information in a structured way. If information is not available,
            make an educated guess based on the company name and industry standards.

            Search results:
            {search_results[:2000]}  # Limit context size

            Please provide the information in the following JSON format:
            {{
                "name": "Official company name",
                "website": "Company website URL",
                "industry": "Primary industry",
                "location": "Headquarters location",
                "description": "2-3 sentence description"
            }}
            """

            # Use LangChain with tracing enabled
            system_prompt = "You are a helpful assistant that extracts company information."
            chain = create_simple_chain(system_prompt, prompt)
            response_content = chain.invoke({})

            # Parse the response
            try:
                company_info = json.loads(response_content)
                
                # Try to get the logo URL
                logo_url = CompanyService._extract_logo_url(
                    company_info.get('name', company_name),
                    company_info.get('website', '')
                )
                
                if logo_url:
                    company_info['logo_url'] = logo_url

                return company_info

            except json.JSONDecodeError:
                logger.error("Failed to parse OpenAI response as JSON")
                return None

        except Exception as e:
            logger.error(f"Error identifying company: {str(e)}")
            return None
