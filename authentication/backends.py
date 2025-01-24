from django.contrib.auth import get_user_model
from django.contrib.auth.backends import BaseBackend
from jose import jwt
from django.conf import settings

User = get_user_model()

class SupabaseAuthBackend(BaseBackend):
    def authenticate(self, request, token=None):
        if not token:
            return None

        try:
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

            user_id = payload.get('sub')
            if not user_id:
                return None

            # Get or create user
            user, created = User.objects.get_or_create(
                username=user_id,
                defaults={
                    'email': payload.get('email', ''),
                    'is_active': True
                }
            )
            return user

        except Exception:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
