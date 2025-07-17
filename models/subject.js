/**
 * Data model for subjects table.
 */
const db = require('../utils/db');

class Subject {
  /**
   * Return all subjects
   */
  static getAll() {
    try {
      const stmt = db.prepare(`
        SELECT SubjectId, Subject, Level, ExamBoard, Category 
        FROM Subjects 
        WHERE SubjectId <> -1 
        ORDER BY Subject ASC, Level DESC
      `);
      const rows = stmt.all();
      return rows;
    } catch (err) {
      console.error('Error in getAll:', err);
      throw err;
    }
  }

  /**
   * Find subject by id
   */
  static findById(subjectId) {
    try {
      const stmt = db.prepare(`
        SELECT SubjectId, Subject, Level, ExamBoard, Category
        FROM Subjects
        WHERE SubjectId = :subjectId
      `);
      const row = stmt.get({ subjectId });
      return row;
    } catch (err) {
      console.error('Error in findById:', err);
      throw err;
    }
  }
  // Create a new subject
  /**
   * Create a new subject
   */
  static save(subjectData) {
    try {
      const { Subject: subj, Level, ExamBoard, Category } = subjectData;
      const stmt = db.prepare(`
        INSERT INTO Subjects (Subject, Level, ExamBoard, Category)
        VALUES (:subj, :Level, :ExamBoard, :Category)
      `);
      const info = stmt.run({ subj, Level, ExamBoard, Category });
      return info.lastInsertRowid;
    } catch (err) {
      console.error('Error in save subject:', err);
      throw err;
    }
  }
  
  // Delete subject by ID
  /**
   * Delete subject by ID
   */
  static delete(subjectId) {
    try {
      // Reassign dependent rows to subjectId = -1 to avoid FK violations
      db.prepare('UPDATE Votes SET SubjectId = -1 WHERE SubjectId = ?').run(subjectId);
      db.prepare('UPDATE Recipes SET SubjectId = -1 WHERE SubjectId = ?').run(subjectId);
      const stmt = db.prepare(`
        DELETE FROM Subjects
        WHERE SubjectId = :subjectId
      `);
      const info = stmt.run({ subjectId });
      return info.changes > 0;
    } catch (err) {
      console.error('Error in delete subject:', err);
      throw err;
    }
  }
  // Update subject by ID
  /**
   * Update subject by ID
   */
  static update(subjectId, subjectData) {
    try {
      const { Subject: subj, Level, ExamBoard, Category } = subjectData;
      const stmt = db.prepare(
        `UPDATE Subjects
        SET Subject = :subj, Level = :Level, ExamBoard = :ExamBoard, Category = :Category
        WHERE SubjectId = :subjectId`
      );
      const info = stmt.run({ subj, Level, ExamBoard, Category, subjectId });
      return info.changes > 0;
    } catch (err) {
      console.error('Error in update subject:', err);
      throw err;
    }
  }
}

module.exports = Subject;
