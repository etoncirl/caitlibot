/**
 * Routes for listing and posting recipe comments.
 */
const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const Recipe = require('../models/recipe'); // We need to check if recipe is shared or owned by the user

/**
 * GET /comments/:recipeId
 * 
 * Retrieves all comments for a given recipe, only if:
 *  - the recipe is shared, OR
 *  - the current user is the author, OR
 *  - the current user is an admin (optional logic)
 */
router.get('/', async (req, res) => {
  try {
    
    const getDomain = email => email.includes("@") ? email.split("@")[1].toLowerCase() : null;        
    const userDomain = getDomain(req.user.Email);
    
    const { recipeId } = req.query;
        if (!recipeId) {
            return res.status(400).json({ error: 'RecipeId is required' });
        }
    
    // 1. Find the recipe
    const recipe = await Recipe.getRecipeById(recipeId);
    if (!recipe || getDomain(recipe.UserEmail) !== userDomain) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // 2. Check if the recipe is accessible: shared OR belongs to user OR user is admin
    const isAuthor = (recipe.UserEmail === req.user.Email);
    const isShared = (recipe.SharedDate !== null);
    const isAdmin = !!req.user.Admin; // If you store Admin in the user object

    if (!isShared && !isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to view these comments.' });
    }

    // 3. Get all comments for this recipe
    let comments = await Comment.getCommentsForRecipe(recipeId);
    comments = comments.filter(comment => getDomain(comment.UserEmail) === userDomain);

    for (let comment of comments) {
        if (comment.UserEmail === req.user.Email) {
            comment.Author = "you";
        }
    }

    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments for recipe:', err);
    res.status(500).json({ error: 'Error fetching comments for recipe' });
  }
});

/**
 * POST /comments/new
 *
 * Adds a new comment to a given recipe.
 * Checks that the recipe is either shared or the author is the current user.
 */
router.post('/new', async (req, res) => {
    try {
      const { recipeId, comment } = req.body;
  
      if (!recipeId) {
        return res.status(400).json({ error: 'Recipe ID is required' });
      } else if (!comment) {
        return res.status(400).json({ error: 'Please provide a comment' });
      }
  
      // 1. Fetch the recipe from the database:
      const recipe = await Recipe.getRecipeById(recipeId);
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found or has been deleted' });
      }
  
      // 2. Check if the recipe is shared or the current user is the author
      const isAuthor = (recipe.UserEmail === req.user.Email);
      const isShared = (recipe.SharedDate !== null);
  
      if (!isShared && !isAuthor) {
        return res.status(403).json({ error: 'You do not have permission to comment on this recipe.' });
      }
  
      // 3. If allowed, add the comment
      const commentId = await Comment.addComment({
        userEmail: req.user.Email,
        recipeId,
        comment,
      });
  
      if (commentId !== null) {
        return res.status(201).json({ message: 'Comment added successfully', commentId });
      } else {
        return res.status(500).json({ error: 'Failed to add comment' });
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      return res.status(500).json({ error: 'Error adding comment' });
    }
  });
  

/**
 * POST /comments/delete
 * 
 * Soft-deletes a comment by setting DeletedDate. Allowed if:
 *  - the current user is the comment author, OR
 *  - the current user is admin.
 */
router.delete('/delete', async (req, res) => {
  try {
    const { commentId } = req.body;

    if (!commentId) {
      return res.status(400).json({ error: 'Comment ID is required' });
    }

    // 1. Get the comment to confirm ownership or admin status
    const existingComment = await Comment.getCommentById(commentId);
    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // 2. Check if the user is the owner or an admin
    const isAuthor = (existingComment.UserEmail === req.user.Email);
    const isAdmin = !!req.user.Admin;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this comment.' });
    }

    // 3. Perform soft-delete
    const success = await Comment.deleteComment(commentId);
    if (success) {
      res.json({ message: 'Comment deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Error deleting comment' });
  }
});

module.exports = router;
