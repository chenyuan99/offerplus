import os
import re
import base64
import json
import logging
from typing import Optional, List, Dict, Tuple
from datetime import datetime
from django.utils import timezone
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from django.conf import settings
from django.contrib.auth import get_user_model
from ..models import ApplicationRecord, Company, EmailThread, EmailMessage
from .company_service import CompanyService

logger = logging.getLogger(__name__)
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

# Common patterns in job application emails
PATTERNS = {
    'application_received': [
        r'(?i)thank.*application',
        r'(?i)received.*application',
        r'(?i)application.*received',
        r'(?i)application.*confirmation'
    ],
    'job_title': [
        r'(?i)position.*?([^.!?\n]+(?:developer|engineer|scientist|analyst|manager|designer)[^.!?\n]+)',
        r'(?i)role.*?([^.!?\n]+(?:developer|engineer|scientist|analyst|manager|designer)[^.!?\n]+)',
        r'(?i)(?:regarding|re:).*?([^.!?\n]+(?:developer|engineer|scientist|analyst|manager|designer)[^.!?\n]+)'
    ],
    'company_name': [
        r'(?i)at\s+([A-Z][A-Za-z0-9\s&]+(?:Inc\.|LLC|Ltd\.?|Corporation|Corp\.|Limited)?)',
        r'(?i)from\s+([A-Z][A-Za-z0-9\s&]+(?:Inc\.|LLC|Ltd\.?|Corporation|Corp\.|Limited)?)',
        r'(?i)(?:welcome\s+to|joining)\s+([A-Z][A-Za-z0-9\s&]+(?:Inc\.|LLC|Ltd\.?|Corporation|Corp\.|Limited)?)'
    ]
}

