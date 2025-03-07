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
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .generator import (
    generate_response,
    generate_why_role,
    generate_why_company,
    generate_thank_you_letter,
    get_behavioral_answer,
    get_resume_feedback,
    get_resume_match_score,
)

@api_view(['GET'])
def index(request):
    return JsonResponse({"message": "Welcome to JobGPT API"})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_prompt(request):
    """
    Generate a response based on the provided prompt, mode, and model.
    """
    prompt = request.data.get('prompt')
    mode = request.data.get('mode', 'why_company')
    model = request.data.get('model', 'deepseek-coder-6.7b')

    if not prompt:
        return Response(
            {'error': 'Prompt is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Pass the model parameter to the generator functions
        if mode == 'why_company':
            response = generate_why_company(prompt, model=model)
        elif mode == 'behavioral':
            response = get_behavioral_answer(prompt, model=model)
        elif mode == 'general':
            response = generate_response(prompt, model=model)
        else:
            return Response(
                {'error': 'Invalid mode specified'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'response': response,
            'mode': mode,
            'model': model
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def why_role(request):
    """Generate why role response."""
    company_name = request.data.get('company_name')
    role_name = request.data.get('role_name')
    
    if not company_name or not role_name:
        return Response(
            {'error': 'Both company_name and role_name are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        response = generate_why_role(company_name, role_name)
        return Response({'response': response})
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def why_company(request):
    """Generate why company response."""
    company_name = request.data.get('company_name')
    
    if not company_name:
        return Response(
            {'error': 'company_name is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        response = generate_why_company(company_name)
        return Response({'response': response})
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def thank_you_letter(request):
    """Generate thank you letter."""
    interviewer_name = request.data.get('interviewer_name')
    company_name = request.data.get('company_name')
    
    if not interviewer_name or not company_name:
        return Response(
            {'error': 'Both interviewer_name and company_name are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        response = generate_thank_you_letter(interviewer_name, company_name)
        return Response({'response': response})
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resume(request):
    """Upload and analyze a resume."""
    if 'document' not in request.FILES:
        return Response(
            {'error': 'No document provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        resume_file = request.FILES['document']
        feedback = get_resume_feedback(resume_file)
        
        return Response({
            'feedback': feedback,
            'message': 'Resume uploaded and analyzed successfully'
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_resume(request):
    """Match a resume against a job description."""
    job_description = request.data.get('job_description')
    resume_url = request.data.get('resume_url')

    if not job_description or not resume_url:
        return Response(
            {'error': 'Both job description and resume URL are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        match_score = get_resume_match_score(job_description, resume_url)
        
        return Response({
            'match_score': match_score,
            'message': 'Resume match analysis completed'
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
