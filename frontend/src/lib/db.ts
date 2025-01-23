import initSqlJs from 'sql.js';
import { JobApplication } from '../types';

let db: any = null;
let SQL: any = null;

const initDb = async () => {
  if (db) return db;
  
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
  }
  
  // Load data from localStorage if it exists
  const savedData = localStorage.getItem('jobsDb');
  if (savedData) {
    try {
      const uint8Array = new Uint8Array(savedData.split(',').map(Number));
      db = new SQL.Database(uint8Array);
    } catch (error) {
      console.error('Error loading database from localStorage:', error);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }
  
  // Create table if it doesn't exist
  db.run(`
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
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
};

const saveToLocalStorage = () => {
  if (!db) return;
  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem('jobsDb', array.toString());
};

const sanitizeValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/'/g, "''").trim();
};

export const jobsDb = {
  init: async () => {
    try {
      await initDb();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  },
  
  getAll: async () => {
    try {
      const db = await initDb();
      const result = db.exec('SELECT * FROM jobs ORDER BY createdAt DESC');
      if (!result.length) return [];
      
      const columns = result[0].columns;
      return result[0].values.map((row: any[]) => {
        const job: any = {};
        columns.forEach((col, i) => {
          job[col] = row[i];
        });
        return job as JobApplication;
      });
    } catch (error) {
      console.error('Error getting jobs:', error);
      return [];
    }
  },

  add: async (job: Omit<JobApplication, 'id'>) => {
    try {
      const db = await initDb();
      const id = crypto.randomUUID();
      
      const query = `
        INSERT INTO jobs (id, role, company, location, industry, poc, agent, process, appliedDate, status, notes)
        VALUES ('${id}', '${sanitizeValue(job.role)}', '${sanitizeValue(job.company)}', 
                '${sanitizeValue(job.location)}', '${sanitizeValue(job.industry)}', 
                '${sanitizeValue(job.poc)}', '${sanitizeValue(job.agent)}', 
                '${sanitizeValue(job.process || 'Resume')}', 
                '${sanitizeValue(job.appliedDate || new Date().toISOString().split('T')[0])}', 
                '${sanitizeValue(job.status || 'Applied')}', '${sanitizeValue(job.notes)}')
      `;
      
      db.run(query);
      saveToLocalStorage();
      return id;
    } catch (error) {
      console.error('Error adding job:', error);
      throw new Error(`Failed to add job: ${error.message}`);
    }
  },

  update: async (job: JobApplication) => {
    try {
      if (!job.id) {
        throw new Error('Job ID is required for update');
      }

      const db = await initDb();
      
      const query = `
        UPDATE jobs 
        SET role = '${sanitizeValue(job.role)}',
            company = '${sanitizeValue(job.company)}',
            location = '${sanitizeValue(job.location)}',
            industry = '${sanitizeValue(job.industry)}',
            poc = '${sanitizeValue(job.poc)}',
            agent = '${sanitizeValue(job.agent)}',
            process = '${sanitizeValue(job.process)}',
            appliedDate = '${sanitizeValue(job.appliedDate)}',
            status = '${sanitizeValue(job.status)}',
            notes = '${sanitizeValue(job.notes)}'
        WHERE id = '${sanitizeValue(job.id)}'
      `;
      
      db.run(query);
      saveToLocalStorage();
    } catch (error) {
      console.error('Error updating job:', error);
      throw new Error(`Failed to update job: ${error.message}`);
    }
  },

  delete: async (id: string) => {
    try {
      const db = await initDb();
      db.run(`DELETE FROM jobs WHERE id = '${sanitizeValue(id)}'`);
      saveToLocalStorage();
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }
};