/**
 * Client-side helpers for the login page.
 */

/**
 * Normalise login form input before submission
 */
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function(event) {
        const emailInput = document.getElementById('email');
        emailInput.value = emailInput.value.toLowerCase().trim();
        const passwordInput = document.getElementById('password');
        passwordInput.value = passwordInput.value.trim();
    });
});
