"""
Test script for JobGPT endpoints.
This script tests the JobGPT API endpoints with various models and modes.
"""
import os
import sys
import json
import requests

# Set up Django environment properly
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offer_plus.settings')

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Initialize Django
import django
django.setup()

# Now import Django models after setup
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

# Base URL for API requests
BASE_URL = 'http://localhost:8000'

def get_auth_token():
    """Get or create a test user and return a JWT token."""
    # Get or create a test user
    username = 'testuser'
    password = 'testpassword'
    
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        user = User.objects.create_user(username=username, password=password)
    
    # Generate JWT token
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

def test_prompt_endpoint():
    """Test the prompt generation endpoint with different models and modes."""
    token = get_auth_token()
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test data for different modes
    test_cases = [
        {
            'prompt': 'Google',
            'mode': 'why_company',
            'model': 'gpt-3.5-turbo',
            'description': 'Why Company (GPT-3.5)'
        },
        {
            'prompt': 'Tell me about a time you faced a challenge',
            'mode': 'behavioral',
            'model': 'gpt-4',
            'description': 'Behavioral Question (GPT-4)'
        },
        {
            'prompt': 'What are the key skills for a software engineer?',
            'mode': 'general',
            'model': 'gpt-4-turbo',
            'description': 'General Question (GPT-4 Turbo)'
        },
        {
            'prompt': 'Microsoft',
            'mode': 'why_company',
            'model': 'deepseek-coder-6.7b',
            'description': 'Why Company (Deepseek 6.7b)'
        }
    ]
    
    print("\n=== Testing JobGPT Prompt Endpoint ===")
    
    for case in test_cases:
        print(f"\nTesting: {case['description']}")
        print(f"Prompt: {case['prompt']}")
        print(f"Mode: {case['mode']}")
        print(f"Model: {case['model']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/jobgpt/api/jobgpt/prompt",
                headers=headers,
                json={
                    'prompt': case['prompt'],
                    'mode': case['mode'],
                    'model': case['model']
                }
            )
            
            if response.status_code == 200:
                print(f"Success! Status code: {response.status_code}")
                data = response.json()
                print(f"Response (truncated): {data.get('response', '')[:100]}...")
            else:
                print(f"Failed! Status code: {response.status_code}")
                print(f"Error: {response.text}")
        
        except Exception as e:
            print(f"Exception: {str(e)}")
    
    print("\n=== Prompt Endpoint Testing Complete ===")

def test_resume_upload_endpoint():
    """Test the resume upload endpoint."""
    token = get_auth_token()
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    print("\n=== Testing Resume Upload Endpoint ===")
    
    # Check if we have a sample resume to test with
    sample_resume_path = os.path.join(os.path.dirname(__file__), 'sample_resume.pdf')
    
    if not os.path.exists(sample_resume_path):
        print(f"Sample resume not found at {sample_resume_path}")
        print("Creating a simple text file as a sample resume...")
        
        # Create a simple text file as a sample resume
        with open(sample_resume_path, 'w') as f:
            f.write("Sample Resume\n\nName: Test User\nEmail: test@example.com\nSkills: Python, Django, React")
        
    try:
        with open(sample_resume_path, 'rb') as resume_file:
            files = {'document': resume_file}
            
            response = requests.post(
                f"{BASE_URL}/jobgpt/api/jobgpt/resume/upload",
                headers=headers,
                files=files
            )
            
            if response.status_code == 200:
                print(f"Success! Status code: {response.status_code}")
                data = response.json()
                print(f"Feedback (truncated): {data.get('feedback', '')[:100]}...")
            else:
                print(f"Failed! Status code: {response.status_code}")
                print(f"Error: {response.text}")
    
    except Exception as e:
        print(f"Exception: {str(e)}")
    
    print("\n=== Resume Upload Endpoint Testing Complete ===")

if __name__ == "__main__":
    print("Starting JobGPT endpoint tests...")
    
    # Test the prompt endpoint
    test_prompt_endpoint()
    
    # Test the resume upload endpoint
    test_resume_upload_endpoint()
    
    print("\nAll tests completed!")
