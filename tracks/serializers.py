from rest_framework import serializers
from .models import ApplicationRecord

class ApplicationRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationRecord
        fields = [
            'id', 'outcome', 'job_title', 'company_name', 'application_link',
            'OA_date', 'VO_date', 'created', 'updated', 'applicant'
        ]
        read_only_fields = ['created', 'updated', 'applicant']

    def create(self, validated_data):
        # Set the applicant to the current user
        validated_data['applicant'] = self.context['request'].user
        return super().create(validated_data)
