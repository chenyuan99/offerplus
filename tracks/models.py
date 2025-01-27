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
from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

# Create your models here.
from tracks.identifiers import MY_CHOICES


class Company(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    website = models.URLField(max_length=200, blank=True)
    logo_url = models.URLField(max_length=200, blank=True)
    location = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        ordering = ("-created_at",)

    @classmethod
    def get_default_company(cls):
        company, _ = cls.objects.get_or_create(
            name="Unknown Company",
            defaults={
                'description': 'Default company for legacy records',
                'industry': 'Unknown',
                'website': '',
                'logo_url': '',
                'location': 'Unknown'
            }
        )
        return company.id


class EmailThread(models.Model):
    """Model to store email thread information"""
    application = models.ForeignKey('ApplicationRecord', on_delete=models.CASCADE, related_name='email_threads')
    thread_id = models.CharField(max_length=100)
    subject = models.CharField(max_length=500)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('application', 'thread_id')


class EmailMessage(models.Model):
    """Model to store individual email messages"""
    thread = models.ForeignKey(EmailThread, on_delete=models.CASCADE, related_name='messages')
    message_id = models.CharField(max_length=100, unique=True)
    sender = models.EmailField()
    recipient = models.EmailField()
    subject = models.CharField(max_length=500)
    body = models.TextField()
    sent_at = models.DateTimeField()
    raw_payload = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ['sent_at']


class ApplicationRecord(models.Model):
    STATUS_CHOICES = [
        ('APPLIED', 'Applied'),
        ('OA', 'Online Assessment'),
        ('PHONE', 'Phone Screen'),
        ('VO', 'Virtual Onsite'),
        ('OFFER', 'Offer'),
        ('REJECTED', 'Rejected'),
        ('ACCEPTED', 'Accepted'),
        ('DECLINED', 'Declined'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    position = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    applied_date = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)
    source = models.CharField(max_length=50, default='Manual')  # e.g., 'Manual', 'Gmail', 'LinkedIn'
    email_id = models.CharField(max_length=100, null=True, blank=True)  # For Gmail integration
    
    def __str__(self):
        return f"{self.company.name} - {self.position} ({self.status})"
        
    class Meta:
        ordering = ['-applied_date']
        unique_together = ('user', 'company', 'position', 'applied_date')
