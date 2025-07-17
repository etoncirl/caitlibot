/**
 * Helper for connecting to the SQLite database.
 */
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', '..', 'data', 'caitlibot.sqlite');
// 1. Open connection to SQLite database
// 2. Export configured instance for reuse
const db = new Database(dbPath, {
  // optional flags or configuration
  // e.g., verbose: console.log
});

module.exports = db;
