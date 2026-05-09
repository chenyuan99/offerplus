"""
Configuration script to set up the H1B Data Viewer with Supabase credentials.
This script updates the HTML file with your Supabase configuration.
"""
import os
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_config():
    """Get Supabase configuration from environment variables"""
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    supabase_anon_key = os.getenv('VITE_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_anon_key:
        print("❌ Supabase configuration not found in environment variables.")
        print("\nPlease set the following environment variables:")
        print("VITE_SUPABASE_URL=your_supabase_url")
        print("VITE_SUPABASE_ANON_KEY=your_anon_key")
        return None, None
    
    return supabase_url, supabase_anon_key

def update_html_config(html_file_path, supabase_url, supabase_anon_key):
    """Update the HTML file with Supabase configuration"""
    try:
        # Read the HTML file
        with open(html_file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace the configuration placeholders
        content = re.sub(
            r"url: 'YOUR_SUPABASE_URL'",
            f"url: '{supabase_url}'",
            content
        )
        
        content = re.sub(
            r"anonKey: 'YOUR_SUPABASE_ANON_KEY'",
            f"anonKey: '{supabase_anon_key}'",
            content
        )
        
        # Write the updated content back
        with open(html_file_path, 'w', encoding='utf-8') as file:
            file.write(content)
        
        print(f"✅ Successfully updated {html_file_path} with Supabase configuration")
        return True
        
    except Exception as e:
        print(f"❌ Error updating HTML file: {str(e)}")
        return False

def main():
    """Main configuration function"""
    print("🔧 H1B Data Viewer Configuration")
    print("=" * 35)
    
    # Get Supabase configuration
    supabase_url, supabase_anon_key = get_supabase_config()
    
    if not supabase_url or not supabase_anon_key:
        return
    
    print(f"Supabase URL: {supabase_url}")
    print(f"Supabase Anon Key: {supabase_anon_key[:20]}...")
    
    # Find the HTML file
    html_file_paths = [
        '../h1b-data-viewer.html',  # Parent directory
        'h1b-data-viewer.html',    # Current directory
        '../h1b-data-viewer.html'  # Alternative path
    ]
    
    html_file = None
    for path in html_file_paths:
        if os.path.exists(path):
            html_file = path
            break
    
    if not html_file:
        print("❌ H1B Data Viewer HTML file not found.")
        print("Please ensure h1b-data-viewer.html is in the correct location.")
        return
    
    print(f"📁 Found HTML file: {html_file}")
    
    # Update the HTML file
    if update_html_config(html_file, supabase_url, supabase_anon_key):
        print("\n🎉 Configuration completed successfully!")
        print("\nNext steps:")
        print("1. Make sure you've uploaded your H1B data to Supabase:")
        print("   python upload_to_supabase.py")
        print("2. Open the h1b-data-viewer.html file in your browser")
        print("3. The viewer should now load data from your Supabase database")
    else:
        print("\n❌ Configuration failed!")

if __name__ == "__main__":
    main()