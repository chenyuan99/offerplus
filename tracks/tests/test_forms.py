from django.test import TestCase
from django.contrib.auth.models import User
from tracks.forms import ApplicationRecordForm
from tracks.models import ApplicationRecord

class ApplicationRecordFormTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a test user
        cls.test_user = User.objects.create_user(username='testuser', password='12345')

    def test_form_fields(self):
        form = ApplicationRecordForm()
        expected_fields = [
            'outcome',
            'job_title',
            'company_name',
            'application_link',
            'applicant'
        ]
        self.assertEqual(list(form.fields.keys()), expected_fields)

    def test_valid_form(self):
        form_data = {
            'outcome': 'TO DO',
            'job_title': 'Software Engineer',
            'company_name': 'Test Company',
            'application_link': 'https://example.com',
            'applicant': self.test_user.username
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
        self.assertIn('applicant', form.errors)

    def test_blank_job_title_valid(self):
        form_data = {
            'outcome': 'TO DO',
            'company_name': 'Test Company',
            'application_link': '',
            'job_title': '',  # This field can be blank
            'applicant': self.test_user.username
        }
        form = ApplicationRecordForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_blank_application_link_valid(self):
        form_data = {
            'outcome': 'TO DO',
            'job_title': 'Software Engineer',
            'company_name': 'Test Company',
            'application_link': '',  # This field can be blank
            'applicant': self.test_user.username
        }
        form = ApplicationRecordForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_invalid_outcome_choice(self):
        form_data = {
            'outcome': 'INVALID_CHOICE',  # Invalid choice
            'job_title': 'Software Engineer',
            'company_name': 'Test Company',
            'application_link': 'https://example.com',
            'applicant': self.test_user.username
        }
        form = ApplicationRecordForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('outcome', form.errors)

    def test_hidden_applicant_field(self):
        form = ApplicationRecordForm(hide_condition=True)
        self.assertEqual(
            form.fields['applicant'].widget.__class__.__name__,
            'HiddenInput'
        )

    def test_form_save(self):
        form_data = {
            'outcome': 'TO DO',
            'job_title': 'Software Engineer',
            'company_name': 'Test Company',
            'application_link': 'https://example.com',
            'applicant': self.test_user.username
        }
        form = ApplicationRecordForm(data=form_data)
        self.assertTrue(form.is_valid())
        
        # Save the form
        application = form.save()
        
        # Check that the object was created in the database
        self.assertTrue(ApplicationRecord.objects.filter(id=application.id).exists())
        
        # Verify the saved data
        saved_application = ApplicationRecord.objects.get(id=application.id)
        self.assertEqual(saved_application.job_title, 'Software Engineer')
        self.assertEqual(saved_application.company_name, 'Test Company')
        self.assertEqual(saved_application.outcome, 'TO DO')
        self.assertEqual(saved_application.application_link, 'https://example.com')
        self.assertEqual(saved_application.applicant, self.test_user)
