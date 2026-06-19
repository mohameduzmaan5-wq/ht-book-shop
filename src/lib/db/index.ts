import type { DatabaseInterface } from './db-interface';

let db: DatabaseInterface = {} as any;

if (typeof window === 'undefined') {
  if (process.env.DATABASE_URL) {
    const pg = require('./postgres');
    const postgresDb = pg.postgresDb ?? pg.default;
    postgresDb.init().catch((err: any) => console.error('PostgreSQL init error:', err));
    db = postgresDb;
  } else {
    const sq = require('./sqlite');
    db = sq.sqliteDb ?? sq.default;
  }
}

export { db };
export default db;
export * from './db-interface';
