/**
 * Routes for displaying and sharing prompt recipes.
 */
const express = require('express');
const router = express.Router();
const Recipe = require('../models/recipe');
const Subject = require('../models/subject');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * GET /recipes - list user's recipes
 */
router.get('/', async (req, res) => {
    try {
        const recipes = await Recipe.getAllRecipesForUser(req.user.Email);    
        res.render('recipes', { recipes: recipes.reverse() });
    } catch (err) {
        console.error('Error fetching user recipes:', err);
        res.status(500).json({ error: 'Error fetching user recipes' });
    }
});

/**
 * GET /recipes/mine - JSON of user's recipes
 */
router.get('/mine', async (req, res) => {
    try {
        const recipes = await Recipe.getAllRecipesForUser(req.user.Email);
        res.json(recipes);
    } catch (err) {
        console.error('Error fetching user recipes:', err);
        res.status(500).json({ error: 'Error fetching user recipes' });
    }
});

/**
 * GET /recipes/shared - list shared recipes
 */
router.get('/shared', async (req, res) => {
    try {
        const { subjectId } = req.query;
        if (!subjectId) {
            return res.status(400).json({ error: 'Subject is required' });
        }
        let recipes = await Recipe.getSharedRecipes(subjectId);
        for (let recipe of recipes) {
            if (recipe.UserEmail === req.user.Email) {
                recipe.Author = "you";
            }
        }

        const getDomain = email => email.includes("@") ? email.split("@")[1].toLowerCase() : null;        
        const userDomain = getDomain(req.user.Email);
        recipes = recipes.filter(recipe => getDomain(recipe.UserEmail) === userDomain);

        res.json(recipes);
    } catch (err) {
        console.error('Error fetching shared recipes:', err);
        res.status(500).json({ error: 'Error fetching shared recipes' });
    }
});

/**
 * POST /recipes/new - save a recipe
 */
router.post('/new', async (req, res) => {
    try {
        const { subjectId, topic, prompt } = req.body;
        if (!topic || !subjectId || !prompt) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const recipeData = {
            userEmail: req.user.Email,
            savedDate: (new Date()).toISOString(),
            subjectId,
            topic,
            prompt,
        };
        const success = await Recipe.addRecipe(recipeData);
        if (success) {
            res.status(201).json({ message: 'Recipe saved successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save recipe' });
        }
    } catch (err) {
        console.error('Error saving new recipe:', err);
        res.status(500).json({ error: 'Error saving new recipe' });
    }
});

/**
 * PUT /recipes/share - mark recipe shared
 */
router.put('/share', async (req, res) => {
    try {
        const { recipeId } = req.body;
        if (!recipeId) {
            return res.status(400).json({ error: 'Recipe ID is required' });
        }        
        const success = await Recipe.updateRecipeToShared(recipeId, true);
        if (success) {
            res.json({ message: 'Recipe shared successfully' });
        } else {
            res.status(404).json({ error: 'Recipe not found' });
        }
    } catch (err) {
        console.error('Error sharing recipe:', err);
        res.status(500).json({ error: 'Error sharing recipe' });
    }
});

/**
 * PUT /recipes/unshare - revoke sharing
 */
router.put('/unshare', async (req, res) => {
    try {
        const { recipeId } = req.body;
        if (!recipeId) {
            return res.status(400).json({ error: 'Recipe ID is required' });
        }
        const success = await Recipe.updateRecipeToShared(recipeId, false);
        if (success) {
            res.json({ message: 'Recipe unshared successfully' });
        } else {
            res.status(404).json({ error: 'Recipe not found' });
        }
    } catch (err) {
        console.error('Error unsharing recipe:', err);
        res.status(500).json({ error: 'Error unsharing recipe' });
    }
});

/**
 * DELETE /recipes/delete - soft delete
 */
router.delete('/delete', async (req, res) => {
    try {
        const { recipeId } = req.body;
        if (!recipeId) {
            return res.status(400).json({ error: 'Recipe ID is required' });
        }
        const success = await Recipe.setRecipeAsDeleted(recipeId);
        if (success) {
            res.json({ message: 'Recipe deleted successfully' });
        } else {
            res.status(404).json({ error: 'Recipe not found' });
        }
    } catch (err) {
        console.error('Error deleting recipe:', err);
        res.status(500).json({ error: 'Error deleting recipe' });
    }
});

/**
 * GET /recipes/subjects - list subjects
 */
router.get('/subjects', async (req, res) => {
    try {
        const subjects = await Subject.getAll();
        res.json(subjects);
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ error: 'Error fetching subjects' });
    }
});

/**
 * GET /recipes/templates - available templates
 */
router.get('/templates', async (req, res) => {
    fs.readFile(path.join(__dirname, '../assets/recipe_templates.json'), 'utf8', (err, jsonString) => {
        if (err) {
            console.error('Error reading file:', err);
            res.status(500).json({ error: 'Error reading recipe templates' });
            return;
        }
        res.json(JSON.parse(jsonString));
    });
});


module.exports = router;
