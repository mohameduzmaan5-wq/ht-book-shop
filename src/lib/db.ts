// ============================================
// Bookshop ERP - Database & Demo Data Gateway
// ============================================

import { db as activeDb } from './db/index';

export * from './db/seed-data';
export const db = activeDb;
export default db;
