"""
Test script for Supabase Storage connection in OffersPlus.
This script tests the connection to Supabase Storage and basic operations.
"""
import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

def get_supabase_client(use_service_key=False) -> Client:
    """Create a Supabase client using environment variables
    
    Args:
        use_service_key (bool): If True, use the service role key instead of anon key
        
    Returns:
        Client: Supabase client instance
    """
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    
    if use_service_key:
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        if not supabase_key:
            print("Warning: SUPABASE_SERVICE_ROLE_KEY not found. Falling back to anon key.")
            supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
    else:
        supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        raise ValueError("Missing Supabase environment variables")
        
    return create_client(supabase_url, supabase_key)

def test_supabase_storage_connection(use_service_key=False):
    """Test the connection to Supabase Storage and list available buckets.
    
    Args:
        use_service_key (bool): If True, use the service role key instead of anon key
        
    Returns:
        bool: True if successful, False otherwise
    """
    print(f"Testing Supabase Storage connection using {'service role key' if use_service_key else 'anonymous key'}...")
    
    try:
        # Get Supabase client
        supabase = get_supabase_client(use_service_key)
        
        # List all buckets
        print("\nListing all storage buckets:")
        response = supabase.storage.list_buckets()
        
        # Check response format - could be data attribute or direct list
        if hasattr(response, 'data'):
            buckets = response.data
            error = response.error if hasattr(response, 'error') else None
        else:
            # Direct response (list of buckets)
            buckets = response
            error = None
        
        if buckets:
            print(f"Found {len(buckets)} buckets:")
            for bucket in buckets:
                if isinstance(bucket, dict):
                    print(f"  - {bucket.get('name')} (created: {bucket.get('created_at', 'unknown')})")
                else:
                    print(f"  - {bucket}")
        else:
            print("No buckets found.")
            
        if error:
            print(f"Error listing buckets: {error.message}")
            if 'Unauthorized' in str(error) and not use_service_key:
                print("\nPermission denied. This operation requires the service role key or proper bucket permissions.")
                print("Try running the test with the service role key: python test_supabase_storage.py --service-key")
                print("Or set up proper permissions for the anonymous key in the Supabase dashboard.")
            return False
            
        return True
        
    except Exception as e:
        print(f"Error connecting to Supabase Storage: {str(e)}")
        if 'Unauthorized' in str(e) and not use_service_key:
            print("\nPermission denied. This operation requires the service role key or proper bucket permissions.")
            print("Try running the test with the service role key: python test_supabase_storage.py --service-key")
            print("Or set up proper permissions for the anonymous key in the Supabase dashboard.")
        return False

