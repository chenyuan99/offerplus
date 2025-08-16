import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
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

interface ApplicationRecord {
  job_title: string;
  job_link: string;
  company_link: string;
  status: string;
  date_applied: string;
}

async function uploadApplications(filePath: string) {
  try {
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: ['job_title', 'job_link', 'company_link', 'status', 'date_applied'],
      skip_empty_lines: true,
      from_line: 2, // Skip header row
      trim: true,
    }) as Omit<ApplicationRecord, 'id'>[];

    console.log(`Found ${records.length} records to process`);

    // Transform records
    const transformedRecords = records.map((record, index) => {
      try {
        // Map CSV columns to database columns
        const transformed = {
          job_title: record.job_title?.trim() || '',
          job_link: record.job_link?.trim() || '',
          company_link: record.company_link?.trim() || '',
          status: record.status?.trim().toLowerCase() || 'applied',
          date_applied: record.date_applied ? new Date(record.date_applied).toISOString() : new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Remove any undefined or null values
        Object.keys(transformed).forEach(key => {
          if (transformed[key] === undefined || transformed[key] === null) {
            delete transformed[key];
          }
        });
        
        return transformed;
      } catch (error) {
        console.error(`Error processing record ${index + 1}:`, error);
        console.error('Record data:', record);
        return null;
      }
    }).filter(record => record !== null); // Remove any null records from errors

    // Insert records in smaller batches to avoid timeouts
    const batchSize = 20;
    let insertedCount = 0;
    const errors: Array<{ batch: number; error: string }> = [];

    for (let i = 0; i < transformedRecords.length; i += batchSize) {
      const batch = transformedRecords.slice(i, i + batchSize);
      
      try {
        console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}...`);
        const { data, error } = await supabase
          .from('applications')
          .insert(batch)
          .select(); // Add .select() to get the inserted rows back

        if (error) {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
          errors.push({
            batch: Math.floor(i / batchSize) + 1,
            error: error.message
          });
          continue;
        }

        insertedCount += batch.length;
        console.log(`Successfully inserted ${insertedCount}/${transformedRecords.length} records`);
      } catch (error: any) {
        console.error(`Unexpected error with batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        errors.push({
          batch: Math.floor(i / batchSize) + 1,
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
const filePath = process.argv[2] || path.join(__dirname, '../../applications (1).csv');

// Run the upload
uploadApplications(filePath);
