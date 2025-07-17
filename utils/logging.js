/**
 * Utility functions for recording page and API logs.
 */
const Database = require('better-sqlite3');
const path = require('path');

// Create/Connect to the SQLite database
// Adjust the relative path to your SQLite file if needed.
const dbPath = path.join(__dirname, '..', '..', 'data', 'caitlibot.sqlite');
const db = new Database(dbPath);

/**
 * Logs general page access information after the response has finished.
 */
function recordLog(req, res) {
  const logEntry = {
    userEmail: req.user ? req.user.Email : '',
    path: req.originalUrl,
    ip: req.ip,
    timestamp: (new Date()).toISOString(),
  };

  // After response is finalised, record the status code and error (if any)
  res.on('finish', () => {
    logEntry.responseCode = res.statusCode;
    logEntry.error = res.statusCode >= 400 ? res.statusMessage : null;

    if (logEntry.path != "/robots933456.txt" && logEntry.path != "/favicon.ico") {
      try {
        // Insert a record into PageLogs
        db.prepare(`
          INSERT INTO PageLogs (Timestamp, UserEmail, PathAccessed, SourceIP, ResponseCode, Error)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          logEntry.timestamp,
          logEntry.userEmail,
          logEntry.path,
          logEntry.ip,
          logEntry.responseCode,
          logEntry.error
        );
      } catch (err) {
        console.error('Error logging page access:', err);
      }
    }
  });

}

/**
 * Logs errors with response code, then sends the error response.
 */
function recordErrorLog(req, res, err) {
  const logEntry = {
    userEmail: req.user ? req.user.Email : '',
    path: req.originalUrl,
    ip: req.ip,
    timestamp: (new Date()).toISOString(),
    responseCode: res.statusCode || 500,
    error: err.message || 'Internal Server Error',
  };

  try {
    // Insert a record into PageLogs
    db.prepare(`
      INSERT INTO PageLogs (Timestamp, UserEmail, PathAccessed, SourceIP, ResponseCode, Error)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      logEntry.timestamp,
      logEntry.userEmail,
      logEntry.path,
      logEntry.ip,
      logEntry.responseCode,
      logEntry.error
    );
  } catch (error) {
    console.error('Error logging error:', error);
  }

  if (req.originalUrl.startsWith('/api')) {
    res.status(logEntry.responseCode).json({ error: logEntry.error });
  } else {
    if (req.flash) {
      req.flash('error', logEntry.error);
    }
    res.redirect('/error');
  }
}

module.exports = {
  recordLog,
  recordErrorLog
};
