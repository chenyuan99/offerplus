#!/usr/bin/env node

/**
 * Test Account Creation Script for OfferPlus
 * 
 * This script helps create test accounts for development and testing purposes.
 * It uses the Supabase client to create accounts directly.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please check your frontend/.env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test account configurations
const TEST_ACCOUNTS = [
  {
    email: 'test@offersplus.io',
    password: 'TestPassword123!',
    metadata: {
      first_name: 'Test',
      last_name: 'User',
      role: 'job_seeker'
    }
  },
  {
    email: 'demo@offersplus.io',
    password: 'DemoPassword123!',
    metadata: {
      first_name: 'Demo',
      last_name: 'User',
      role: 'job_seeker'
    }
  },
  {
    email: 'jobseeker@offersplus.io',
    password: 'JobSeeker123!',
    metadata: {
      first_name: 'Job',
      last_name: 'Seeker',
      role: 'job_seeker'
    }
  }
];

async function createTestAccount(accountConfig) {
  console.log(`\n🔄 Creating test account: ${accountConfig.email}`);
  
  try {
    // First, try to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: accountConfig.email,
      password: accountConfig.password,
      options: {
        data: accountConfig.metadata
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`⚠️  Account ${accountConfig.email} already exists`);
        
        // Try to sign in to verify the account works
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: accountConfig.email,
          password: accountConfig.password
        });
        
        if (signInError) {
          console.log(`❌ Account exists but sign-in failed: ${signInError.message}`);
          return false;
        } else {
          console.log(`✅ Account ${accountConfig.email} verified (already exists and working)`);
          await supabase.auth.signOut(); // Clean up
          return true;
        }
      } else {
        console.error(`❌ Failed to create ${accountConfig.email}: ${error.message}`);
        return false;
      }
    }

    if (data.user) {
      console.log(`✅ Successfully created account: ${accountConfig.email}`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
      
      // If email confirmation is required, provide instructions
      if (!data.user.email_confirmed_at) {
        console.log(`   📧 Check email for confirmation link (or use Supabase dashboard to confirm)`);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Unexpected error creating ${accountConfig.email}:`, error.message);
    return false;
  }
}

async function createAllTestAccounts() {
  console.log('🚀 Creating test accounts for OfferPlus...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  
  let successCount = 0;
  
  for (const account of TEST_ACCOUNTS) {
    const success = await createTestAccount(account);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Summary: ${successCount}/${TEST_ACCOUNTS.length} accounts ready`);
  
  if (successCount > 0) {
    console.log('\n🎉 Test accounts ready! You can now sign in with:');
    TEST_ACCOUNTS.forEach(account => {
      console.log(`   📧 ${account.email}`);
      console.log(`   🔑 ${account.password}`);
      console.log('');
    });
    
    console.log('💡 Usage instructions:');
    console.log('   1. Start the frontend: cd frontend && npm run dev');
    console.log('   2. Navigate to http://localhost:3000/login');
    console.log('   3. Use any of the test accounts above to sign in');
    console.log('   4. Access JobGPT at http://localhost:3000/jobgpt');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
OfferPlus Test Account Creator

Usage:
  node create-test-account.js [options]

Options:
  --help, -h     Show this help message
  --list, -l     List available test accounts
  --verify, -v   Verify existing test accounts

Examples:
  node create-test-account.js           # Create all test accounts
  node create-test-account.js --list    # List test accounts
  node create-test-account.js --verify  # Verify accounts work
`);
  process.exit(0);
}

if (args.includes('--list') || args.includes('-l')) {
  console.log('📋 Available test accounts:\n');
  TEST_ACCOUNTS.forEach((account, index) => {
    console.log(`${index + 1}. ${account.email}`);
    console.log(`   Password: ${account.password}`);
    console.log(`   Name: ${account.metadata.first_name} ${account.metadata.last_name}`);
    console.log('');
  });
  process.exit(0);
}

if (args.includes('--verify') || args.includes('-v')) {
  console.log('🔍 Verifying test accounts...\n');
  
  for (const account of TEST_ACCOUNTS) {
    console.log(`Testing ${account.email}...`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });
      
      if (error) {
        console.log(`❌ ${account.email}: ${error.message}`);
      } else {
        console.log(`✅ ${account.email}: Working`);
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.log(`❌ ${account.email}: ${error.message}`);
    }
  }
  process.exit(0);
}

// Default: create all test accounts
createAllTestAccounts().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});