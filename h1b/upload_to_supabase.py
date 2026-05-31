"""
Script to upload H1B data to Supabase database.
Run the SQL migrations first, then use this script to upload parsed data.
"""
import os
import json
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

TABLE = 'h1b_applications'

DATE_FIELDS = {'RECEIVED_DATE', 'DECISION_DATE', 'BEGIN_DATE', 'END_DATE'}
NUMERIC_FIELDS = {'WAGE_RATE_OF_PAY_FROM', 'WAGE_RATE_OF_PAY_TO', 'PREVAILING_WAGE'}
TEXT_FIELDS = {'EMPLOYER_POSTAL_CODE', 'WORKSITE_POSTAL_CODE'}

FIELD_MAP = {
    'CASE_NUMBER': 'case_number', 'CASE_STATUS': 'case_status',
    'RECEIVED_DATE': 'received_date', 'DECISION_DATE': 'decision_date',
    'VISA_CLASS': 'visa_class', 'JOB_TITLE': 'job_title',
    'SOC_CODE': 'soc_code', 'SOC_TITLE': 'soc_title',
    'FULL_TIME_POSITION': 'full_time_position',
    'BEGIN_DATE': 'begin_date', 'END_DATE': 'end_date',
    'EMPLOYER_NAME': 'employer_name', 'EMPLOYER_CITY': 'employer_city',
    'EMPLOYER_STATE': 'employer_state', 'EMPLOYER_POSTAL_CODE': 'employer_postal_code',
    'WORKSITE_CITY': 'worksite_city', 'WORKSITE_STATE': 'worksite_state',
    'WORKSITE_POSTAL_CODE': 'worksite_postal_code',
    'WAGE_RATE_OF_PAY_FROM': 'wage_rate_of_pay_from',
    'WAGE_RATE_OF_PAY_TO': 'wage_rate_of_pay_to',
    'WAGE_UNIT_OF_PAY': 'wage_unit_of_pay', 'PREVAILING_WAGE': 'prevailing_wage',
}


def _err(msg: str, exc: Exception) -> None:
    print(f"❌ {msg}: {exc}")


def get_supabase_client() -> Client:
    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not key:
        print("Warning: SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key.")
        key = os.getenv('VITE_SUPABASE_ANON_KEY')
    if not url or not key:
        raise ValueError("Missing Supabase environment variables")
    return create_client(url, key)


def _coerce(json_key: str, value):
    """Coerce a raw value to the correct Python type for its DB column."""
    if value is None or value == '' or (isinstance(value, str) and not value.strip()):
        return None
    if json_key in DATE_FIELDS:
        return value if isinstance(value, str) else None
    if json_key in NUMERIC_FIELDS:
        try:
            return float(value)
        except (TypeError, ValueError):
            return None
    if json_key in TEXT_FIELDS:
        return str(value)
    return str(value)


def convert_record_for_db(record: dict) -> dict:
    return {db_key: _coerce(json_key, record.get(json_key))
            for json_key, db_key in FIELD_MAP.items()}


def _insert_batch(supabase: Client, batch: list) -> int:
    """Insert a batch; fall back to row-by-row on duplicate key errors. Returns upload count."""
    try:
        result = supabase.table(TABLE).insert(batch).execute()
        return len(result.data) if result.data else 0
    except Exception as e:
        msg = str(e).lower()
        if 'duplicate key' not in msg and 'unique constraint' not in msg:
            raise
        count = 0
        for record in batch:
            try:
                r = supabase.table(TABLE).insert(record).execute()
                count += bool(r.data)
            except Exception as row_err:
                if 'duplicate key' not in str(row_err).lower():
                    print(f"  Row error: {row_err}")
        return count


def upload_h1b_data(supabase: Client, json_file_path: str, batch_size: int = 100) -> bool:
    print(f"Loading H1B data from {json_file_path}...")
    try:
        with open(json_file_path, 'r', encoding='utf-8') as fh:
            data = json.load(fh)
    except Exception as e:
        _err("Error loading data file", e)
        return False

    print(f"Loaded {len(data)} records — converting...")
    db_records = []
    for i, record in enumerate(data):
        try:
            db_records.append(convert_record_for_db(record))
        except Exception as e:
            print(f"  Warning: skipping record {i}: {e}")

    total_uploaded = 0
    total_batches = (len(db_records) + batch_size - 1) // batch_size
    for idx in range(0, len(db_records), batch_size):
        batch = db_records[idx:idx + batch_size]
        batch_num = idx // batch_size + 1
        print(f"Uploading batch {batch_num}/{total_batches} ({len(batch)} records)...")
        try:
            total_uploaded += _insert_batch(supabase, batch)
        except Exception as e:
            _err(f"Batch {batch_num} failed", e)

    if db_records:
        rate = total_uploaded / len(db_records) * 100
        print(f"\n📊 Upload Summary: {total_uploaded}/{len(db_records)} records ({rate:.1f}%)")
    return total_uploaded > 0


def verify_upload(supabase: Client) -> bool:
    print("\nVerifying uploaded data...")
    try:
        result = supabase.table(TABLE).select('id', count='exact').execute()
        count = result.count if hasattr(result, 'count') else len(result.data)
        print(f"Total records in database: {count}")

        sample = supabase.table(TABLE).select('id').limit(5).execute()
        if sample.data:
            print(f"Sample check: {len(sample.data)} record(s) accessible.")

        stats = supabase.table(TABLE).select('case_status').execute()
        if stats.data:
            status_counts: dict = {}
            for row in stats.data:
                s = row.get('case_status', 'Unknown')
                status_counts[s] = status_counts.get(s, 0) + 1
            print("\nStatus breakdown:")
            for status, n in sorted(status_counts.items()):
                print(f"  {status}: {n}")
        return True
    except Exception as e:
        _err("Error verifying data", e)
        return False


def main():
    print("🚀 H1B Data Upload to Supabase\n" + "=" * 40)

    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')
    if not url or not key:
        print("❌ Missing Supabase env vars (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
        sys.exit(1)

    try:
        supabase = get_supabase_client()
        print("✅ Connected to Supabase")
    except Exception as e:
        _err("Connection failed", e)
        sys.exit(1)

    json_candidates = [
        'data/output/LCA_Disclosure_Data_FY2025_Q3.json',
        'data/output/sample.json',
    ]
    json_file = next((p for p in json_candidates if os.path.exists(p)), None)
    if not json_file:
        print("❌ No JSON data file found. Run the parser first.")
        sys.exit(1)

    print(f"📁 Using data file: {json_file}")
    if upload_h1b_data(supabase, json_file):
        verify_upload(supabase)
        print("\n🎉 H1B data successfully uploaded to Supabase!")
    else:
        print("❌ Data upload failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
