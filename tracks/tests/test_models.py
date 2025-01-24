# Copyright Yuan Chen. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You
# may not use this file except in compliance with the License. A copy of
# the License is located at
#
# https://www.yuanchen.io/apache2.0/
#
# or in the "license" file accompanying this file. This file is
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
# ANY KIND, either express or implied. See the License for the specific
# language governing permissions and limitations under the License.
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone

from tracks.models import Company, ApplicationRecord


class ApplicationRecordModelTest(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Create test company
        self.company = Company.objects.create(
            name='Test Company',
            industry='Technology'
        )
        
        # Create test application record
        self.application = ApplicationRecord.objects.create(
            applicant=self.user,
            company_name=self.company.name,
            job_title='Software Engineer',
            outcome='TO DO',
            application_link='https://example.com'
        )

    def test_string_representation(self):
        """Test the string representation of ApplicationRecord"""
        expected = f"Software Engineer Test Company TO DO"
        self.assertEqual(str(self.application), expected)

    def test_applicant_deletion_cascade(self):
        """Test that application records are deleted when the applicant is deleted"""
        initial_count = ApplicationRecord.objects.count()
        self.user.delete()
        final_count = ApplicationRecord.objects.count()
        self.assertEqual(final_count, 0)
        self.assertEqual(initial_count - 1, final_count)


class CompanyModelTest(TestCase):
    def setUp(self):
        """Create a test company"""
        self.company = Company.objects.create(
            id=1,
            name='Test Company',
            industry='Technology'
        )

    def test_name_field(self):
        """Test company name field"""
        company = Company.objects.get(id=1)
        self.assertEqual(company.name, 'Test Company')

    def test_industry_blank(self):
        """Test industry field can be blank"""
        company = Company.objects.get(id=1)
        company.industry = ''
        company.save()
        self.assertEqual(company.industry, '')

    def test_logo_upload_to(self):
        """Test logo upload path"""
        company = Company.objects.get(id=1)
        self.assertTrue(hasattr(company, 'logo'))

    def test_created_auto_now(self):
        """Test created field is auto-populated"""
        company = Company.objects.get(id=1)
        self.assertIsNotNone(company.created)

    def test_updated_auto_now(self):
        """Test updated field is auto-updated"""
        company = Company.objects.get(id=1)
        old_updated = company.updated
        company.name = 'Updated Company'
        company.save()
        self.assertNotEqual(company.updated, old_updated)

    def test_string_representation(self):
        """Test the string representation of Company"""
        company = Company.objects.get(id=1)
        self.assertEqual(str(company), 'Test Company')
