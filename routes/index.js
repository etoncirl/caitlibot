/**
 * Basic site routes for login and home pages.
 */
const express = require('express');
const passport = require('passport');
const { ensureAuthenticated } = require('../utils/userFunctions');

// Basic login and home routes
const router = express.Router();

let siteTitle;
if (process.env.SITE_TITLE) {
    siteTitle = process.env.SITE_TITLE;        
} else {
    siteTitle = `<span style="color: navy;">CAITL</span><span style="color: darkorange; font-size: 1.5em; font-family: Georgia, serif; font-style: italic;">i</span><span style="color: grey; font-weight: normal">bot</span>`;
}

function getInstitutionLogo() {
    if (process.env.INSTITUTION_LOGO) {
        return process.env.INSTITUTION_LOGO;
    }
    return '/eton-logo.png';
}

let siteSubTitle;
if (process.env.SITE_SUBTITLE) {
    siteSubTitle = process.env.SITE_SUBTITLE;
} else {
    siteSubTitle = `<span style="color: darkorange; font-size: 1.5em; font-family: Georgia, serif; font-weight: bold;">i</span>deas for using<br/><span style="font-weight: bolder; color: navy;">C</span>onversational <span style="font-weight: bolder; color: navy;">A</span>rtifical <span style="font-weight: bolder; color: navy;">I</span>ntelligence<br/>for <span style="font-weight: bolder; color: navy;">T</span>eaching and <span style="font-weight: bolder; color: navy;">L</span>earning`;    
}

/**
 * GET / - home page
 */
router.get('/', ensureAuthenticated, (req, res) => {
    res.render('home', { user: req.user, siteTitle, siteSubTitle });
});

/**
 * GET /login - login form
 */
router.get('/login', (req, res) => {
    res.render('login', { siteTitle, siteSubTitle, institutionLogo: getInstitutionLogo() });
});

/**
 * POST /login - authenticate user
 */
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        const attemptedEmail = req.body.email;
        if (err || !user) {
            console.log('Login failed (' + attemptedEmail + "):", err || info);
            req.flash('error', info.message || 'Invalid email or password');
            return res.redirect('/login'); 
        }
        req.logIn(user, (err) => {
            if (err) {
                console.log("Login server side error (" + user.Email + "):", err);
                return next(err);
            }
            console.log("Login successful (" + user.Email + ")");
            return res.redirect('/'); 
        });
    })(req, res, next);
});

/**
 * GET /logout - end session
 */
router.get('/logout', (req, res, next) => {
    const logoutEmail = req.user ? req.user.Email : null;
    req.logout(function (err) {
        if (err) {             
            console.log("Logout failure (" + logoutEmail + ")");    
            return next(err); 
        }
        console.log("Logout successful (" + logoutEmail + ")");
        res.redirect('/login');
    });
});

/**
 * GET /error - generic error page
 */
router.get('/error', (req, res) => {
    const messages = req.flash('error');
    const errorMessage = messages && messages.length > 0 ? messages[0] : 'An unexpected error occurred.';
    res.status(500).render('error', { errorMessage });
});

module.exports = router;
