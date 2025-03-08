"""
Custom test command that uses a unique database name to avoid concurrency issues.
"""
import os
import uuid
from django.core.management.commands.test import Command as TestCommand


class Command(TestCommand):
    """
    A custom test command that uses a unique database name to avoid concurrency issues.
    This is particularly useful for SQLite databases that don't handle multiple connections well.
    """
    
    def handle(self, *test_labels, **options):
        """
        Run the tests with a unique database name.
        """
        # Generate a unique database name for this test run
        unique_id = str(uuid.uuid4())
        unique_db_name = f"test_db_{unique_id}.sqlite3"
        
        # Set the database name in the environment
        os.environ['TEST_DB_NAME'] = unique_db_name
        
        # Print information about the test database
        self.stdout.write(f"Using unique test database: {unique_db_name}")
        
        # Run the tests
        return super().handle(*test_labels, **options)
