import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
  try {
    // Try to get the column information using the information_schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('query', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'tracks_applicationrecord'
          ORDER BY ordinal_position;
        `,
      });

    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      
      // If the first approach fails, try a different method
      console.log('Trying alternative method to inspect table...');
      
      // Try to get a single record to see the structure
      const { data: record, error: recordError } = await supabase
        .from('tracks_applicationrecord')
        .select('*')
        .limit(1)
        .single();

      if (recordError) {
        console.error('Error fetching record:', recordError);
        return;
      }

      console.log('Table columns (from record sample):', Object.keys(record || {}));
      return;
    }

    console.log('Table columns:');
    console.table(columns);
  } catch (error) {
    console.error('Error inspecting table:', error);
  }
}

// Run the inspection
inspectTable();
