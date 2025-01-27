from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tracks.services.gmail_service import sync_job_applications

User = get_user_model()

class Command(BaseCommand):
    help = 'Sync job applications from Gmail'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to sync applications for')

    def handle(self, *args, **options):
        try:
            user = User.objects.get(username=options['username'])
            success = sync_job_applications(user)
            if success:
                self.stdout.write(self.style.SUCCESS('Successfully synced job applications'))
            else:
                self.stdout.write(self.style.ERROR('Failed to sync job applications'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {options["username"]} does not exist'))
