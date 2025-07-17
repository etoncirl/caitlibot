/**
 * Express routes for administrative dashboard and user management.
 */
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Recipe = require('../models/recipe');
const Logs = require('../models/logs');
const Subject = require('../models/subject')
const bcrypt = require('bcrypt');
const crypto  = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');
// setup multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });
const db = require('../utils/db');

// Routes handling admin dashboard and user/subject management

/**
 * GET /admin - dashboard
 * 1. Load users, logs and subjects
 * 2. Render dashboard template
 */
router.get('/', (req, res) => {
    // Render dashboard skeleton. Data will be fetched via AJAX
    res.render('admin/dashboard', { user: req.user });
});

// API: return all users with statistics
router.get('/api/users', async (req, res) => {
    try {
        const users = await User.getAll();
        res.json({ users });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// API: return most recent logs
router.get('/api/logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = await Logs.getLogs(limit);
        res.json({ logs });
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ error: 'Error fetching logs' });
    }
});

// API: return all subjects with spec availability flag
router.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await Subject.getAll();
        const specsDir = path.join(__dirname, '..', '..', 'data', 'specs');
        subjects.forEach(sub => {
            const txtPath = path.join(specsDir, `${sub.SubjectId}.txt`);
            sub.hasSpec = fs.existsSync(txtPath);
        });
        res.json({ subjects });
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ error: 'Error fetching subjects' });
    }
});

/**
 * GET /admin/users/new
 * Display blank user form
 */
router.get('/users/new', (req, res) => {
    // Render editUser without existing user (new mode)
    res.render('admin/editUser', { user: {} });
});

/**
 * POST /admin/users
 * 1. Hash password
 * 2. Save user via model
 */
router.post('/users', async (req, res) => {
    try {
        const { email, password, firstName, lastName, isAdmin } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            firstName,
            lastName,
            admin: isAdmin === 'on' ? 1 : 0,
        };
        let newUser = await User.save(user)
        let message = newUser ? 'User created successfully' : 'User updated successfully';
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.json({ success: true, message });
        }
        req.flash('success', message);
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating/updating user:', err);
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(500).json({ success: false, error: err.message });
        }
        req.flash('error', 'Error creating/updating user');
        res.redirect('/admin/users/new');
    }
  });

/**
 * GET /admin/users/:email/edit
 * Load user for editing
 */
router.get('/users/:email/edit', async (req, res) => {
  try {
    const user = await User.findByEmail(req.params.email);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin');
    }
    res.render('admin/editUser', { user });
  } catch (err) {
    console.error('Error fetching user for edit:', err);
    req.flash('error', 'Error fetching user');
    res.redirect('/admin');
  }
});

/**
 * PUT /admin/users/:email
 * Update or create user record
 */
router.put('/users/:email', async (req, res) => {
  try {
    const { firstName, lastName, isAdmin } = req.body;
    const userData = {
      email: req.params.email.toLowerCase().trim(),
      firstName,
      lastName,
      admin: isAdmin === 'on' ? 1 : 0
    };
    const newUser = await User.save(userData);
    const message = newUser ? 'User created successfully' : 'User updated successfully';
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message });
    }
    req.flash('success', message);
    res.redirect('/admin');
  } catch (err) {
    console.error('Error updating user:', err);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, error: err.message });
    }
    req.flash('error', 'Error updating user');
    res.redirect(`/admin/users/${req.params.email}/edit`);
  }
});

// Create new subject form
router.get('/subjects/new', (req, res) => {
    // Render editSubject without existing subject (new mode)
    res.render('admin/editSubject', { subject: {} });
});

// Create new subject
router.post('/subjects', async (req, res) => {
    try {
        const { subject, level, examBoard, category } = req.body;
        const subjectData = {
            Subject: subject.trim(),
            Level: level,
            ExamBoard: examBoard.trim(),
            Category: category
        };
        const newId = await Subject.save(subjectData);
        const message = 'Subject created successfully';
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.json({ success: true, message, subjectId: newId });
        }
        req.flash('success', message);
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating subject:', err);
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(500).json({ success: false, error: err.message });
        }
        req.flash('error', 'Error creating subject');
        res.redirect('/admin/subjects/new');
    }
});

