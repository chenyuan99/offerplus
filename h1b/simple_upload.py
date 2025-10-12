"""
Simple H1B data upload script for Supabase.
This script assumes the table already exists and focuses on data upload.
"""
import os
import json
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Create a Supabase client using environment variables"""
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_key:
        print("Warning: SUPABASE_SERVICE_ROLE_KEY not found. Using anon key.")
        supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        raise ValueError("Missing Supabase environment variables")
        
    return create_client(supabase_url, supabase_key)

def create_table_sql():
    """Return the SQL to create the table"""
    return """
-- Create H1B applications table
CREATE TABLE IF NOT EXISTS h1b_applications (
    id BIGSERIAL PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    case_status TEXT,
    received_date TIMESTAMPTZ,
    decision_date TIMESTAMPTZ,
    visa_class TEXT,
    job_title TEXT,
    soc_code TEXT,
    soc_title TEXT,
    full_time_position TEXT,
    begin_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    employer_name TEXT,
    employer_city TEXT,
    employer_state TEXT,
    employer_postal_code TEXT,
    worksite_city TEXT,
    worksite_state TEXT,
    worksite_postal_code TEXT,
    wage_rate_of_pay_from NUMERIC,
    wage_rate_of_pay_to NUMERIC,
    wage_unit_of_pay TEXT,
    prevailing_wage NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_h1b_employer_name ON h1b_applications(employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_case_status ON h1b_applications(case_status);
CREATE INDEX IF NOT EXISTS idx_h1b_job_title ON h1b_applications(job_title);
CREATE INDEX IF NOT EXISTS idx_h1b_decision_date ON h1b_applications(decision_date);
CREATE INDEX IF NOT EXISTS idx_h1b_wage_rate ON h1b_applications(wage_rate_of_pay_from);

-- Enable Row Level Security (RLS)
ALTER TABLE h1b_applications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY IF NOT EXISTS "Allow public read access" ON h1b_applications
    FOR SELECT USING (true);
"""

def convert_record(record):
    """Convert JSON record to database format"""
    return {
        'case_number': record.get('CASE_NUMBER'),
        'case_status': record.get('CASE_STATUS'),
        'received_date': record.get('RECEIVED_DATE'),
        'decision_date': record.get('DECISION_DATE'),
        'visa_class': record.get('VISA_CLASS'),
        'job_title': record.get('JOB_TITLE'),
        'soc_code': record.get('SOC_CODE'),
        'soc_title': record.get('SOC_TITLE'),
        'full_time_position': record.get('FULL_TIME_POSITION'),
        'begin_date': record.get('BEGIN_DATE'),
        'end_date': record.get('END_DATE'),
        'employer_name': record.get('EMPLOYER_NAME'),
        'employer_city': record.get('EMPLOYER_CITY'),
        'employer_state': record.get('EMPLOYER_STATE'),
        'employer_postal_code': str(record.get('EMPLOYER_POSTAL_CODE')) if record.get('EMPLOYER_POSTAL_CODE') else None,
        'worksite_city': record.get('WORKSITE_CITY'),
        'worksite_state': record.get('WORKSITE_STATE'),
        'worksite_postal_code': str(record.get('WORKSITE_POSTAL_CODE')) if record.get('WORKSITE_POSTAL_CODE') else None,
        'wage_rate_of_pay_from': float(record.get('WAGE_RATE_OF_PAY_FROM')) if record.get('WAGE_RATE_OF_PAY_FROM') else None,
        'wage_rate_of_pay_to': float(record.get('WAGE_RATE_OF_PAY_TO')) if record.get('WAGE_RATE_OF_PAY_TO') else None,
        'wage_unit_of_pay': record.get('WAGE_UNIT_OF_PAY'),
        'prevailing_wage': float(record.get('PREVAILING_WAGE')) if record.get('PREVAILING_WAGE') else None
    }

def main():
    """Main upload function"""
    print("🚀 Simple H1B Data Upload to Supabase")
    print("=" * 40)
    
    # Step 1: Show table creation SQL
    print("STEP 1: Create the table in Supabase")
    print("Go to your Supabase dashboard > SQL Editor and run this SQL:")
    print("-" * 60)
    print(create_table_sql())
    print("-" * 60)
    
    input("Press Enter after you've created the table in Supabase...")
    
    # Step 2: Connect to Supabase
    try:
        supabase = get_supabase_client()
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return
    
    # Step 3: Verify table exists
    try:
        result = supabase.table('h1b_applications').select('id').limit(1).execute()
        print("✅ Table 'h1b_applications' verified")
    except Exception as e:
        print(f"❌ Table verification failed: {e}")
        print("Please make sure you've created the table using the SQL above.")
        return
    
    # Step 4: Load and upload data
    json_files = [
        'data/output/LCA_Disclosure_Data_FY2025_Q3.json',
        'data/output/sample.json'
    ]
    
    json_file = None
    for file_path in json_files:
        if os.path.exists(file_path):
            json_file = file_path
            break
    
    if not json_file:
        print("❌ No JSON data file found. Please run parser.py first.")
        return
    
    print(f"📁 Loading data from: {json_file}")
    
    try:
        with open(json_file, 'r', encoding='utf-8') as file:
            data = json.load(file)
        print(f"✅ Loaded {len(data)} records")
    except Exception as e:
        print(f"❌ Error loading JSON file: {e}")
        return
    
    # Step 5: Upload data in batches
    batch_size = 50  # Smaller batches for reliability
    total_uploaded = 0
    total_errors = 0
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(data) + batch_size - 1) // batch_size
        
        print(f"Uploading batch {batch_num}/{total_batches} ({len(batch)} records)...")
        
        # Convert batch
        converted_batch = []
        for record in batch:
            try:
                converted_record = convert_record(record)
                converted_batch.append(converted_record)
            except Exception as e:
                print(f"Warning: Error converting record: {e}")
                total_errors += 1
        
        # Upload batch
        if converted_batch:
            try:
                result = supabase.table('h1b_applications').insert(converted_batch).execute()
                
                if result.data:
                    uploaded_count = len(result.data)
                    total_uploaded += uploaded_count
                    print(f"✅ Successfully uploaded {uploaded_count} records")
                else:
                    print(f"⚠️ No data returned for batch {batch_num}")
                    
            except Exception as e:
                error_msg = str(e)
                print(f"❌ Error uploading batch {batch_num}: {error_msg}")
                
                # Try individual inserts for duplicates
                if 'duplicate key' in error_msg.lower() or 'unique constraint' in error_msg.lower():
                    print("Attempting individual inserts due to duplicates...")
                    for record in converted_batch:
                        try:
                            result = supabase.table('h1b_applications').insert(record).execute()
                            if result.data:
                                total_uploaded += 1
                        except Exception:
                            total_errors += 1
                            pass  # Skip duplicates silently
                else:
                    total_errors += len(converted_batch)
    
    # Step 6: Summary
    print(f"\n📊 Upload Summary:")
    print(f"Total records processed: {len(data)}")
    print(f"Successfully uploaded: {total_uploaded}")
    print(f"Errors/Duplicates: {total_errors}")
    print(f"Success rate: {(total_uploaded / len(data) * 100):.1f}%")
    
    if total_uploaded > 0:
        print("\n🎉 Upload completed successfully!")
        print("You can now use the H1B Data Viewer with your Supabase data.")
    else:
        print("\n❌ Upload failed. Please check the errors above.")

if __name__ == "__main__":
    main()