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
import json
import unittest
from unittest import mock

import requests
from django.test import TestCase, Client
from django.contrib.auth.models import User

from company.views import display_internships, display_newgrads


# Mock responses for different URLs
MOCK_RESPONSES = {
    "https://raw.githubusercontent.com/SimplifyJobs/Summer2024-Internships/dev/.github/scripts/listings.json": {
        "content": json.dumps([
            {
                "company_name": "Company A",
                "title": "Software Engineer Intern",
                "location": "Remote",
                "url": "https://example.com/job1"
            },
            {
                "company_name": "Company B",
                "title": "Data Science Intern",
                "location": "New York, NY",
                "url": "https://example.com/job2"
            }
        ]),
        "status": 200
    },
    "http://maps.googleapis.com/maps/api/geocode/json?address=google": {
        "content": json.dumps({
            "results": [],
            "status": "ZERO_RESULTS"
        }),
        "status": 200
    }
}


# This method will be used by the mock to replace requests.get
def mocked_requests_get(*args, **kwargs):
    class MockResponse:
        def __init__(self, content, status_code):
            self.content = content.encode('utf-8')
            self.status_code = status_code

        def read(self):
            return self.content

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            return None

    url = args[0]
    if url in MOCK_RESPONSES:
        response_data = MOCK_RESPONSES[url]
        return MockResponse(response_data["content"], response_data["status"])

    return MockResponse("{}", 404)


# Our test case class
class CompanyViewsTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    @mock.patch('urllib.request.urlopen')
    def test_display_internships(self, mock_urlopen):
        mock_urlopen.side_effect = mocked_requests_get
        response = self.client.get('/internships')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'company/internships.html')
        self.assertIn('items_page', response.context)
        items_page = response.context['items_page']
        self.assertEqual(len(items_page.object_list), 2)
        self.assertEqual(items_page.object_list[0]['company_name'], 'Company A')

    @mock.patch('urllib.request.urlopen')
    def test_display_newgrads(self, mock_urlopen):
        mock_urlopen.side_effect = mocked_requests_get
        response = self.client.get('/grace-hopper')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'company/grace-hopper.html')
