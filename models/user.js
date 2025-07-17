/**
 * User model for authentication and management.
 */
const db = require('../utils/db');
const bcrypt = require('bcrypt');

class User {
  /**
   * Lookup user by email
   */
  static findByEmail(email) {
    try {
      const stmt = db.prepare(`
        SELECT *
        FROM Users
        WHERE Email = :email
      `);
      const row = stmt.get({ email });
      return row;
    } catch (err) {
      console.error('Error in findByEmail:', err);
      throw err;
    }
  }

  /**
   * Insert or update a user record
   */
  static async save(userData) {
    try {
      const { email, password, firstName, lastName, admin } = userData;
      const existingUser = User.findByEmail(email);

      if (existingUser) {
        // Update existing user
        const stmt = db.prepare(`
          UPDATE Users
          SET FirstName = :firstName,
              LastName = :lastName,
              Admin = :admin
          WHERE Email = :email
        `);
        stmt.run({
          email: email.toLowerCase().trim(),
          firstName,
          lastName,
          admin,
        });
        return false;
      } else {
        // Insert new user
        const stmt = db.prepare(`
          INSERT INTO Users
            (Email, Password, FirstName, LastName, Admin)
          VALUES
            (:email, :password, :firstName, :lastName, :admin)
        `);
        stmt.run({ email: email.toLowerCase().trim(), password, firstName, lastName, admin });
        return true;
      }
    } catch (err) {
      console.error('Error in save:', err);
      throw err;
    }
  }

  /**
   * Retrieve all users with stats
   */
  static getAll() {
    try {
      const stmt = db.prepare(`
        SELECT
          u.Email,
          u.FirstName,
          u.LastName,
          u.Admin,
          COALESCE(pl.PageViews, 0) AS PageViews,
          COALESCE(al.ApiCalls, 0) AS ApiCalls,
          COALESCE(r.Recipes, 0) AS Recipes
        FROM Users u
        LEFT JOIN (
          SELECT UserEmail, COUNT(*) AS PageViews
          FROM PageLogs
          GROUP BY UserEmail
        ) pl ON pl.UserEmail = u.Email
        LEFT JOIN (
          SELECT UserEmail, COUNT(*) AS ApiCalls
          FROM APILogs
          GROUP BY UserEmail
        ) al ON al.UserEmail = u.Email
        LEFT JOIN (
          SELECT UserEmail, COUNT(*) AS Recipes
          FROM Recipes
          WHERE DeletedDate IS NULL
          GROUP BY UserEmail
        ) r ON r.UserEmail = u.Email
        ORDER BY ApiCalls DESC,
                 PageViews DESC,
                 u.LastName ASC,
                 u.FirstName ASC
      `);
      const rows = stmt.all();
      return rows;
    } catch (err) {
      console.error('Error in getAll:', err);
      throw err;
    }
  }

  /**
   * Update the stored password for a user
   */
  static async updatePassword(email, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const stmt = db.prepare(`
        UPDATE Users
        SET Password = :password
        WHERE Email = :email
      `);
      const result = stmt.run({ email, password: hashedPassword });
      return result.changes > 0;
    } catch (err) {
      console.error('Error in updatePassword:', err);
      throw err;
    }
  }

  /**
   * Delete a user and related records
   */
  static delete(email) {
    try {
      // Remove dependent votes and comments before deleting user to satisfy FK constraints
      db.prepare(`DELETE FROM Votes WHERE Email = :email`).run({ email });
      db.prepare(`DELETE FROM Comments WHERE UserEmail = :email`).run({ email });
      // Now delete the user
      const stmt = db.prepare(
        `DELETE FROM Users
         WHERE Email = :email`
      );
      const result = stmt.run({ email });
      return result.changes > 0;
    } catch (err) {
      console.error('Error in delete:', err);
      throw err;
    }
  }

  /**
   * Serialize user for session
   */
  static serialize(user, done) {
    done(null, user.Email);
  }

  /**
   * Deserialize user from session
   */
  static async deserialize(email, done) {
    try {
      const user = User.findByEmail(email);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
}

module.exports = User;
