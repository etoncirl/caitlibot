/**
 * Model for user votes on recipes.
 */
const db = require('../utils/db');  

class Vote {
  /**
   * Insert a new vote.  Returns the new VoteId.
   */
  static addVote({ recipe, email, value, topic, subjectId }) {
    const voteDate = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO Votes (Recipe, Like, Email, Topic, SubjectId, VoteDate)
      VALUES (:recipe, :value, :email, :topic, :subjectId, :voteDate)
    `);
    const result = stmt.run({ recipe, value, email, topic, subjectId, voteDate });
    return result.lastInsertRowid;  
  }

  /**
   * Update an existing vote.  Returns true when at least one row changed.
   */
  static updateVote({ voteId, email, value }) {
    const voteDate = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE Votes 
      SET Like = :value, 
          VoteDate = :voteDate 
      WHERE VoteId = :voteId 
        AND Email  = :email 
    `);
    const { changes } = stmt.run({ voteId, email, value, voteDate });
    return changes > 0;
  }

}

module.exports = Vote;
