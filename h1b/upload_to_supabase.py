"""
Script to upload H1B data to Supabase database.
This script creates the necessary table and uploads the parsed H1B data.
"""
import os
import json
import sys
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import pandas as pd

# Load environment variables from .env file
load_dotenv()


def get_supabase_client() -> Client:
    """Create a Supabase client using environment variables"""
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    # Use service role key for database operations
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_key:
        print("Warning: SUPABASE_SERVICE_ROLE_KEY not found. Falling back to anon key.")
        supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')

    if not supabase_url or not supabase_key:
        raise ValueError("Missing Supabase environment variables")

    return create_client(supabase_url, supabase_key)


def create_h1b_table(supabase: Client):
    """Create the H1B applications table if it doesn't exist"""
    print("Creating H1B applications table...")

    try:
        # First, check if table already exists
        try:
            result = supabase.table('h1b_applications').select(
                'id').limit(1).execute()
            print("✅ Table 'h1b_applications' already exists!")
            return True
        except Exception:
            print("Table doesn't exist, creating it...")

        # Create table using Supabase SQL editor approach
        print("Please create the table manually in your Supabase dashboard:")
        print("\n1. Go to your Supabase project dashboard")
        print("2. Navigate to 'SQL Editor'")
        print("3. Run the following SQL:")

        create_table_sql = """
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

        print(create_table_sql)
        print("\n4. After running the SQL, press Enter to continue...")
        input()

        # Verify table was created
        try:
            result = supabase.table('h1b_applications').select(
                'id').limit(1).execute()
            print("✅ Table verified successfully!")
            return True
        except Exception as e:
            print(f"❌ Table verification failed: {str(e)}")
            return False

    except Exception as e:
        print(f"❌ Error in table creation process: {str(e)}")
        return False


def convert_record_for_db(record):
    """Convert a JSON record to database format"""
    # Focus on essential fields that match our simplified table schema
    db_record = {}

    # Essential fields mapping
    field_mapping = {
        'CASE_NUMBER': 'case_number',
        'CASE_STATUS': 'case_status',
        'RECEIVED_DATE': 'received_date',
        'DECISION_DATE': 'decision_date',
        'VISA_CLASS': 'visa_class',
        'JOB_TITLE': 'job_title',
        'SOC_CODE': 'soc_code',
        'SOC_TITLE': 'soc_title',
        'FULL_TIME_POSITION': 'full_time_position',
        'BEGIN_DATE': 'begin_date',
        'END_DATE': 'end_date',
        'EMPLOYER_NAME': 'employer_name',
        'EMPLOYER_CITY': 'employer_city',
        'EMPLOYER_STATE': 'employer_state',
        'EMPLOYER_POSTAL_CODE': 'employer_postal_code',
        'WORKSITE_CITY': 'worksite_city',
        'WORKSITE_STATE': 'worksite_state',
        'WORKSITE_POSTAL_CODE': 'worksite_postal_code',
        'WAGE_RATE_OF_PAY_FROM': 'wage_rate_of_pay_from',
        'WAGE_RATE_OF_PAY_TO': 'wage_rate_of_pay_to',
        'WAGE_UNIT_OF_PAY': 'wage_unit_of_pay',
        'PREVAILING_WAGE': 'prevailing_wage'
    }

    for json_key, db_key in field_mapping.items():
        value = record.get(json_key)

        # Handle null values
        if value is None or value == '' or (isinstance(value, str) and value.strip() == ''):
            db_record[db_key] = None
        # Handle date fields
        elif json_key.endswith('_DATE') and value:
            try:
                # Keep ISO date string format
                db_record[db_key] = value if isinstance(value, str) else None
            except:
                db_record[db_key] = None
        # Handle numeric fields
        elif json_key in ['WAGE_RATE_OF_PAY_FROM', 'WAGE_RATE_OF_PAY_TO', 'PREVAILING_WAGE']:
            try:
                db_record[db_key] = float(value) if value is not None else None
            except:
                db_record[db_key] = None
        # Handle postal codes as text
        elif json_key in ['EMPLOYER_POSTAL_CODE', 'WORKSITE_POSTAL_CODE']:
            db_record[db_key] = str(value) if value is not None else None
        else:
            # Default: convert to string
            db_record[db_key] = str(value) if value is not None else None

    return db_record


def upload_h1b_data(supabase: Client, json_file_path: str, batch_size: int = 100):
    """Upload H1B data from JSON file to Supabase"""
    print(f"Loading H1B data from {json_file_path}...")

    try:
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        print(f"Loaded {len(data)} records from JSON file")

        # Convert records for database
        print("Converting records for database...")
        db_records = []
        for i, record in enumerate(data):
            try:
                db_record = convert_record_for_db(record)
                db_records.append(db_record)
            except Exception as e:
                print(f"Warning: Error converting record {i}: {str(e)}")
                continue

        print(f"Successfully converted {len(db_records)} records")

        # Upload in batches
        total_uploaded = 0
        total_errors = 0

        for i in range(0, len(db_records), batch_size):
            batch = db_records[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(db_records) + batch_size - 1) // batch_size

            print(
                f"Uploading batch {batch_num}/{total_batches} ({len(batch)} records)...")

            try:
                # Insert batch
                result = supabase.table(
                    'h1b_applications').insert(batch).execute()

                if result.data:
                    uploaded_count = len(result.data)
                    total_uploaded += uploaded_count
                    print(
                        f"✅ Successfully uploaded {uploaded_count} records in batch {batch_num}")
                else:
                    print(f"⚠️ No data returned for batch {batch_num}")

            except Exception as e:
                error_msg = str(e)
                print(f"❌ Error uploading batch {batch_num}: {error_msg}")
                total_errors += len(batch)

                # If it's a duplicate key error, try individual inserts
                if 'duplicate key' in error_msg.lower() or 'unique constraint' in error_msg.lower():
                    print(
                        f"Attempting individual inserts for batch {batch_num} due to duplicates...")
                    for j, record in enumerate(batch):
                        try:
                            result = supabase.table(
                                'h1b_applications').insert(record).execute()
                            if result.data:
                                total_uploaded += 1
                                total_errors -= 1  # Subtract from error count since this succeeded
                        except Exception as individual_error:
                            if 'duplicate key' not in str(individual_error).lower():
                                print(
                                    f"Error inserting individual record {j}: {str(individual_error)}")
                            # Skip duplicates silently
                            pass

        print(f"\n📊 Upload Summary:")
        print(f"Total records processed: {len(db_records)}")
        print(f"Successfully uploaded: {total_uploaded}")
        print(f"Errors/Duplicates: {total_errors}")
        print(f"Success rate: {(total_uploaded / len(db_records) * 100):.1f}%")

        return total_uploaded > 0

    except Exception as e:
        print(f"❌ Error loading or uploading data: {str(e)}")
        return False


def verify_upload(supabase: Client):
    """Verify the uploaded data"""
    print("\nVerifying uploaded data...")

    try:
        # Get total count
        result = supabase.table('h1b_applications').select(
            'id', count='exact').execute()
        total_count = result.count if hasattr(
            result, 'count') else len(result.data)
        print(f"Total records in database: {total_count}")

        # Get sample records
        sample_result = supabase.table(
            'h1b_applications').select('*').limit(5).execute()
        if sample_result.data:
            print(f"\nSample records:")
            for i, record in enumerate(sample_result.data[:3]):
                print(
                    f"  {i+1}. Case: {record.get('case_number')}, Employer: {record.get('employer_name')}, Status: {record.get('case_status')}")

        # Get statistics
        stats_result = supabase.table(
            'h1b_applications').select('case_status').execute()
        if stats_result.data:
            status_counts = {}
            for record in stats_result.data:
                status = record.get('case_status', 'Unknown')
                status_counts[status] = status_counts.get(status, 0) + 1

            print(f"\nStatus breakdown:")
            for status, count in sorted(status_counts.items()):
                print(f"  {status}: {count}")

        return True

    except Exception as e:
        print(f"❌ Error verifying data: {str(e)}")
        return False


def main():
    """Main function to upload H1B data to Supabase"""
    print("🚀 H1B Data Upload to Supabase")
    print("=" * 40)

    # Check environment variables
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv(
        'VITE_SUPABASE_ANON_KEY')

    print(f"Supabase URL: {supabase_url}")
    print(
        f"Supabase Key: {'Set (length: ' + str(len(supabase_key)) + ')' if supabase_key else 'Not set'}")

    if not supabase_url or not supabase_key:
        print("❌ Error: Supabase configuration is missing. Please check your environment variables.")
        print("\nRequired environment variables:")
        print("  - VITE_SUPABASE_URL: Your Supabase project URL")
        print("  - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (recommended)")
        print("  - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous key (fallback)")
        sys.exit(1)

    try:
        # Create Supabase client
        supabase = get_supabase_client()
        print("✅ Connected to Supabase")

        # Create table
        if not create_h1b_table(supabase):
            print("❌ Failed to create table. Please create it manually and try again.")
            return

        # Determine which JSON file to upload
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
            print("❌ No JSON data file found. Please run the parser first.")
            print("Available files should be in:")
            for file_path in json_files:
                print(f"  - {file_path}")
            return

        print(f"📁 Using data file: {json_file}")

        # Upload data
        if upload_h1b_data(supabase, json_file):
            print("✅ Data upload completed!")

            # Verify upload
            verify_upload(supabase)

            print("\n🎉 H1B data successfully uploaded to Supabase!")
            print("\nYou can now:")
            print("1. View the data in your Supabase dashboard")
            print("2. Use the H1B Data Viewer application")
            print("3. Query the data using the Supabase API")

        else:
            print("❌ Data upload failed!")

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
