-- Drop Django authentication tables
-- These tables were used by the old Django backend which has been replaced by Supabase Auth
-- Supabase has its own auth system in the 'auth' schema with auth.users, auth.sessions, etc.

DROP TABLE IF EXISTS auth_user_groups CASCADE;
DROP TABLE IF EXISTS auth_group_permissions CASCADE;
DROP TABLE IF EXISTS auth_user_user_permissions CASCADE;
DROP TABLE IF EXISTS auth_group CASCADE;
DROP TABLE IF EXISTS auth_permission CASCADE;
DROP TABLE IF EXISTS auth_user CASCADE;

-- Drop django-social-auth tables
DROP TABLE IF EXISTS social_auth_association CASCADE;
DROP TABLE IF EXISTS social_auth_code CASCADE;
DROP TABLE IF EXISTS social_auth_nonce CASCADE;
DROP TABLE IF EXISTS social_auth_partial CASCADE;
DROP TABLE IF EXISTS social_auth_usersocialauth CASCADE;
