/**
 * Routes for voting on shared recipes.
 */
const express = require('express');
const router  = express.Router();
const Vote    = require('../models/votes');

/**
 * POST /vote - create or update a vote
 * 1. Validate input
 * 2. Add or update in database
 */
router.post('/', async (req, res) => {
  try {
    let { voteId, recipe, value, topic, subjectId } = req.body;

    // basic validation
    voteId = Number(voteId);
    value  = Number(value);
    const allowed = [-1, 0, 1];
    if (isNaN(voteId) || !allowed.includes(value) || !recipe) {
      return res.status(400).json({ error: 'Bad request parameters' });
    }

    const email = req.user.Email.toLowerCase();

    if (voteId === -1) {
        voteId = Vote.addVote({ recipe, email, value, topic, subjectId });
    } else {
      const ok = Vote.updateVote({ voteId, email, value });
      if (!ok) return res.status(403).json({ error: 'Not allowed to modify this vote' });
    }

    return res.json({
      voteId,
      value,
      message: 'Vote recorded'
    });
  } catch (err) {
    console.error('Error handling /vote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
