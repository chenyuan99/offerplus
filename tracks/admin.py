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
# Register your models here.
from django.contrib import admin
from .models import ApplicationRecord, Company

@admin.register(ApplicationRecord)
class ApplicationRecordAdmin(admin.ModelAdmin):
    list_display = ('job_title', 'company_name', 'outcome', 'applicant', 'OA_date', 'VO_date', 'created')
    list_filter = ('outcome', 'applicant', 'created')
    search_fields = ('job_title', 'company_name', 'applicant__username')
    ordering = ('-created',)

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'industry', 'created', 'updated')
    search_fields = ('name', 'industry', 'description')
    list_filter = ('created', 'updated')
    ordering = ('-created',)
