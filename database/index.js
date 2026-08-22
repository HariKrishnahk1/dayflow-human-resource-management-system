/**
 * Database entry point.
 *
 * Opens the SQLite connection, applies the schema and seeds default settings,
 * then exposes the shared `db` handle the backend modules import.
 */
import { connect } from './connection.js';
import { applySchema } from './schema.js';
import { applyDefaultSettings, readSettings } from './settings.js';

export const db = connect();

applySchema(db);
applyDefaultSettings(db);

export const getSettings = () => readSettings(db);
export { DB_PATH } from './connection.js';
