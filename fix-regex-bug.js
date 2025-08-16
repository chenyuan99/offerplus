#!/usr/bin/env node

/**
 * Fix for the corrupted regex in promptManager.ts
 * This script fixes the UUID that got inserted into the regex escape sequence
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/lib/promptManager.ts');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find and replace the corrupted regex
  const uuidPattern = /\\[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
  
  if (uuidPattern.test(content)) {
    console.log('Found corrupted regex with UUID, fixing...');
    content = content.replace(uuidPattern, '\\\\$&');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed regex bug in promptManager.ts');
  } else {
    console.log('No corrupted regex found - file might already be fixed');
  }
  
} catch (error) {
  console.error('❌ Error fixing regex bug:', error.message);
}