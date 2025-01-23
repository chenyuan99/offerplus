from rest_framework import serializers
from .models import Company, Job

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'description', 'website', 'location', 'created_at', 'updated_at']

class JobSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'company', 'company_name', 'description', 'requirements',
            'location', 'salary_range', 'employment_type', 'status', 'applicants',
            'created_at', 'updated_at', 'deadline'
        ]
        read_only_fields = ['created_at', 'updated_at']
