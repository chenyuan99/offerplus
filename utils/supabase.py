from django.conf import settings
from supabase import create_client, Client

def get_supabase() -> Client:
    """
    Get a Supabase client instance
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_supabase_admin() -> Client:
    """
    Get a Supabase client instance with admin privileges
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
