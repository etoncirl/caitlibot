/**
 * Helper functions for authentication and role checks.
 */
const User = require('../models/user');
const bcrypt = require('bcrypt');

/**
 * Passport local authentication callback
 */
async function authenticateUser(email, password, done) {
  try {
    const dbUser = await User.findByEmail(email);
    if (!dbUser) {
      return done(null, false, { message: 'Incorrect email.' });
    }

    const match = await bcrypt.compare(password, dbUser.Password);
    if (match) {
      return done(null, dbUser);
    } else {
      return done(null, false, { message: 'Incorrect password.' });
    }
  } catch (err) {
    return done(err);
  }
}

/**
 * Middleware to require logged in user
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

/**
 * Middleware to require admin privileges
 */
function isAdmin(req, res, next) {
  if (req.user && req.user.Admin) {
    return next();
  }
  res.status(403).send('Access denied');
}

module.exports = {
  authenticateUser,
  ensureAuthenticated,
  isAdmin
}