def test_resume_bucket(use_service_key=False):
    """Test operations on the 'resumes' bucket.
    
    Args:
        use_service_key (bool): If True, use the service role key instead of anon key
        
    Returns:
        bool: True if successful, False otherwise
    """
    print(f"\nTesting 'resumes' bucket operations using {'service role key' if use_service_key else 'anonymous key'}...")
    
    try:
        # Get Supabase client
        supabase = get_supabase_client(use_service_key)
        
        # Check if 'resumes' bucket exists
        response = supabase.storage.list_buckets()
        
        # Check response format - could be data attribute or direct list
        if hasattr(response, 'data'):
            buckets = response.data
            error = response.error if hasattr(response, 'error') else None
        else:
            # Direct response (list of buckets)
            buckets = response
            error = None
        
        if error:
            print(f"Error listing buckets: {error.message}")
            if 'Unauthorized' in str(error) and not use_service_key:
                print("\nPermission denied. This operation requires the service role key.")
                print("Try running the test with the service role key: python test_supabase_storage.py --service-key")
            return False
        
        # Check if resumes bucket exists
        bucket_exists = False
        if buckets:
            for bucket in buckets:
                # Check for different possible formats of bucket objects
                if isinstance(bucket, dict) and bucket.get('name') == 'resumes':
                    bucket_exists = True
                    break
                elif isinstance(bucket, str) and bucket == 'resumes':
                    bucket_exists = True
                    break
                elif hasattr(bucket, 'id') and bucket.id == 'resumes':
                    bucket_exists = True
                    break
                elif hasattr(bucket, 'name') and bucket.name == 'resumes':
                    bucket_exists = True
                    break
        
        if not bucket_exists:
            print("'resumes' bucket does not exist. Creating it...")
            try:
                # Different versions of Supabase client may have different APIs
                # Try the newer format first
                create_response = supabase.storage.create_bucket('resumes')
            except Exception as e:
                print(f"Error with first bucket creation attempt: {str(e)}")
                try:
                    # Try alternative format
                    create_response = supabase.storage.create_bucket(name='resumes', options={'public': True})
                except Exception as e2:
                    print(f"Error with second bucket creation attempt: {str(e2)}")
                    return False
                    
            # Check for error in response
            if hasattr(create_response, 'error') and create_response.error:
                print(f"Error creating 'resumes' bucket: {create_response.error.message}")
                if 'Unauthorized' in str(create_response.error) and not use_service_key:
                    print("\nPermission denied. Creating buckets requires the service role key.")
                    print("Try running the test with the service role key: python test_supabase_storage.py --service-key")
                return False
            print("'resumes' bucket created successfully.")
        else:
            print("'resumes' bucket exists.")
        
        # List files in the 'resumes' bucket
        list_response = supabase.storage.from_('resumes').list()
        
        # Check response format
        if hasattr(list_response, 'data'):
            files = list_response.data
            list_error = list_response.error if hasattr(list_response, 'error') else None
        else:
            # Direct response (list of files)
            files = list_response
            list_error = None
        
        if list_error:
            print(f"Error listing files: {list_error.message}")
            if 'Unauthorized' in str(list_error) and not use_service_key:
                print("\nPermission denied. Check if the anonymous key has access to the 'resumes' bucket.")
                print("Try running the test with the service role key: python test_supabase_storage.py --service-key")
                print("Or update bucket permissions in the Supabase dashboard.")
            return False
            
        if files:
            print(f"\nFound {len(files)} files in 'resumes' bucket:")
            for file in files:
                if isinstance(file, dict):
                    print(f"  - {file.get('name')} (size: {file.get('metadata', {}).get('size', 'N/A')} bytes)")
                else:
                    print(f"  - {file}")
        else:
            print("\nNo files found in 'resumes' bucket.")
        
        # Create a test file
        test_file_content = f"Test file created at {datetime.now().isoformat()}"
        test_file_path = "test_connection.txt"
        
        print(f"\nUploading test file to 'resumes' bucket: {test_file_path}")
        try:
            # Create a temporary file
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w+', delete=False) as temp_file:
                temp_file.write(test_file_content)
                temp_file_path = temp_file.name
            
            # Upload the temporary file
            upload_response = supabase.storage.from_('resumes').upload(
                test_file_path,
                temp_file_path
            )
            
            # Clean up the temporary file
            os.remove(temp_file_path)
            
            # Check response format
            upload_error = None
            if hasattr(upload_response, 'error'):
                upload_error = upload_response.error
            
            if upload_error:
                print(f"Error uploading test file: {upload_error.message}")
                if 'Unauthorized' in str(upload_error) and not use_service_key:
                    print("\nPermission denied. Check if the anonymous key has write access to the 'resumes' bucket.")
                    print("Try running the test with the service role key: python test_supabase_storage.py --service-key")
                    print("Or update bucket permissions in the Supabase dashboard.")
                return False
                
            print("Test file uploaded successfully.")
            
            # Get public URL for the test file
            url_response = supabase.storage.from_('resumes').get_public_url(test_file_path)
            print(f"Public URL for test file: {url_response}")
            
            # Clean up - delete the test file
            print("\nCleaning up - deleting test file...")
            delete_response = supabase.storage.from_('resumes').remove([test_file_path])
            
            # Check response format
            delete_error = None
            if hasattr(delete_response, 'error'):
                delete_error = delete_response.error
            
            if delete_error:
                print(f"Error deleting test file: {delete_error.message}")
                if 'Unauthorized' in str(delete_error) and not use_service_key:
                    print("\nPermission denied. Check if the anonymous key has delete access to the 'resumes' bucket.")
                    print("Try running the test with the service role key: python test_supabase_storage.py --service-key")
                    print("Or update bucket permissions in the Supabase dashboard.")
            else:
                print("Test file deleted successfully.")
        except Exception as e:
            print(f"Error during file operations: {str(e)}")
            if 'Unauthorized' in str(e) and not use_service_key:
                print("\nPermission denied during file operations.")
                print("Try running the test with the service role key: python test_supabase_storage.py --service-key")
                print("Or update bucket permissions in the Supabase dashboard.")
            return False
            
        return True
        
    except Exception as e:
        print(f"Error testing 'resumes' bucket: {str(e)}")
        if 'Unauthorized' in str(e) and not use_service_key:
            print("\nPermission denied. This operation may require the service role key.")
            print("Try running the test with the service role key: python test_supabase_storage.py --service-key")
            print("Or update bucket permissions in the Supabase dashboard.")
        return False

if __name__ == "__main__":
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Test Supabase Storage connection and operations')
    parser.add_argument('--service-key', action='store_true', help='Use service role key instead of anonymous key')
    args = parser.parse_args()
    
    # Check if we're using service key
    use_service_key = args.service_key
    
    # Get environment variables
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    
    if use_service_key:
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        key_type = 'Service Role Key'
    else:
        supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
        key_type = 'Anonymous Key'
    
    print(f"Supabase URL: {supabase_url}")
    print(f"Supabase {key_type}: {'Set (length: ' + str(len(supabase_key)) + ')' if supabase_key else 'Not set'}")
    
    if not supabase_url or not supabase_key:
        print("Error: Supabase configuration is missing. Please check your environment variables.")
        print("\nRequired environment variables:")
        print("  - VITE_SUPABASE_URL: Your Supabase project URL")
        if use_service_key:
            print("  - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (for administrative operations)")
        else:
            print("  - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous key")
            print("\nFor administrative operations, you may need to use the service role key:")
            print("  python test_supabase_storage.py --service-key")
        sys.exit(1)
    
    # Test connection
    connection_ok = test_supabase_storage_connection(use_service_key)
    
    if connection_ok:
        print("\n✅ Supabase Storage connection successful!")
        
        # Test resume bucket
        bucket_ok = test_resume_bucket(use_service_key)
        
        if bucket_ok:
            print("\n✅ 'resumes' bucket operations successful!")
        else:
            print("\n❌ 'resumes' bucket operations failed!")
    else:
        print("\n❌ Supabase Storage connection failed!")
