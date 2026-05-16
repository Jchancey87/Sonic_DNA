import express from 'express';

export default function createTechniqueRoutes(techniqueService) {
  const router = express.Router();

  // Get all techniques for user
  router.get('/', async (req, res) => {
    try {
      const userId = req.userId;
      const filters = req.query;

      const result = await techniqueService.getUserTechniques(userId, filters);

      res.json(result);
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

      const techniques = await techniqueService.getTechniquesByCategory(userId, category);

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
      const technique = await techniqueService.addTechnique({ ...req.body, userId });

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
      const technique = await techniqueService.updateTechnique(req.params.id, userId, req.body);

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
      const result = await techniqueService.deleteTechnique(req.params.id, userId);

      res.json({ message: 'Technique deleted' });
    } catch (error) {
      console.error('Delete technique error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

