import type { DatabaseInterface } from './db-interface';
import { jsonDb } from './json-db';

let db: DatabaseInterface;

const isServer = typeof window === 'undefined';

if (isServer) {
  try {
    if (process.env.DATABASE_URL) {
      // Production: use PostgreSQL (Neon / Railway)
      const { postgresDb } = require('./postgres');
      postgresDb.init().catch((err: any) => console.error('PostgreSQL init error:', err));
      db = postgresDb;
      console.log('Using PostgreSQL database driver.');
    } else {
      // Local dev: use SQLite
      const { sqliteDb } = require('./sqlite');
      db = sqliteDb;
      console.log('Using SQLite database driver.');
    }
  } catch (err) {
    console.warn('Failed to initialize database driver. Falling back to JSON driver.', err);
    db = jsonDb;
  }
} else {
  db = jsonDb;
}

export { db };
export default db;
export * from './db-interface';
export * from './json-db';
