from rest_framework import serializers
from tracks.models import Company

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'description', 'industry', 'created_at', 'updated_at']
