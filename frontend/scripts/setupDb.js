import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', 'data', 'jobs.db');

const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    industry TEXT,
    poc TEXT,
    agent TEXT,
    process TEXT NOT NULL,
    appliedDate TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('Database setup completed!');