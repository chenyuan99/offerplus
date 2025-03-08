from django.test import TransactionTestCase
from django.db import connection
from jobgpt.generator import generate_response


# Create your tests here.
class JobGPTTests(TransactionTestCase):
    # Use a different database for this test
    # This helps prevent concurrent access issues
    serialized_rollback = True
    
    def test_generate_response(self):
        try:
            # Close any existing connections before the test
            connection.close()
            
            # Run the test
            result = generate_response("hello")
            
            # Basic assertion
            self.assertIsNotNone(result)
        finally:
            # Make sure connection is closed after test
            connection.close()
