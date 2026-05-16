import express from 'express';

export default function createAuditRoutes(auditService, templateComposer) {
  const router = express.Router();

  // Generate audit template
  router.post('/generate-template', async (req, res) => {
    try {
      const { songId, lenses, workflowType } = req.body;
      const userId = req.userId;

      if (!songId || !lenses || lenses.length === 0) {
        return res.status(400).json({ error: 'songId and lenses required' });
      }

      // Verify song ownership
      const song = await auditService.songRepository.findOne({ _id: songId, userId });
      if (!song) {
        return res.status(404).json({ error: 'Song not found' });
      }

      // Generate customized template using deep module
      const template = await templateComposer.generateTemplate(
        song.title,
        song.artist,
        lenses,
        song.researchSummary?.summary || ''
      );

      res.json({
        template,
        song: {
          _id: song._id,
          title: song.title,
          artist: song.artist,
          youtubeId: song.youtubeId,
        },
        workflowType: workflowType || 'quick',
      });
    } catch (error) {
      console.error('Generate template error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create/save audit
  router.post('/', async (req, res) => {
    try {
      const { songId, lensSelection, responses, bookmarks, techniques, workflowType } = req.body;
      const userId = req.userId;

      if (!songId || !lensSelection) {
        return res.status(400).json({ error: 'songId and lensSelection required' });
      }

      const audit = await auditService.createAudit({
        songId,
        userId,
        lensSelection: Array.isArray(lensSelection) ? lensSelection : [lensSelection],
        responses: responses || {},
        bookmarks: bookmarks || [],
        techniques: techniques || [],
        workflowType: workflowType || 'quick'
      });

      res.status(201).json({
        audit: {
          _id: audit._id,
          songId: audit.songId,
          lensSelection: audit.lensSelection,
          workflowType: audit.workflowType,
          createdAt: audit.createdAt,
        }
      });
    } catch (error) {
      console.error('Create audit error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get audit by ID
  router.get('/:id', async (req, res) => {
    try {
      const userId = req.userId;
      const audit = await auditService.getAudit(req.params.id, userId);

      if (!audit) {
        return res.status(404).json({ error: 'Audit not found' });
      }

      res.json(audit);
    } catch (error) {
      console.error('Get audit error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all audits for a song
  router.get('/song/:songId', async (req, res) => {
    try {
      const userId = req.userId;
      const { songId } = req.params;

      const audits = await auditService.getAuditsForSong(songId, userId);

      res.json(audits);
    } catch (error) {
      console.error('Get audits error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all audits for user
  router.get('/', async (req, res) => {
    try {
      const userId = req.userId;
      const audits = await auditService.getUserAudits(userId);

      res.json(audits);
    } catch (error) {
      console.error('Get user audits error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update audit
  router.patch('/:id', async (req, res) => {
    try {
      const userId = req.userId;
      const { responses, bookmarks, techniques } = req.body;

      let audit;
      if (responses) {
        audit = await auditService.updateResponses(req.params.id, userId, responses);
      }
      
      // Note: addBookmark and logTechnique are also available in service
      // For now, we'll keep it simple and just return the audit if updated
      if (!audit) {
        audit = await auditService.getAudit(req.params.id, userId);
      }

      if (!audit) {
        return res.status(404).json({ error: 'Audit not found' });
      }

      res.json(audit);
    } catch (error) {
      console.error('Update audit error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete audit
  router.delete('/:id', async (req, res) => {
    try {
      const userId = req.userId;
      const result = await auditService.deleteAudit(req.params.id, userId);

      if (!result) {
        return res.status(404).json({ error: 'Audit not found' });
      }

      res.json({ message: 'Audit deleted' });
    } catch (error) {
      console.error('Delete audit error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}


