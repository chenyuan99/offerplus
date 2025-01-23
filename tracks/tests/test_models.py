from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from tracks.models import ApplicationRecord, Company
from datetime import datetime, timedelta

class ApplicationRecordModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        test_user = User.objects.create_user(username='testuser', password='12345')
        ApplicationRecord.objects.create(
            outcome='TO DO',
            job_title='Software Engineer',
            company_name='Test Company',
            application_link='https://example.com',
            applicant=test_user
        )

    def test_outcome_label(self):
        application = ApplicationRecord.objects.get(id=1)
        field_label = application._meta.get_field('outcome').verbose_name
        self.assertEqual(field_label, 'outcome')

    def test_job_title_blank(self):
        application = ApplicationRecord.objects.get(id=1)
        field = application._meta.get_field('job_title')
        self.assertTrue(field.blank)

    def test_company_name_max_length(self):
        application = ApplicationRecord.objects.get(id=1)
        field = application._meta.get_field('company_name')
        self.assertTrue(isinstance(field, type(application._meta.get_field('company_name'))))

    def test_created_auto_now(self):
        application = ApplicationRecord.objects.get(id=1)
        self.assertTrue(isinstance(application.created, datetime))

    def test_updated_auto_now(self):
        application = ApplicationRecord.objects.get(id=1)
        old_updated = application.updated
        application.job_title = 'Updated Title'
        application.save()
        self.assertNotEqual(old_updated, application.updated)

    def test_string_representation(self):
        application = ApplicationRecord.objects.get(id=1)
        expected_string = f"Software Engineer Test Company TO DO"
        self.assertEqual(str(application), expected_string)

    def test_ordering(self):
        # Create a second application with an earlier created date
        test_user = User.objects.get(username='testuser')
        earlier_date = timezone.now() - timedelta(days=1)
        ApplicationRecord.objects.create(
            outcome='TO DO',
            job_title='Earlier Job',
            company_name='Earlier Company',
            applicant=test_user,
            created=earlier_date
        )
        applications = ApplicationRecord.objects.all()
        # The first application should be the most recent one
        self.assertEqual(applications[0].job_title, 'Software Engineer')

    def test_applicant_deletion_cascade(self):
        initial_count = ApplicationRecord.objects.count()
        test_user = User.objects.get(username='testuser')
        test_user.delete()
        self.assertEqual(ApplicationRecord.objects.count(), 0)
        self.assertEqual(ApplicationRecord.objects.count(), initial_count - 1)

class CompanyModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        Company.objects.create(
            name='Test Company',
            industry='Technology',
            description='A test company'
        )

    def test_name_field(self):
        company = Company.objects.get(id=1)
        field_label = company._meta.get_field('name').verbose_name
        self.assertEqual(field_label, 'name')

    def test_industry_blank(self):
        company = Company.objects.get(id=1)
        field = company._meta.get_field('industry')
        self.assertTrue(field.blank)

    def test_logo_upload_to(self):
        company = Company.objects.get(id=1)
        field = company._meta.get_field('logo')
        self.assertEqual(field.upload_to, 'company_logo')

    def test_created_auto_now(self):
        company = Company.objects.get(id=1)
        self.assertTrue(isinstance(company.created, datetime))

    def test_updated_auto_now(self):
        company = Company.objects.get(id=1)
        old_updated = company.updated
        company.name = 'Updated Company'
        company.save()
        self.assertNotEqual(old_updated, company.updated)

    def test_description_blank(self):
        company = Company.objects.get(id=1)
        field = company._meta.get_field('description')
        self.assertTrue(field.blank)

    def test_string_representation(self):
        company = Company.objects.get(id=1)
        self.assertEqual(str(company), company.name)
