/**
 * Model for page and API logs.
 */
const db = require('../utils/db');

class Logs {
  /**
   * Return recent log entries
   */
  static getLogs(quantity) {
    try {
      const stmt = db.prepare(`
        SELECT *
        FROM PageLogs
        WHERE UserEmail <> ''
          OR (UserEmail = ''
              AND PathAccessed NOT IN ('/', '/login')
              AND ResponseCode NOT IN (404, 302))
        ORDER BY TIMESTAMP DESC
        LIMIT ?;
      `);
      const rows = stmt.all(quantity);
      return rows;
    } catch (err) {
      console.error('Error in getLogs:', err);
      throw err;
    }
  }

}

module.exports = Logs;
