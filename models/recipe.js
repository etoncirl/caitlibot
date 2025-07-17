/**
 * Model for prompt recipes.
 */
const db = require('../utils/db'); // Adjust path if necessary

/**
 * Utility to generate random 6 digit hex codes
 */
function randomHex() {
  return `${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase()}`;
}

class Recipe {
  /**
   * Save a new recipe
   * 1. Generate unique code
   * 2. Insert into Recipes table
   */
  static addRecipe({ userEmail, savedDate, subjectId, topic, prompt }) {

    // statement to check if a code already exists
    const checkStmt = db.prepare('SELECT 1 FROM Recipes WHERE Code = :code');

    let code;
    // keep generating codes until one is not found in the table
    do {
      code = randomHex();
    } while (checkStmt.get({ code }));

    try {
      const stmt = db.prepare(`
        INSERT INTO Recipes 
          (UserEmail, SavedDate, SharedDate, DeletedDate, SubjectId, Topic, Prompt, Code)
        VALUES 
          (:userEmail, :savedDate, NULL, NULL, :subjectId, :topic, :prompt, :code)
      `);
      
      const result = stmt.run({ userEmail, savedDate, subjectId, topic, prompt, code });
      return result.changes > 0;
    } catch (err) {
      console.error('Error in addRecipe:', err);
      throw err;
    }
  }

  /**
   * Fetch a recipe by its database id
   */
  static getRecipeById(recipeId) {
    try {
      const stmt = db.prepare(`
        SELECT 
          r.RecipeId,
          r.UserEmail,
          r.SavedDate,
          r.SharedDate,
          r.DeletedDate,
          r.SubjectId,
          r.Topic,
          r.Prompt,
          r.Code
        FROM Recipes r
        WHERE r.RecipeId = :recipeId
          AND r.DeletedDate IS NULL
      `);
      return stmt.get({ recipeId });
    } catch (err) {
      console.error('Error in getRecipeById:', err);
      throw err;
    }
  }

  /**
   * Fetch a recipe by its unique code
   */
  static getRecipeByCode(code) {
    try {
      const stmt = db.prepare(`
        SELECT 
          r.RecipeId,
          r.UserEmail,
          r.SavedDate,
          r.SharedDate,
          r.DeletedDate,
          r.SubjectId,
          r.Topic,
          r.Prompt,
          r.Code
        FROM Recipes r
        WHERE r.Code = :code
          AND r.DeletedDate IS NULL
      `);
      return stmt.get({ code });
    } catch (err) {
      console.error('Error in getRecipeByCode:', err);
      throw err;
    }
  }

  /**
   * Toggle sharing status of a recipe
   */
  static updateRecipeToShared(recipeId, shareOrUnshare) {
    try {
      const sharedDate = shareOrUnshare ? new Date().toISOString() : null;

      const stmt = db.prepare(`
        UPDATE Recipes
        SET SharedDate = :sharedDate
        WHERE RecipeId = :recipeId
      `);
      const result = stmt.run({ sharedDate, recipeId });
      return result.changes > 0;
    } catch (err) {
      console.error('Error in updateRecipeToShared:', err);
      throw err;
    }
  }

  /**
   * List all recipes for a user
   */
  static getAllRecipesForUser(userEmail) {
    try {
      const stmt = db.prepare(`
        SELECT 
          r.RecipeId,
          r.UserEmail,
          r.SavedDate,
          r.SharedDate,
          r.Prompt,
          r.Topic,
          r.Code,
          (u.FirstName || ' ' || u.LastName) AS Author,
          s.Level,
          s.Subject,
          s.SubjectId
        FROM Recipes r
        INNER JOIN Subjects s ON r.SubjectId = s.SubjectId
        INNER JOIN Users u ON u.Email = r.UserEmail
        WHERE r.UserEmail = :userEmail
          AND r.DeletedDate IS NULL
      `);
      return stmt.all({ userEmail });
    } catch (err) {
      console.error('Error in getAllRecipesForUser:', err);
      throw err;
    }
  }

  /**
   * Return all shared recipes for a subject
   */
  static getSharedRecipes(subjectId) {
    try {
      const stmt = db.prepare(`
        SELECT 
          r.RecipeId,
          r.UserEmail,
          r.SavedDate,
          r.SharedDate,
          r.Prompt,
          r.Topic,
          r.Code,
          (u.FirstName || ' ' || u.LastName) AS Author,
          s.Level,
          s.Subject,
          s.SubjectId
        FROM Recipes r
        INNER JOIN Subjects s ON r.SubjectId = s.SubjectId
        INNER JOIN Users u ON u.Email = r.UserEmail
        WHERE r.SharedDate IS NOT NULL
          AND r.SubjectId = :subjectId
          AND r.DeletedDate IS NULL
      `);
      return stmt.all({ subjectId });
    } catch (err) {
      console.error('Error in getSharedRecipes:', err);
      throw err;
    }
  }

  /**
   * Soft delete a recipe
   */
  static setRecipeAsDeleted(recipeId) {
    try {
      const deletedDate = new Date().toISOString();
      const stmt = db.prepare(`
        UPDATE Recipes
        SET DeletedDate = :deletedDate
        WHERE RecipeId = :recipeId
      `);
      const result = stmt.run({ deletedDate, recipeId });
      return result.changes > 0;
    } catch (err) {
      console.error('Error in setRecipeAsDeleted:', err);
      throw err;
    }
  }
}

module.exports = Recipe;
