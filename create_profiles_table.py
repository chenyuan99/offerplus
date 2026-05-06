#!/usr/bin/env python3
import psycopg2
import sys

DB_CONFIG = {
    'host': 'aws-1-us-east-1.pooler.supabase.com',
    'port': 5432,
    'user': 'postgres.lwexhbimtxpndhsidogl',
    'password': 'elvpfW5zDRe76XwS',
    'database': 'postgres',
}

def create_profiles_table():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()

        print("📝 Creating profiles table...")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                resume TEXT,
                resume_name TEXT,
                resume_url TEXT,
                resume_updated_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        print("✅ Table created")

        print("📝 Creating RLS policies...")

        cursor.execute("""
            ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        """)

        cursor.execute("""
            CREATE POLICY "Users can view their own profile" ON profiles
            FOR SELECT USING (auth.uid() = id);
        """)

        cursor.execute("""
            CREATE POLICY "Users can update their own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
        """)

        cursor.execute("""
            CREATE POLICY "Users can insert their own profile" ON profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
        """)

        print("✅ RLS policies created")

        cursor.close()
        conn.close()

        print("\n✅ Profiles table setup complete!")

    except psycopg2.Error as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    create_profiles_table()
