import express from 'express';

export default function createTechniqueRoutes(techniqueService) {
  const router = express.Router();

  // ── Get techniques with full filter support ────────────────────────────────
  // Supported query params: q, lens, category (alias), artist, songId, auditId,
  //   tags (CSV), sortBy, order, page, limit
  router.get('/', async (req, res) => {
    try {
      const result = await techniqueService.getUserTechniques(req.userId, req.query);
      res.json(result);
    } catch (error) {
      console.error('Get techniques error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ── Get techniques by lens ────────────────────────────────────────────────
  router.get('/lens/:lens', async (req, res) => {
    try {
      const techniques = await techniqueService.getTechniquesByLens(req.userId, req.params.lens);
      res.json(techniques);
    } catch (error) {
      if (error.message === 'Invalid lens') return res.status(400).json({ error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Backward-compat alias: /category/:category → /lens/:lens
  router.get('/category/:category', async (req, res) => {
    try {
      const techniques = await techniqueService.getTechniquesByLens(req.userId, req.params.category);
      res.json(techniques);
    } catch (error) {
      if (error.message === 'Invalid lens') return res.status(400).json({ error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ── Add technique entry ────────────────────────────────────────────────────
  router.post('/', async (req, res) => {
    try {
      const technique = await techniqueService.addTechnique({ ...req.body, userId: req.userId });
      res.status(201).json(technique);
    } catch (error) {
      console.error('Add technique error:', error);
      res.status(error.message.includes('required') || error.message.includes('Invalid') ? 400 : 500)
        .json({ error: error.message });
    }
  });

  // ── Update technique entry ─────────────────────────────────────────────────
  router.patch('/:id', async (req, res) => {
    try {
      const technique = await techniqueService.updateTechnique(req.params.id, req.userId, req.body);
      res.json(technique);
    } catch (error) {
      if (error.message === 'Technique not found') return res.status(404).json({ error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ── Soft-delete technique entry ────────────────────────────────────────────
  router.delete('/:id', async (req, res) => {
    try {
      await techniqueService.deleteTechnique(req.params.id, req.userId);
      res.json({ message: 'Technique deleted' });
    } catch (error) {
      if (error.message === 'Technique not found') return res.status(404).json({ error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
