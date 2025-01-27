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
from .models import Company, ApplicationRecord, EmailThread, EmailMessage

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'industry', 'website', 'location')
    list_filter = ('industry',)
    search_fields = ('name', 'industry', 'description', 'location')

@admin.register(ApplicationRecord)
class ApplicationRecordAdmin(admin.ModelAdmin):
    list_display = ('company', 'position', 'status', 'applied_date', 'last_updated')
    list_filter = ('status', 'applied_date', 'source')
    search_fields = ('company__name', 'position', 'notes')
    ordering = ('-applied_date',)

@admin.register(EmailThread)
class EmailThreadAdmin(admin.ModelAdmin):
    list_display = ('application', 'subject', 'last_updated')
    list_filter = ('last_updated',)
    search_fields = ('subject', 'application__company__name')
    ordering = ('-last_updated',)

@admin.register(EmailMessage)
class EmailMessageAdmin(admin.ModelAdmin):
    list_display = ('thread', 'sender', 'subject', 'sent_at')
    list_filter = ('sent_at',)
    search_fields = ('subject', 'body', 'sender', 'recipient')
    ordering = ('sent_at',)
