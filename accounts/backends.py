from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from utils.supabase import get_supabase_admin

User = get_user_model()

class SupabaseAuthBackend(BaseBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        if email is None or password is None:
            return None

        try:
            # Authenticate with Supabase
            supabase = get_supabase_admin()
            response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            if response.user:
                # Get or create Django user
                user, created = User.objects.get_or_create(
                    email=response.user.email,
                    defaults={
                        'username': response.user.email,
                        'is_active': True
                    }
                )
                return user
        except Exception as e:
            print(f"Authentication error: {e}")
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
