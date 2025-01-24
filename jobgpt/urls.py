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
from django.urls import path
from . import views

app_name = 'jobgpt'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/jobgpt/prompt', views.generate_prompt, name='generate_prompt'),
    path('api/jobgpt/resume/upload', views.upload_resume, name='upload_resume'),
    path('api/jobgpt/resume/match', views.match_resume, name='match_resume'),
    path('api/jobgpt/why-role', views.why_role, name='why_role'),
    path('api/jobgpt/why-company', views.why_company, name='why_company'),
    path('api/jobgpt/thank-you', views.thank_you_letter, name='thank_you_letter'),
]
