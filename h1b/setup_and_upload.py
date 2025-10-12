"""
Setup script to install dependencies and upload H1B data to Supabase.
This script handles the complete process from setup to data upload.
"""
import subprocess
import sys
import os

def install_requirements():
    """Install required Python packages"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False

def check_env_file():
    """Check if .env file exists in the root directory"""
    env_file_paths = [
        '../.env',  # Root directory
        '../../.env',  # In case we're in a subdirectory
        '.env'  # Current directory
    ]
    
    for env_path in env_file_paths:
        if os.path.exists(env_path):
            print(f"✅ Found .env file at: {env_path}")
            return True
    
    print("⚠️ No .env file found. Please create one with your Supabase credentials:")
    print("\nRequired environment variables:")
    print("VITE_SUPABASE_URL=your_supabase_url")
    print("SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
    print("VITE_SUPABASE_ANON_KEY=your_anon_key")
    return False

def check_data_files():
    """Check if data files exist"""
    data_files = [
        'data/output/LCA_Disclosure_Data_FY2025_Q3.json',
        'data/output/sample.json'
    ]
    
    existing_files = []
    for file_path in data_files:
        if os.path.exists(file_path):
            existing_files.append(file_path)
            print(f"✅ Found data file: {file_path}")
    
    if not existing_files:
        print("⚠️ No data files found. Please run the parser first:")
        print("python parser.py")
        return False
    
    return True

def run_upload():
    """Run the upload script"""
    print("\n🚀 Starting H1B data upload to Supabase...")
    try:
        subprocess.check_call([sys.executable, 'upload_to_supabase.py'])
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running upload: {e}")
        return False

def main():
    """Main setup and upload process"""
    print("🔧 H1B Data Upload Setup")
    print("=" * 30)
    
    # Check if we're in the right directory
    if not os.path.exists('parser.py'):
        print("❌ Please run this script from the h1b directory")
        sys.exit(1)
    
    # Install dependencies
    if not install_requirements():
        print("❌ Failed to install dependencies. Please install manually:")
        print("pip install -r requirements.txt")
        sys.exit(1)
    
    # Check environment file
    if not check_env_file():
        print("❌ Please create a .env file with your Supabase credentials")
        sys.exit(1)
    
    # Check data files
    if not check_data_files():
        print("❌ Please run the parser first to generate data files")
        sys.exit(1)
    
    # Run upload
    if run_upload():
        print("\n🎉 Setup and upload completed successfully!")
    else:
        print("\n❌ Upload failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main()