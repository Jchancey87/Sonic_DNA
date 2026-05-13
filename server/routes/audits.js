import express from 'express';
import Audit from '../models/Audit.js';
import Song from '../models/Song.js';
import TechniqueEntry from '../models/TechniqueEntry.js';
import { TemplateComposer } from '../services/templateComposer.js';
import { OpenAIAdapter } from '../adapters/OpenAIAdapter.js';

const router = express.Router();

// Initialize adapters and services (production)
const aiAdapter = new OpenAIAdapter();
const templateComposer = new TemplateComposer(aiAdapter);

// Generate audit template
router.post('/generate-template', async (req, res) => {
  try {
    const { songId, lenses, workflowType } = req.body;
    const userId = req.userId;

    if (!songId || !lenses || lenses.length === 0) {
      return res.status(400).json({ error: 'songId and lenses required' });
    }

    // Verify song belongs to user
    const song = await Song.findOne({ _id: songId, userId });
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

    // Verify song exists
    const song = await Song.findOne({ _id: songId, userId });
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Create audit
    const audit = new Audit({
      songId,
      userId,
      lensSelection: Array.isArray(lensSelection) ? lensSelection : [lensSelection],
      responses: responses || {},
      bookmarks: bookmarks || [],
      techniques: techniques || [],
      workflowType: workflowType || 'quick',
      status: 'completed',
    });

    await audit.save();

    // Save technique entries if provided
    if (techniques && techniques.length > 0) {
      const techEntries = techniques.map((tech) => ({
        userId,
        songId,
        auditId: audit._id,
        artist: song.artist,
        description: tech.description,
        category: tech.category,
        sourceTimestamp: tech.sourceTimestamp,
        tags: tech.tags || [],
        notes: tech.notes,
      }));

      await TechniqueEntry.insertMany(techEntries);
    }

    res.status(201).json({
      audit: {
        _id: audit._id,
        songId: audit.songId,
        lensSelection: audit.lensSelection,
        workflowType: audit.workflowType,
        createdAt: audit.createdAt,
      },
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
    const audit = await Audit.findOne({ _id: req.params.id, userId })
      .populate('songId', 'title artist youtubeId youtubeUrl')
      .lean();

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

    // Verify song belongs to user
    const song = await Song.findOne({ _id: songId, userId });
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const audits = await Audit.find({ songId, userId })
      .select('_id lensSelection workflowType createdAt status')
      .sort({ createdAt: -1 });

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

    const audits = await Audit.find({ userId })
      .populate('songId', 'title artist youtubeId')
      .select('_id songId lensSelection workflowType createdAt status')
      .sort({ createdAt: -1 });

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

    const audit = await Audit.findOneAndUpdate(
      { _id: req.params.id, userId },
      {
        responses: responses || undefined,
        bookmarks: bookmarks || undefined,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    // Handle new techniques
    if (techniques && techniques.length > 0) {
      const song = await Song.findById(audit.songId);
      const techEntries = techniques.map((tech) => ({
        userId,
        songId: audit.songId,
        auditId: audit._id,
        artist: song.artist,
        description: tech.description,
        category: tech.category,
        sourceTimestamp: tech.sourceTimestamp,
        tags: tech.tags || [],
        notes: tech.notes,
      }));

      await TechniqueEntry.insertMany(techEntries);
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
    const audit = await Audit.findOneAndDelete({ _id: req.params.id, userId });

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    // Delete associated technique entries
    await TechniqueEntry.deleteMany({ auditId: audit._id });

    res.json({ message: 'Audit deleted' });
  } catch (error) {
    console.error('Delete audit error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
