import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** The database file lives beside this folder at the project root. */
export const DB_PATH = process.env.DAYFLOW_DB || path.join(__dirname, '..', 'dayflow.db');

export function connect() {
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}
