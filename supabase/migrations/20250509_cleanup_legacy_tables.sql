-- Remove legacy Django and tracks tables that are no longer used
-- The application now uses the 'applications' table for all job application data

DROP TABLE IF EXISTS accounts_userprofile CASCADE;
DROP TABLE IF EXISTS tracks_applicationrecord CASCADE;
DROP TABLE IF EXISTS tracks_company CASCADE;
DROP TABLE IF EXISTS tracks_emailmessage CASCADE;
DROP TABLE IF EXISTS tracks_emailthread CASCADE;
DROP TABLE IF EXISTS tracks_job CASCADE;
DROP TABLE IF EXISTS tracks_job_applicants CASCADE;
DROP TABLE IF EXISTS h1b_applications CASCADE;

-- Remove any remaining Django tables
DROP TABLE IF EXISTS auth_group CASCADE;
DROP TABLE IF EXISTS auth_group_permissions CASCADE;
DROP TABLE IF EXISTS auth_permission CASCADE;
DROP TABLE IF EXISTS auth_user CASCADE;
DROP TABLE IF EXISTS auth_user_groups CASCADE;
DROP TABLE IF EXISTS auth_user_user_permissions CASCADE;

-- Remove social auth tables
DROP TABLE IF EXISTS social_auth_association CASCADE;
DROP TABLE IF EXISTS social_auth_code CASCADE;
DROP TABLE IF EXISTS social_auth_nonce CASCADE;
DROP TABLE IF EXISTS social_auth_partial CASCADE;
DROP TABLE IF EXISTS social_auth_usersocialauth CASCADE;
