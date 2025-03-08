"""
Custom test utilities for the OffersPlus application.
"""
from django.test.runner import DiscoverRunner


class NoTeardownTestRunner(DiscoverRunner):
    """
    A test runner that doesn't tear down the test database after tests.
    This helps prevent the "database is being accessed by other users" error
    when using SQLite with multiple connections.
    """
    
    def teardown_databases(self, old_config, **kwargs):
        """
        Override the teardown_databases method to do nothing.
        This prevents Django from trying to destroy the test database,
        which can cause issues with SQLite and concurrent connections.
        """
        # Do nothing - don't try to tear down the database
        pass
