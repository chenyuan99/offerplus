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
from django.urls import path, re_path

from . import views

urlpatterns = [
    path("", views.index, name="jobgpt"),
    path("resume-match", views.resume_match, name="resume-match"),
    path("prompt", views.get_prompt, name="prompt"),
    re_path(r"why-company/(?P<company_name>\w{1,50})/$", views.get_why_company)
]
