from rest_framework import serializers
from .models import ApplicationRecord, Company, EmailThread, EmailMessage

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'website', 'logo_url', 'description', 'industry', 'location']

class EmailMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailMessage
        fields = ['id', 'message_id', 'sender', 'recipient', 'subject', 'body', 'sent_at']

class EmailThreadSerializer(serializers.ModelSerializer):
    messages = EmailMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = EmailThread
        fields = ['id', 'thread_id', 'subject', 'last_updated', 'messages']

class ApplicationRecordSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.IntegerField(write_only=True)
    email_threads = EmailThreadSerializer(many=True, read_only=True)

    class Meta:
        model = ApplicationRecord
        fields = [
            'id', 'company', 'company_id', 'position', 'status', 
            'source', 'notes', 'email_id', 'applied_date', 
            'last_updated', 'email_threads'
        ]
        read_only_fields = ['applied_date', 'last_updated']
