from django.core.management.base import BaseCommand
from tracks.models import Company
from django.utils import timezone

class Command(BaseCommand):
    help = 'Populate database with common tech companies'

    def handle(self, *args, **options):
        companies = [
            {
                'name': 'Google',
                'description': 'A multinational technology company specializing in Internet-related services and products.',
                'website': 'https://www.google.com',
                'location': 'Mountain View, CA'
            },
            {
                'name': 'Microsoft',
                'description': 'A multinational technology corporation producing computer software, consumer electronics, and personal computers.',
                'website': 'https://www.microsoft.com',
                'location': 'Redmond, WA'
            },
            {
                'name': 'Apple',
                'description': 'A multinational technology company that designs, develops, and sells consumer electronics, software, and services.',
                'website': 'https://www.apple.com',
                'location': 'Cupertino, CA'
            },
            {
                'name': 'Amazon',
                'description': 'A multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence.',
                'website': 'https://www.amazon.com',
                'location': 'Seattle, WA'
            },
            {
                'name': 'Meta',
                'description': 'A technology company focused on social networking, virtual reality, and metaverse technologies.',
                'website': 'https://www.meta.com',
                'location': 'Menlo Park, CA'
            },
            {
                'name': 'Netflix',
                'description': 'A streaming technology company providing subscription-based video on demand services.',
                'website': 'https://www.netflix.com',
                'location': 'Los Gatos, CA'
            },
            {
                'name': 'Twitter',
                'description': 'A social networking platform that enables users to send and receive short posts.',
                'website': 'https://www.twitter.com',
                'location': 'San Francisco, CA'
            },
            {
                'name': 'LinkedIn',
                'description': 'A professional networking platform and job marketplace.',
                'website': 'https://www.linkedin.com',
                'location': 'Sunnyvale, CA'
            },
            {
                'name': 'Salesforce',
                'description': 'A cloud-based software company specializing in customer relationship management.',
                'website': 'https://www.salesforce.com',
                'location': 'San Francisco, CA'
            },
            {
                'name': 'Adobe',
                'description': 'A software company focused on creative software products and digital experiences.',
                'website': 'https://www.adobe.com',
                'location': 'San Jose, CA'
            },
            # Major Banks
            {
                'name': 'JPMorgan Chase',
                'description': 'A multinational investment bank and financial services company.',
                'website': 'https://www.jpmorganchase.com',
                'location': 'New York, NY'
            },
            {
                'name': 'Goldman Sachs',
                'description': 'A leading global investment banking, securities and investment management firm.',
                'website': 'https://www.goldmansachs.com',
                'location': 'New York, NY'
            },
            {
                'name': 'Morgan Stanley',
                'description': 'A multinational investment bank and financial services company.',
                'website': 'https://www.morganstanley.com',
                'location': 'New York, NY'
            },
            {
                'name': 'Bank of America',
                'description': 'A multinational investment bank and financial services company.',
                'website': 'https://www.bankofamerica.com',
                'location': 'Charlotte, NC'
            },
            {
                'name': 'Citigroup',
                'description': 'A multinational investment bank and financial services corporation.',
                'website': 'https://www.citigroup.com',
                'location': 'New York, NY'
            },
            {
                'name': 'Wells Fargo',
                'description': 'A multinational financial services company.',
                'website': 'https://www.wellsfargo.com',
                'location': 'San Francisco, CA'
            },
            {
                'name': 'Barclays',
                'description': 'A British multinational universal bank and financial services company.',
                'website': 'https://www.barclays.com',
                'location': 'London, UK'
            }
        ]

        for company_data in companies:
            Company.objects.get_or_create(
                name=company_data['name'],
                defaults={
                    'description': company_data['description'],
                    'website': company_data['website'],
                    'location': company_data['location'],
                    'created_at': timezone.now(),
                }
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully added/updated {company_data["name"]}'))
