import type { DatabaseInterface } from './db-interface';

let db: DatabaseInterface;

const isServer = typeof window === 'undefined';

if (isServer) {
  if (process.env.DATABASE_URL) {
    const { postgresDb } = require('./postgres');
    postgresDb.init().catch((err: any) => console.error('PostgreSQL init error:', err));
    db = postgresDb;
    console.log('Using PostgreSQL database driver.');
  } else {
    const { sqliteDb } = require('./sqlite');
    db = sqliteDb;
    console.log('Using SQLite database driver.');
  }
} else {
  // Client side — db not used directly
  db = {} as any;
}

export { db };
export default db;
export * from './db-interface';
export * from './json-db';
