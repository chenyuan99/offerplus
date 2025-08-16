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

async function listTables() {
  try {
    // List all tables in the public schema
    const { data, error } = await supabase.rpc('list_tables');
    
    if (error) {
      // If the RPC function doesn't exist, try a different approach
      console.log('Error calling list_tables RPC, trying direct query...');
      
      // Use a direct SQL query to list tables
      const { data: tables, error: queryError } = await supabase
        .rpc('query', { query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" });
      
      if (queryError) {
        console.error('Error fetching tables:', queryError);
        return;
      }
      
      console.log('Tables in the database:');
      console.table(tables);
      return;
    }
    
    console.log('Tables in the database:');
    console.table(data);
  } catch (error) {
    console.error('Error:', error);
  }
}

listTables();
