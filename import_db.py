

#!/usr/bin/env python3
import psycopg2
import sys

# Supabase credentials (using Session pooler)
DB_CONFIG = {
    'host': 'aws-1-us-east-1.pooler.supabase.com',
    'port': 5432,
    'user': 'postgres.lwexhbimtxpndhsidogl',
    'password': 'elvpfW5zDRe76XwS',
    'database': 'postgres',
}

def import_sql_dump(sql_file):
    """Import SQL dump to Supabase database"""
    try:
        # Read and clean the SQL file
        with open(sql_file, 'r') as f:
            content = f.read()

        # Filter out psql metacommands and comment metadata
        lines = content.split('\n')
        cleaned_lines = []

        for line in lines:
            stripped = line.strip()
            # Skip psql metacommands and comment metadata
            if stripped.startswith('\\'):
                continue
            if stripped.startswith('--') and any(x in stripped.lower() for x in ['schema:', 'owner:', 'name:', 'definition:']):
                continue
            # Keep regular comments and SQL
            cleaned_lines.append(line)

        sql_content = '\n'.join(cleaned_lines)

        print(f"📂 Reading SQL dump: {sql_file}")
        print(f"📊 Original size: {sum(len(line) for line in lines) / 1024 / 1024:.2f} MB")
        print(f"📊 Cleaned size: {len(sql_content) / 1024 / 1024:.2f} MB")

        # Connect to database
        print(f"🔌 Connecting to Supabase...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()

        print("✅ Connected!")

        # Execute SQL dump statement by statement
        print("⏳ Importing database dump...")
        statements = sql_content.split(';')

        success_count = 0
        error_count = 0

        for i, statement in enumerate(statements):
            statement = statement.strip()
            if not statement:
                continue

            try:
                cursor.execute(statement)
                success_count += 1

                # Show progress every 100 statements
                if (i + 1) % 100 == 0:
                    print(f"  ✓ {i + 1} statements processed...")

            except psycopg2.Error as e:
                error_count += 1
                # Skip expected errors (role/schema already exists, etc.)
                error_msg = str(e).lower()
                if any(x in error_msg for x in ['already exists', 'duplicate', 'constraint']):
                    continue
                else:
                    print(f"  ⚠️  Error at statement {i + 1}: {e}")

        print(f"\n✅ Import completed!")
        print(f"   ✓ Successful: {success_count}")
        print(f"   ⚠️  Skipped/Failed: {error_count}")

        # Verify - count tables
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = 'public'
        """)
        table_count = cursor.fetchone()[0]
        print(f"📋 Tables imported: {table_count}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    import_sql_dump('db_backup.sql')
