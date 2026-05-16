import express from 'express';
import axios from 'axios';

export default function createSongRoutes(songService) {
  const router = express.Router();

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

      // Fetch video metadata from YouTube API (OEmbed)
      let title = 'Unknown Song';
      let artist = 'Unknown Artist';
      let thumbnail = null;

      try {
        const oembed = await axios.get(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
        );
        title = oembed.data.title || title;
        thumbnail = oembed.data.thumbnail_url || null;
      } catch (err) {
        console.warn('Could not fetch YouTube metadata:', err.message);
      }

      // Extract artist and title if possible
      if (title && title.includes('-')) {
        const parts = title.split('-');
        artist = parts[0].trim();
        title = parts.slice(1).join('-').trim();
      }

      // Fetch research via injected search service if available
      let research = null;
      if (songService.searchService) {
        research = await songService.searchService.searchSongInfo(title, artist);
      }

      // Call service to import
      const song = await songService.importSong({
        youtubeId,
        youtubeUrl,
        title,
        artist,
        thumbnail,
        userId
      }, research);

      res.status(201).json({
        song: {
          _id: song._id,
          title: song.title,
          artist: song.artist,
          youtubeId: song.youtubeId,
          youtubeUrl: song.youtubeUrl,
          thumbnail: song.thumbnail,
          researchSummary: song.researchSummary,
        }
      });
    } catch (error) {
      console.error('Import error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get all songs for user
  router.get('/', async (req, res) => {
    try {
      const userId = req.userId;
      const filters = req.query;

      const songs = await songService.getUserSongs(userId, filters);

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
      const song = await songService.getSong(req.params.id, userId);

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
      // Note: auditRepository should be injected in server.js bootstrap if we want cascade
      const result = await songService.deleteSong(req.params.id, userId, songService.auditRepository);

      if (!result) {
        return res.status(404).json({ error: 'Song not found' });
      }

      res.json({ message: 'Song deleted' });
    } catch (error) {
      console.error('Delete song error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}