// Edit subject form
router.get('/subjects/:subjectId/edit', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) {
      req.flash('error', 'Subject not found');
      return res.redirect('/admin');
    }
    res.render('admin/editSubject', { subject });
  } catch (err) {
    console.error('Error fetching subject for edit:', err);
    req.flash('error', 'Error fetching subject');
    res.redirect('/admin');
  }
});

// Update subject
router.put('/subjects/:subjectId', async (req, res) => {
  try {
    const { subject: subjName, level, examBoard, category } = req.body;
    const subjectData = {
      Subject: subjName.trim(),
      Level: level,
      ExamBoard: examBoard.trim(),
      Category: category
    };
    const updated = await Subject.update(req.params.subjectId, subjectData);
    const message = updated ? 'Subject updated successfully' : 'Subject not found';
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: updated, message });
    }
    if (updated) req.flash('success', message);
    else req.flash('error', message);
    res.redirect('/admin');
  } catch (err) {
    console.error('Error updating subject:', err);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, error: err.message });
    }
    req.flash('error', 'Error updating subject');
    res.redirect(`/admin/subjects/${req.params.subjectId}/edit`);
  }
});
  
// Password reset form
router.get('/users/:email/reset', async (req, res) => {
    try {
        const user = await User.findByEmail(req.params.email);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin');
        }
        res.render('admin/resetPassword', { user });
    } catch (err) {
        console.error('Error fetching user for password reset:', err);
        req.flash('error', 'Error fetching user');
        res.redirect('/admin');
    }
});

// Password reset
router.put('/users/:email/reset', async (req, res) => {
    try {
        const updated = await User.updatePassword(req.params.email, req.body.password);
        if (updated) {
            req.flash('success', 'Password reset successfully');
            res.redirect('/admin');
        } else {
            req.flash('error', 'User not found');
            res.redirect(`/admin/users/${req.params.email}/reset`);
        }
    } catch (err) {
        console.error('Error resetting password:', err);
        req.flash('error', 'Error resetting password');
        res.redirect(`/admin/users/${req.params.email}/reset`);
    }
});

