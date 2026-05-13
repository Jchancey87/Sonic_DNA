import express from 'express';
import axios from 'axios';
import Song from '../models/Song.js';
import { TavilyAdapter } from '../adapters/TavilyAdapter.js';

const router = express.Router();

// Initialize adapter (production)
const searchAdapter = new TavilyAdapter();

// Import song from YouTube URL
router.post('/import', async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    const userId = req.userId;

    if (!youtubeUrl) {
      return res.status(400).json({ error: 'YouTube URL required' });
    }

    // Extract video ID
    const youtubeIdMatch = youtubeUrl.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.{11})/
    );

    if (!youtubeIdMatch) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const youtubeId = youtubeIdMatch[1];

    // Check if user already imported this song
    const existingSong = await Song.findOne({ userId, youtubeId });
    if (existingSong) {
      return res.status(400).json({ error: 'You have already imported this song' });
    }

    // Fetch video metadata from YouTube API
    let title = 'Unknown Song';
    let artist = 'Unknown Artist';
    let duration = null;
    let thumbnail = null;

    try {
      // Using oembed endpoint (no API key required)
      const oembed = await axios.get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
      );
      title = oembed.data.title || title;
      thumbnail = oembed.data.thumbnail_url || null;
    } catch (err) {
      console.warn('Could not fetch YouTube metadata:', err.message);
      // Fallback: use URL parameters if available
    }

    // Extract artist and title from YouTube title if possible
    if (title && title.includes('-')) {
      const parts = title.split('-');
      artist = parts[0].trim();
      title = parts.slice(1).join('-').trim();
    }

    // Fetch research from Tavily using adapter (production or injected test mock)
    const research = await searchAdapter.searchSongInfo(title, artist);

    // Create song document
    const song = new Song({
      youtubeId,
      youtubeUrl,
      title,
      artist,
      duration,
      thumbnail,
      researchSummary: research,
      userId,
    });

    await song.save();

    res.status(201).json({
      song: {
        _id: song._id,
        title: song.title,
        artist: song.artist,
        youtubeId: song.youtubeId,
        youtubeUrl: song.youtubeUrl,
        thumbnail: song.thumbnail,
        researchSummary: song.researchSummary,
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all songs for user
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { artist, search } = req.query;

    let query = { userId };

    if (artist) {
      query.artist = { $regex: artist, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } },
      ];
    }

    const songs = await Song.find(query).sort({ createdAt: -1 });

    res.json(songs);
  } catch (error) {
    console.error('Get songs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get song by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const song = await Song.findOne({ _id: req.params.id, userId });

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json(song);
  } catch (error) {
    console.error('Get song error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete song
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const song = await Song.findOneAndDelete({ _id: req.params.id, userId });

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json({ message: 'Song deleted' });
  } catch (error) {
    console.error('Delete song error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
