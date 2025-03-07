"""
Test script for LangChain tracing in OffersPlus.
Run this script to test the LangChain tracing capabilities.
"""
import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offer_plus.settings')
django.setup()

from django.conf import settings
from utils.langchain_utils import get_openai_chat, create_simple_chain
from langchain_core.prompts import ChatPromptTemplate

def test_simple_chat():
    """Test a simple chat completion with tracing."""
    print("Testing simple chat completion with tracing...")
    
    # Create a chat model with tracing
    chat = get_openai_chat(model="gpt-3.5-turbo")
    
    # Create a simple prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant."),
        ("user", "What are the top 5 skills needed for a software engineer in 2025?")
    ])
    
    # Create a chain
    chain = prompt | chat
    
    # Invoke the chain
    result = chain.invoke({})
    
    print("\nResult from simple chat:")
    print(result.content)
    print("\nCheck your LangSmith dashboard for the trace!")
    
def test_chain_with_parser():
    """Test a chain with an output parser."""
    print("\nTesting chain with output parser...")
    
    # Create a simple chain with the utility function
    system_prompt = "You are a career advisor specializing in tech careers."
    user_prompt = "List 3 tips for negotiating a higher salary at a tech company."
    
    chain = create_simple_chain(system_prompt, user_prompt)
    
    # Invoke the chain
    result = chain.invoke({})
    
    print("\nResult from chain with parser:")
    print(result)
    print("\nCheck your LangSmith dashboard for the trace!")

def test_company_info_extraction():
    """Test the company info extraction functionality."""
    print("\nTesting company info extraction...")
    
    # Import the company service
    from tracks.services.company_service import CompanyService
    
    # Test the company identification
    company_info = CompanyService.identify_company("Microsoft")
    
    print("\nCompany info extracted:")
    print(company_info)
    print("\nCheck your LangSmith dashboard for the trace!")

if __name__ == "__main__":
    print(f"LangChain Tracing Enabled: {settings.LANGCHAIN_TRACING_V2}")
    print(f"LangChain Project: {settings.LANGCHAIN_PROJECT}")
    
    if not settings.LANGCHAIN_API_KEY:
        print("Warning: LANGCHAIN_API_KEY is not set. Tracing will not work properly.")
        print("Please set the LANGCHAIN_API_KEY in your .env file.")
    
    # Run the tests
    test_simple_chat()
    test_chain_with_parser()
    test_company_info_extraction()