// Delete user
router.delete('/users/:email/delete', async (req, res) => {
    try {
        const deleted = await User.delete(req.params.email);
        if (deleted) {
            req.flash('success', 'User deleted successfully');
            return res.status(200).json({ success: true });
        } else {
            req.flash('error', 'User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        console.error('Error deleting user:', err);
        req.flash('error', 'Error deleting user');
        return res.status(500).json({ success: false, message: 'Error deleting user' });
    }
});

// Lists all recipes for a specified user
router.get('/users/:email/recipes', async (req, res) => {
    try {
        const dbUser = await User.findByEmail(req.params.email);
        if (!dbUser) {
            req.flash('error', 'User not found');
            return res.redirect('/admin');
        }
        const recipes = await Recipe.getAllRecipesForUser(dbUser.Email);
        res.render('admin/userRecipes', { recipes, user: dbUser });
    } catch (err) {
        console.error('Error fetching recipes for specified user:', err);
        res.status(500).json({ error: 'Error fetching recipes for specified user' });
    }
});

// Admin facility to download a copy of the whole database
router.get('/downloadDatabase', (req, res) => {

    const dateStamp = new Date().toISOString().slice(0, 10);
    const guid = crypto.randomUUID();
    const backupFile = `snapshot-${guid}.sqlite`;

    try {
        const stmt = db.prepare(`VACUUM INTO '../data/${backupFile}';`);
        stmt.run();  
    } catch (err) {
        console.error('Error runnning query:', err);
        return res.status(500).json({ error: `Error performing database backup: ${err}` });
    }  

    const dbPath = path.join(__dirname, '..', '..', 'data', backupFile);
    
    res.download(dbPath, `caitlibot-${dateStamp}.sqlite`, (err) => {
      if (err) {                
        return res.status(500).json({ error: `Error downloading database: ${err}` });
      }
    });
});

// Admin facility to export votes and recipes as CSV
router.get('/export', (req, res) => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    const exportSql = `
        SELECT Votes.VoteDate AS "Date", 'Liked' AS "Event", Subjects.Level || ' ' || Subjects.Subject AS "Subject", Votes.Topic AS "Topic", Votes.Recipe AS "Recipe" 
            FROM Votes INNER JOIN Subjects ON Votes.SubjectId = Subjects.SubjectId WHERE Votes.Like = 1
        UNION SELECT Votes.VoteDate AS "Date", 'Disliked' AS "Event", Subjects.Level || ' ' || Subjects.Subject AS "Subject", Votes.Topic AS "Topic", Votes.Recipe AS "Recipe" 
            FROM Votes INNER JOIN Subjects ON Votes.SubjectId = Subjects.SubjectId WHERE Votes.Like = -1
        UNION SELECT Recipes.SavedDate AS "Date", 'Saved'  AS "Event", Subjects.Level || ' ' || Subjects.Subject AS "Subject", Recipes.Topic AS "Topic", Recipes.Prompt AS "Recipe" 
            FROM Recipes INNER JOIN Subjects ON Recipes.SubjectId = Subjects.SubjectId WHERE Recipes.DeletedDate IS NULL
        UNION SELECT Recipes.SharedDate AS "Date", 'Shared' AS "Event", Subjects.Level || ' ' || Subjects.Subject AS "Subject", Recipes.Topic AS "Topic", Recipes.Prompt AS "Recipe" 
            FROM Recipes INNER JOIN Subjects ON Recipes.SubjectId = Subjects.SubjectId WHERE Recipes.SharedDate IS NOT NULL AND Recipes.DeletedDate IS NULL
        ORDER BY "Date";
    `;

    let rows;
    try {
        const stmt = db.prepare(exportSql);
        rows = stmt.all();
    } catch (err) {
        console.error('Error running export query:', err);
        return res.status(500).json({ error: `Error exporting data: ${err}` });
    }

    // Build CSV content
    const headers = ['Date', 'Event', 'Subject', 'Topic', 'Recipe'];
    const escapeField = (field) => String(field).replace(/"/g, '""');
    const csvLines = [headers.join(',')];

    for (const row of rows) {
        const line = headers.map(h => `"${escapeField(row[h])}"`).join(',');
        csvLines.push(line);
    }
    const csvContent = csvLines.join('\n');

    // Send as downloadable CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="export-${dateStamp}.csv"`);
    res.send(csvContent);
});

// Endpoint to upload specification PDF and convert to text
router.post('/subjects/:subjectId/spec', upload.single('specFile'), async (req, res) => {
    try {
        const subjectId = req.params.subjectId;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const specsDir = path.join(__dirname, '..', '..', 'data', 'specs');
        fs.mkdirSync(specsDir, { recursive: true });
        const pdfPath = path.join(specsDir, `${subjectId}.pdf`);
        const txtPath = path.join(specsDir, `${subjectId}.txt`);
        fs.writeFileSync(pdfPath, req.file.buffer);
                
        const options = {
            pagerender: async (page) => {
                const textContent = await page.getTextContent({
                    normalizeWhitespace: true,
                    disableCombineTextItems: false
                });
                let raw = textContent.items.map(item => item.str).join('');
                return raw.replace(/\s{2,}/g, ' ');
            }
        };
        const data = await pdfParse(req.file.buffer, options);        
        fs.writeFileSync(txtPath, data.text);

        return res.json({ success: true, message: 'Specification uploaded and converted' });
    } catch (err) {
        console.error('Error uploading spec:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Delete subject
router.delete('/subjects/:subjectId/delete', async (req, res) => {
    try {
        const subjectId = req.params.subjectId;
        if (subjectId == -1) {
            return res.status(500).json({ success: false, message: "Can't delete subject with id of -1" });
        }
        const deleted = await Subject.delete(subjectId);
        if (deleted) {
            req.flash('success', 'Subject deleted successfully');
            return res.status(200).json({ success: true });
        } else {
            req.flash('error', 'Subject not found');
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
    } catch (err) {
        console.error('Error deleting subject:', err);
        req.flash('error', 'Error deleting subject');
        return res.status(500).json({ success: false, message: err.message });
    }
});
// Serve specification text file for a subject
router.get('/spec/:subjectId', (req, res) => {
    try {
        const subjectId = req.params.subjectId;
        const specsDir = path.join(__dirname, '..', '..', 'data', 'specs');
        const txtPath = path.join(specsDir, `${subjectId}.txt`);
        if (!fs.existsSync(txtPath)) {
            return res.status(404).send('Specification not found');
        }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.sendFile(txtPath);
    } catch (err) {
        console.error('Error serving spec text:', err);
        res.status(500).send('Error retrieving specification');
    }
});

// export router after adding new routes
module.exports = router;
