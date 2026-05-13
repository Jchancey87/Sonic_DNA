import express from 'express';
import TechniqueEntry from '../models/TechniqueEntry.js';

const router = express.Router();

// Get all techniques for user
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { category, search, artist } = req.query;

    let query = { userId };

    if (category && ['rhythm', 'texture', 'harmony', 'arrangement'].includes(category)) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    if (artist) {
      query.artist = { $regex: artist, $options: 'i' };
    }

    const techniques = await TechniqueEntry.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Group by category for easier display
    const grouped = {};
    techniques.forEach((tech) => {
      if (!grouped[tech.category]) {
        grouped[tech.category] = [];
      }
      grouped[tech.category].push(tech);
    });

    res.json({ techniques, grouped });
  } catch (error) {
    console.error('Get techniques error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get techniques by category
router.get('/category/:category', async (req, res) => {
  try {
    const userId = req.userId;
    const { category } = req.params;

    if (!['rhythm', 'texture', 'harmony', 'arrangement'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const techniques = await TechniqueEntry.find({ userId, category })
      .sort({ createdAt: -1 })
      .lean();

    res.json(techniques);
  } catch (error) {
    console.error('Get techniques by category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add technique entry
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { songId, auditId, artist, description, category, sourceTimestamp, tags, notes } = req.body;

    if (!description || !category) {
      return res.status(400).json({ error: 'description and category required' });
    }

    if (!['rhythm', 'texture', 'harmony', 'arrangement'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const technique = new TechniqueEntry({
      userId,
      songId,
      auditId,
      artist,
      description,
      category,
      sourceTimestamp,
      tags: tags || [],
      notes,
    });

    await technique.save();

    res.status(201).json(technique);
  } catch (error) {
    console.error('Add technique error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update technique entry
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { description, category, tags, notes } = req.body;

    const technique = await TechniqueEntry.findOneAndUpdate(
      { _id: req.params.id, userId },
      { description, category, tags, notes, updatedAt: new Date() },
      { new: true }
    );

    if (!technique) {
      return res.status(404).json({ error: 'Technique not found' });
    }

    res.json(technique);
  } catch (error) {
    console.error('Update technique error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete technique entry
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const technique = await TechniqueEntry.findOneAndDelete({ _id: req.params.id, userId });

    if (!technique) {
      return res.status(404).json({ error: 'Technique not found' });
    }

    res.json({ message: 'Technique deleted' });
  } catch (error) {
    console.error('Delete technique error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
