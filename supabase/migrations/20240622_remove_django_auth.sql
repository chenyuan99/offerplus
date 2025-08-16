-- Drop Django-specific tables that are no longer needed
DROP TABLE IF EXISTS auth_user_groups CASCADE;
DROP TABLE IF EXISTS auth_group_permissions CASCADE;
DROP TABLE IF EXISTS auth_user_user_permissions CASCADE;
DROP TABLE IF EXISTS auth_group CASCADE;
DROP TABLE IF EXISTS auth_permission CASCADE;
DROP TABLE IF EXISTS django_admin_log CASCADE;
DROP TABLE IF EXISTS django_content_type CASCADE;
DROP TABLE IF EXISTS django_session CASCADE;
DROP TABLE IF EXISTS django_migrations CASCADE;
DROP TABLE IF EXISTS auth_user CASCADE;

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for resumes table
CREATE POLICY "Users can view their own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to handle user signup (for reference, this would be called from a trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to create a profile when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to handle user deletion (clean up related data)
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  DELETE FROM public.resumes WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to clean up when a user is deleted
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_deleted();
