import json
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.conf import settings
from jose import jwt
from jose.exceptions import JWTError

User = get_user_model()

class SupabaseAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip authentication for certain paths
        if request.path.startswith('/admin/') or request.path.startswith('/api/auth/'):
            return self.get_response(request)

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'No valid authorization header'}, status=401)

        try:
            # Extract the token
            token = auth_header.split(' ')[1]
            
            # Verify the JWT token
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=['HS256'],
                options={
                    'verify_sub': True,
                    'verify_iat': True,
                    'verify_exp': True,
                }
            )

            # Get or create user based on Supabase user ID
            user_id = payload.get('sub')
            if not user_id:
                return JsonResponse({'error': 'Invalid token payload'}, status=401)

            user, created = User.objects.get_or_create(
                username=user_id,  # Use Supabase user ID as username
                defaults={
                    'email': payload.get('email', ''),
                    'is_active': True
                }
            )

            # Attach user to request
            request.user = user

        except JWTError as e:
            return JsonResponse({'error': f'Invalid token: {str(e)}'}, status=401)
        except Exception as e:
            return JsonResponse({'error': f'Authentication error: {str(e)}'}, status=401)

        return self.get_response(request)
