import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureTableExists() {
  console.log('Ensuring tracks_applicationrecord table exists...');
  
  try {
    // Try to create the table directly
    console.log('Creating tracks_applicationrecord table if it doesn\'t exist...');
    const { error: createError } = await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.tracks_applicationrecord (
          id SERIAL PRIMARY KEY,
          job_title TEXT,
          job_link TEXT,
          company_link TEXT,
          status TEXT,
          date_applied TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (createError) {
      console.error('Error creating table:', createError);
      throw new Error('Failed to create table');
    }
    
    console.log('Table created or already exists');
  } catch (error) {
    console.error('Error ensuring table exists:', error);
    throw error;
  }
}

interface ApplicationRecord {
  job_title: string;
  job_link: string;
  company_link: string;
  status: string;
  date_applied: string;
}

async function uploadApplications(filePath: string) {
  try {
    // Ensure the table exists
    await ensureTableExists();
    
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: ['job_title', 'job_link', 'company_link', 'status', 'date_applied'],
      skip_empty_lines: true,
      from_line: 2, // Skip header row
      trim: true,
    }) as Omit<ApplicationRecord, 'id'>[];

    console.log(`Found ${records.length} records to process`);

    // Transform and insert records
    const transformedRecords = records.map(record => ({
      job_title: record.job_title.trim(),
      job_link: record.job_link.trim(),
      company_link: record.company_link.trim(),
      status: record.status.trim().toLowerCase(),
      date_applied: new Date(record.date_applied).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert records in smaller batches to avoid timeouts
    const batchSize = 20;
    let insertedCount = 0;
    let errors: any[] = [];

    for (let i = 0; i < transformedRecords.length; i += batchSize) {
      const batch = transformedRecords.slice(i, i + batchSize);
      
      try {
        console.log(`Inserting batch ${i / batchSize + 1}...`);
        const { error } = await supabase
          .from('tracks_applicationrecord')
          .insert(batch);

        if (error) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
          errors.push({
            batch: i / batchSize + 1,
            error: error.message
          });
          continue;
        }

        insertedCount += batch.length;
        console.log(`Successfully inserted ${insertedCount}/${transformedRecords.length} records`);
      } catch (error: any) {
        console.error(`Unexpected error with batch ${i / batchSize + 1}:`, error.message);
        errors.push({
          batch: i / batchSize + 1,
          error: error.message
        });
      }
      
      // Add a small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (errors.length > 0) {
      console.warn(`\nCompleted with ${errors.length} batch errors out of ${Math.ceil(transformedRecords.length / batchSize)} batches`);
      console.warn('Error summary:');
      errors.forEach(err => {
        console.warn(`- Batch ${err.batch}: ${err.error}`);
      });
    }

    console.log(`Successfully uploaded ${insertedCount} records to tracks_applicationrecord`);
  } catch (error) {
    console.error('Error uploading applications:', error);
    process.exit(1);
  }
}

// Get the file path from command line arguments or use the default
const filePath = process.argv[2] || path.join(__dirname, '../applications (1).csv');

// Run the upload
uploadApplications(filePath);
