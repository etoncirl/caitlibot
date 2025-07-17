/**
 * Tracks initialisation errors so startup issues can be surfaced in responses.
 */
let initError = null;

/**
 * Persist the first encountered initialisation error.
 * Subsequent calls have no effect.
 * @param {string} message - Error message to record.
 */
function setInitError(message) {
  if (!initError) {
    initError = message;
    console.error(message);
  }
}

/**
 * Retrieve any startup error that occurred.
 * @returns {?string} The first recorded error or null.
 */
function getInitError() {
  return initError;
}

module.exports = { setInitError, getInitError };
