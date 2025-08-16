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

async function checkTable() {
  try {
    // Try to get a single record to see the structure
    const { data, error, count } = await supabase
      .from('tracks_applicationrecord')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error accessing tracks_applicationrecord:', error);
      return;
    }

    console.log(`Found ${count} records in tracks_applicationrecord`);
    
    if (count && count > 0) {
      // If we have data, show the first record's structure
      const { data: record } = await supabase
        .from('tracks_applicationrecord')
        .select('*')
        .limit(1);
      
      console.log('Table structure from first record:');
      console.log(record);
    } else {
      console.log('The table is empty');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTable();
