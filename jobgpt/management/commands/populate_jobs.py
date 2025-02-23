import json
import uuid
import requests
from django.core.management.base import BaseCommand
from jobgpt.models import JobPosting

class Command(BaseCommand):
    help = 'Populate job postings from SimplifyJobs JSON data'

    def handle(self, *args, **options):
        url = "https://raw.githubusercontent.com/SimplifyJobs/Summer2024-Internships/dev/.github/scripts/listings.json"
        response = requests.get(url)
        jobs = response.json()

        # Delete existing jobs to avoid duplicates
        JobPosting.objects.all().delete()
        
        created_count = 0
        for job in jobs:
            try:
                # Convert the id string to UUID
                job_id = uuid.UUID(job['id'])
                
                # Create the job posting
                JobPosting.objects.create(
                    id=job_id,
                    company_name=job['company_name'],
                    locations=job['locations'],
                    title=job['title'],
                    date_posted=job['date_posted'],
                    terms=job.get('terms', []),
                    active=job['active'],
                    url=job['url'],
                    is_visible=job['is_visible'],
                    source=job['source'],
                    company_url=job.get('company_url', ''),
                    date_updated=job['date_updated'],
                    sponsorship=job.get('sponsorship', 'Unknown')
                )
                created_count += 1
                
                if created_count % 100 == 0:
                    self.stdout.write(f"Created {created_count} job postings...")
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating job {job.get('id', 'unknown')}: {str(e)}"))
                continue

        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} job postings'))
