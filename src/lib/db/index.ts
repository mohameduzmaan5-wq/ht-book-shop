import type { DatabaseInterface } from './db-interface';

let _db: DatabaseInterface | null = null;

function getDb(): DatabaseInterface {
  if (_db) return _db;
  if (process.env.DATABASE_URL) {
    const { postgresDb } = require('./postgres');
    postgresDb.init().catch((err: any) => console.error('PostgreSQL init error:', err));
    _db = postgresDb;
  } else {
    const { sqliteDb } = require('./sqlite');
    _db = sqliteDb;
  }
  return _db!;
}

export const db = new Proxy({} as DatabaseInterface, {
  get(_target, prop) {
    const database = getDb();
    const value = (database as any)[prop];
    if (typeof value === 'function') return value.bind(database);
    return value;
  }
});

export default db;
export * from './db-interface';