class GmailService:
    def __init__(self):
        self.company_service = CompanyService()

    def _get_credentials(self) -> Credentials:
        """Get valid credentials for Gmail API"""
        creds = None
        token_path = os.path.join(settings.BASE_DIR, 'token.json')
        creds_path = os.path.join(settings.BASE_DIR, 'credentials.json')

        if os.path.exists(token_path):
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
                creds = flow.run_local_server(port=0)
            
            with open(token_path, 'w') as token:
                token.write(creds.to_json())

        return creds

    def _analyze_email_content(self, subject: str, body: str) -> Dict:
        """
        Analyze email content using regex patterns to extract relevant information
        
        Args:
            subject: Email subject
            body: Email body text
            
        Returns:
            Dict containing extracted information
        """
        result = {
            'is_application': False,
            'job_title': None,
            'company_name': None
        }
        
        # Check if this is a job application email
        for pattern in PATTERNS['application_received']:
            if re.search(pattern, subject) or re.search(pattern, body):
                result['is_application'] = True
                break
        
        if not result['is_application']:
            return result
            
        # Extract job title
        for pattern in PATTERNS['job_title']:
            match = re.search(pattern, subject) or re.search(pattern, body)
            if match:
                result['job_title'] = match.group(1).strip()
                break
                
        # Extract company name
        for pattern in PATTERNS['company_name']:
            match = re.search(pattern, subject) or re.search(pattern, body)
            if match:
                result['company_name'] = match.group(1).strip()
                break
                
        return result

    def _get_email_thread(self, service, thread_id: str) -> List[Dict]:
        """Get all messages in an email thread"""
        try:
            thread = service.users().threads().get(userId='me', id=thread_id).execute()
            messages = []
            
            for msg in thread['messages']:
                headers = {h['name']: h['value'] for h in msg['payload']['headers']}
                
                # Get email body
                parts = []
                def get_parts(payload):
                    if 'parts' in payload:
                        for part in payload['parts']:
                            get_parts(part)
                    elif payload.get('mimeType') == 'text/plain':
                        data = payload.get('body', {}).get('data', '')
                        if data:
                            parts.append(base64.urlsafe_b64decode(data).decode())
                
                get_parts(msg['payload'])
                body = '\n'.join(parts)
                
                sent_at = timezone.make_aware(
                    datetime.fromtimestamp(int(msg['internalDate']) / 1000)
                )
                
                messages.append({
                    'message_id': msg['id'],
                    'thread_id': thread_id,
                    'sender': headers.get('From', ''),
                    'recipient': headers.get('To', ''),
                    'subject': headers.get('Subject', ''),
                    'body': body,
                    'sent_at': sent_at,
                    'raw_payload': msg['payload']
                })
            
            return messages
        except Exception as e:
            logger.error(f"Error getting email thread: {str(e)}")
            return []

    def sync_emails(self, user_email: Optional[str] = None) -> List[Dict]:
        """
        Sync job application emails for a user
        
        Args:
            user_email: Email address to sync. If None, uses authenticated user's email
            
        Returns:
            List of created/updated application records
        """
        try:
            creds = self._get_credentials()
            service = build('gmail', 'v1', credentials=creds)
            
            # Get list of emails
            query = 'subject:"application" OR subject:"job" OR subject:"position"'
            results = service.users().messages().list(userId='me', q=query).execute()
            messages = results.get('messages', [])
            
            synced_applications = []
            User = get_user_model()
            user = User.objects.get(email=user_email)
            
            for message in messages:
                # Get the full thread for this message
                thread_messages = self._get_email_thread(service, message['threadId'])
                if not thread_messages:
                    continue
                
                # Use the first message for application analysis
                first_message = thread_messages[0]
                analysis = self._analyze_email_content(first_message['subject'], first_message['body'])
                
                if not analysis['is_application']:
                    continue
                
                if analysis['company_name']:
                    company = self.company_service.get_or_create_company(analysis['company_name'])
                    
                    # Create or update application record
                    defaults = {
                        'status': 'APPLIED',
                        'source': 'Gmail',
                        'email_id': first_message['message_id'],
                        'applied_date': first_message['sent_at']  # Use the first email's timestamp as applied date
                    }
                    
                    # Try to find existing application by email_id first
                    application = ApplicationRecord.objects.filter(
                        user=user,
                        email_id=first_message['message_id']
                    ).first()
                    
                    if not application:
                        # If not found by email_id, try to find by company and position
                        application = ApplicationRecord.objects.filter(
                            user=user,
                            company=company,
                            position=analysis['job_title'] or 'Unknown Position'
                        ).first()
                    
                    if not application:
                        # If no existing application found, create a new one
                        application = ApplicationRecord.objects.create(
                            user=user,
                            company=company,
                            position=analysis['job_title'] or 'Unknown Position',
                            **defaults
                        )
                    else:
                        # Update existing application if needed
                        for key, value in defaults.items():
                            if not getattr(application, key):
                                setattr(application, key, value)
                        application.save()
                    
                    # Create or update email thread
                    thread, _ = EmailThread.objects.get_or_create(
                        application=application,
                        thread_id=first_message['thread_id'],
                        defaults={'subject': first_message['subject']}
                    )
                    
                    # Create email messages
                    for msg in thread_messages:
                        EmailMessage.objects.get_or_create(
                            thread=thread,
                            message_id=msg['message_id'],
                            defaults={
                                'sender': msg['sender'],
                                'recipient': msg['recipient'],
                                'subject': msg['subject'],
                                'body': msg['body'],
                                'sent_at': msg['sent_at'],
                                'raw_payload': msg['raw_payload']
                            }
                        )
                    
                    synced_applications.append({
                        'id': application.id,
                        'company': company.name,
                        'position': application.position,
                        'thread_count': len(thread_messages)
                    })
            
            return synced_applications
            
        except Exception as e:
            logger.error(f"Error syncing emails: {str(e)}")
            raise

def sync_job_applications(user) -> bool:
    """
    Sync job applications from Gmail for a specific user
    
    Args:
        user: User instance to sync applications for
        
    Returns:
        bool: True if sync was successful, False otherwise
    """
    try:
        gmail_service = GmailService()
        sync_result = gmail_service.sync_emails(user.email)
        return len(sync_result) > 0
    except Exception as e:
        logger.error(f"Failed to sync job applications for user {user.email}: {str(e)}")
        return False
