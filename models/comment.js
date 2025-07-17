/**
 * Model for the Comments table.
 */
const db = require('../utils/db'); // Adjust path if necessary

/**
 * Data access functions for comments
 */

class Comment {
  /**
   * Fetch comments for a recipe
   * 1. Query comments joined to users
   * 2. Return the rows
   */
  static getCommentsForRecipe(recipeId) {
    try {
      const stmt = db.prepare(`
        SELECT 
          c.CommentId, 
          c.UserEmail, 
          c.Comment, 
          c.SavedDate, 
          (u.FirstName || ' ' || u.LastName) AS Author
        FROM Comments c
        JOIN Users u ON c.UserEmail = u.Email
        WHERE c.RecipeId = :recipeId
          AND c.DeletedDate IS NULL
      `);
      return stmt.all({ recipeId });
    } catch (err) {
      console.error('Error in getCommentsForRecipe:', err);
      throw err;
    }
  }

  /**
   * Get a comment by its id
   */
  static getCommentById(commentId) {
    try {
      const stmt = db.prepare(`
        SELECT 
          CommentId,
          UserEmail,
          Comment,
          RecipeId,
          SavedDate,
          DeletedDate
        FROM Comments
        WHERE CommentId = :commentId
      `);
      return stmt.get({ commentId });
    } catch (err) {
      console.error('Error in getCommentById:', err);
      throw err;
    }
  }

  /**
   * Add a comment for a recipe
   * 1. Insert new row
   * 2. Return inserted id
   */
  static addComment({ userEmail, recipeId, comment }) {
    try {
      const savedDate = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO Comments (UserEmail, Comment, RecipeId, SavedDate, DeletedDate)
        VALUES (:userEmail, :comment, :recipeId, :savedDate, NULL)
      `);
      const result = stmt.run({ userEmail, comment, recipeId, savedDate });
      if (result.changes > 0) {
        return result.lastInsertRowid; // Return the ID of the newly inserted row
      } else {
        return null; 
      }
    } catch (err) {
      console.error('Error in addComment:', err);
      throw err;
    }
  }

  /**
   * Mark a comment as deleted
   */
  static deleteComment(commentId) {
    try {
      const deletedDate = new Date().toISOString();
      const stmt = db.prepare(`
        UPDATE Comments
        SET DeletedDate = :deletedDate
        WHERE CommentId = :commentId
      `);
      const result = stmt.run({ deletedDate, commentId });
      return result.changes > 0;
    } catch (err) {
      console.error('Error in deleteComment:', err);
      throw err;
    }
  }
}

module.exports = Comment;
