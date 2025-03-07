from django.test import TransactionTestCase
from django.contrib.auth.models import User
from tracks.forms import ApplicationRecordForm
from tracks.models import ApplicationRecord
from django.db import connections

class ApplicationRecordFormTest(TransactionTestCase):
    def setUp(self):
        # Create a test user
        self.test_user = User.objects.create_user(
            username='testuser',
            password='12345'
        )

    def test_form_fields(self):
        form = ApplicationRecordForm()
        expected_fields = [
            'company_name',
            'job_title',
            'outcome',
            'application_link',
            'OA_date',
            'VO_date'
        ]
        self.assertEqual(list(form.fields.keys()), expected_fields)

    def test_valid_form(self):
        form_data = {
            'outcome': 'TO DO',
            'job_title': 'Software Engineer',
            'company_name': 'Test Company',
            'application_link': 'https://example.com',
            'OA_date': None,
            'VO_date': None
        }
        form = ApplicationRecordForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_invalid_form_missing_required(self):
        form_data = {
            'job_title': 'Software Engineer',  # Missing required fields
            'application_link': 'https://example.com'
        }
        form = ApplicationRecordForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('outcome', form.errors)
        self.assertIn('company_name', form.errors)

    def test_blank_job_title_valid(self):
        form_data = {
            'outcome': 'TO DO',
            'company_name': 'Test Company',
            'application_link': '',
            'job_title': '',  # This field can be blank
            'OA_date': None,
            'VO_date': None
        }
        form = ApplicationRecordForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_blank_application_link_valid(self):
        form_data = {
            'outcome': 'TO DO',
            'job_title': 'Software Engineer',
            'company_name': 'Test Company',
            'application_link': '',  # This field can be blank
            'OA_date': None,
            'VO_date': None
        }
        form = ApplicationRecordForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_invalid_outcome_choice(self):
        form_data = {
            'outcome': 'INVALID_CHOICE',  # Invalid choice
            'job_title': 'Software Engineer',
            'company_name': 'Test Company',
            'application_link': 'https://example.com',
            'OA_date': None,
            'VO_date': None
        }
        form = ApplicationRecordForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('outcome', form.errors)

    def test_form_save(self):
        form_data = {
            'outcome': 'TO DO',
            'job_title': 'Software Engineer',
            'company_name': 'Test Company',
            'application_link': 'https://example.com',
            'OA_date': None,
            'VO_date': None
        }
        form = ApplicationRecordForm(data=form_data)
        self.assertTrue(form.is_valid())
        
        # Save the form
        application = form.save(commit=False)
        application.applicant = self.test_user
        application.save()
        
        # Check that the object was created in the database
        self.assertTrue(ApplicationRecord.objects.filter(id=application.id).exists())
        
        # Verify the saved data
        saved_application = ApplicationRecord.objects.get(id=application.id)
        self.assertEqual(saved_application.job_title, 'Software Engineer')
        self.assertEqual(saved_application.applicant, self.test_user)
    
    def tearDown(self):
        connections.close_all()