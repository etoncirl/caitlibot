/**
 * Entry point for CAITLibot Express server.
 * Handles DB setup, middleware configuration and route registration.
 */

// --- Check for database -------------------------------------- //
// Ensure DB file exists by copying template when needed

const fs = require('fs');
const path = require('path');
const { setInitError, getInitError } = require('./utils/initStatus');

const dbPath = path.join(__dirname, '../data/caitlibot.sqlite');
const dbTemplatePath = path.join(__dirname, './assets/blank_database.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

if (!fs.existsSync(dbPath)) {
  if (fs.existsSync(dbTemplatePath)) {
    try {
      fs.copyFileSync(dbTemplatePath, dbPath);
      console.log('✔ Created ../data/caitlibot.sqlite from template.');
    } catch (err) {
      setInitError('Failed to copy blank_database.sqlite to caitlibot.sqlite.');
    }
  } else {
    setInitError('caitlibot.sqlite does not exist, and template blank_database.sqlite is missing.');
  }
}

// --- Initialize Express.js -------------------------------------- //

const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
  const errMsg = getInitError();
  if (errMsg) {
    res.status(500).render('error', { errorMessage: errMsg });
  } else {
    next();
  }
});

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Initialize security system (if running on Azure) -------------------------------------- //

const isAzure = !!process.env.WEBSITE_INSTANCE_ID;

const helmet = require('helmet');
app.use(
  helmet({
    hsts: isAzure,
    contentSecurityPolicy: isAzure,
  })
);

// Keep awake -------------------------------------- //
// Simple endpoint used by uptime pingers
app.get('/keepawake', (req, res) => {
  res.status(200).send('Server is awake');
});

// Initialize session system -------------------------------------- //

const session = require('express-session');
const crypto = require('crypto');
const sessionSecret = crypto.randomBytes(32).toString('hex');

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
}));


// Initialize user management system -------------------------------------- //

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('./models/user.js');

const {
  authenticateUser,
  ensureAuthenticated,
  isAdmin,
} = require('./utils/userFunctions.js');

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));
passport.serializeUser(User.serialize);
passport.deserializeUser(User.deserialize);

// Logging -------------------------------------- //

const { recordLog, recordErrorLog } = require('./utils/logging');

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/') ||
    req.originalUrl.startsWith('/recipes/') ||
    req.originalUrl.startsWith('/comments/') ||
    req.method !== "GET") return next();
  recordLog(req, res);
  next();
});

// Initialize flash messaging system -------------------------------------- //

const flash = require('connect-flash');

app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

// Recipe API -------------------------------------- //

const cors = require('cors');
const Recipe = require('./models/recipe');

app.get(/^\/[0-9a-fA-F]{6}$/, cors(), (req, res) => {
  const code = req.path.substring(1);
  let recipe = Recipe.getRecipeByCode(code);
  if (recipe) {
    res.send(recipe.Prompt);
  } else {
    res.status(404).send("Recipe not found.");
  }
});

// Setup routes -------------------------------------- //

const indexRoutes = require('./routes/index');
const apiRoutes = require('./routes/api.js');
const recipeRoutes = require('./routes/recipes.js');
const commentsRoutes = require('./routes/comments.js');
const votesRoutes = require('./routes/votes.js');
const adminRoutes = require('./routes/admin.js');

app.use('/', indexRoutes);
app.use('/api', ensureAuthenticated, apiRoutes);
app.use('/recipes', ensureAuthenticated, recipeRoutes);
app.use('/comments', ensureAuthenticated, commentsRoutes);
app.use('/vote', ensureAuthenticated, votesRoutes);
app.use('/admin', ensureAuthenticated, isAdmin, adminRoutes);

// Error handling -------------------------------------- //
// 1. Log error via utility
// 2. Response sent by logging helper
app.use(async (err, req, res, next) => {
  recordErrorLog(req, res, err);
});

// Graceful shutdown code (for future use) -------------------------------------- //

const gracefulShutdown = async () => {
  console.log('System shutdown...');
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start the server -------------------------------------- //

try {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✔ Server started on port ${PORT}`);
  });
} catch (err) {
  console.error('Error initializing application:', err);
}

module.exports = app;
