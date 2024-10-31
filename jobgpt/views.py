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
from django.http import JsonResponse
from django.shortcuts import render

from .generator import generate_response, generate_why_role, generate_why_company, generate_thank_you_letter


# Create your views here.
def index(request):
    return render(request, "jobgpt/jobgpt.html")


def resume_match(request):
    return render(request, "jobgpt/resume-match.html")


def get_prompt(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"prompt": "You must be logged in to use this feature."}
        )
    result = generate_response(request.POST.get("prompt"))
    return JsonResponse({"prompt": result})

def get_why_company(request, company_name=None):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"why_company": "You must be logged in to use this feature."}
        )
    result = generate_why_company(company_name)
    return JsonResponse({"why_company": result})
