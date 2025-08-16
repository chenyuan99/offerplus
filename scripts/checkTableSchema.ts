import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
  try {
    // Get table information using a raw SQL query
    const { data, error } = await supabase.rpc('get_table_columns', {
      table_name: 'tracks_applicationrecord',
      table_schema: 'public'
    });

    if (error) {
      console.error('Error fetching table schema:', error);
      return;
    }

    console.log('Table tracks_applicationrecord schema:');
    console.table(data);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableSchema();
