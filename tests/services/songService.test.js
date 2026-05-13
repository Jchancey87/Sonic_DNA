/**
 * Example: Testing SongService with InMemoryRepository
 * 
 * This demonstrates seam discipline for database access:
 * - SongService owns business logic
 * - Repository interface is injected (production MongoDB or test in-memory)
 * - Tests use InMemoryRepository for instant, isolated testing
 * - No database connection needed for unit tests
 * 
 * Run: npm test -- tests/services/songService.test.js
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SongService } from '../../services/songService.js';
import { InMemoryRepository } from '../../adapters/InMemoryRepository.js';

describe('SongService', () => {
  let songService;
  let songRepository;

  beforeEach(async () => {
    // Use in-memory repository for tests (instant, no DB)
    songRepository = new InMemoryRepository();
    songService = new SongService(songRepository);
  });

  describe('importSong()', () => {
    it('creates a new song with research', async () => {
      const songData = {
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        youtubeId: 'fJ9rUzIMt7o',
        youtubeUrl: 'https://youtube.com/watch?v=fJ9rUzIMt7o',
        userId: 'user123',
      };

      const research = {
        query: 'Bohemian Rhapsody by Queen',
        summary: 'A masterpiece of rock music with complex harmonies',
      };

      const song = await songService.importSong(songData, research);

      expect(song._id).toBeDefined();
      expect(song.title).toBe('Bohemian Rhapsody');
      expect(song.artist).toBe('Queen');
      expect(song.researchSummary.summary).toContain('masterpiece');
    });

    it('prevents duplicate imports', async () => {
      const songData = {
        title: 'Song',
        artist: 'Artist',
        youtubeId: 'abc123',
        youtubeUrl: 'https://youtube.com/watch?v=abc123',
        userId: 'user123',
      };

      // First import succeeds
      await songService.importSong(songData, {});

      // Second import fails
      expect(async () => {
        await songService.importSong(songData, {});
      }).rejects.toThrow('already imported');
    });

    it('validates required fields', async () => {
      const invalidData = {
        title: 'Song',
        // Missing artist, youtubeId, etc.
        userId: 'user123',
      };

      expect(async () => {
        await songService.importSong(invalidData, {});
      }).rejects.toThrow('Missing required fields');
    });

    it('handles different users importing same YouTube video', async () => {
      const youtubeId = 'same123';

      const song1 = await songService.importSong(
        {
          title: 'Song',
          artist: 'Artist',
          youtubeId,
          youtubeUrl: 'https://youtube.com/watch?v=same123',
          userId: 'user1',
        },
        {}
      );

      const song2 = await songService.importSong(
        {
          title: 'Song',
          artist: 'Artist',
          youtubeId,
          youtubeUrl: 'https://youtube.com/watch?v=same123',
          userId: 'user2', // Different user
        },
        {}
      );

      expect(song1._id).not.toBe(song2._id);
      expect(song1.userId).toBe('user1');
      expect(song2.userId).toBe('user2');
    });
  });

  describe('getUserSongs()', () => {
    beforeEach(async () => {
      // Create test data
      await songService.importSong(
        {
          title: 'Song 1',
          artist: 'Artist A',
          youtubeId: 'vid1',
          youtubeUrl: 'https://youtube.com/watch?v=vid1',
          userId: 'user123',
        },
        {}
      );

      await songService.importSong(
        {
          title: 'Song 2',
          artist: 'Artist B',
          youtubeId: 'vid2',
          youtubeUrl: 'https://youtube.com/watch?v=vid2',
          userId: 'user123',
        },
        {}
      );

      await songService.importSong(
        {
          title: 'Song 3',
          artist: 'Artist A',
          youtubeId: 'vid3',
          youtubeUrl: 'https://youtube.com/watch?v=vid3',
          userId: 'user456', // Different user
        },
        {}
      );
    });

    it('gets all songs for a user', async () => {
      const songs = await songService.getUserSongs('user123');

      expect(songs).toHaveLength(2);
      expect(songs.every((s) => s.userId === 'user123')).toBe(true);
    });

    it('filters songs by artist', async () => {
      const songs = await songService.getUserSongs('user123', {
        artist: 'Artist A',
      });

      expect(songs).toHaveLength(1);
      expect(songs[0].artist).toBe('Artist A');
    });

    it('searches songs by title', async () => {
      const songs = await songService.getUserSongs('user123', {
        search: 'Song 1',
      });

      expect(songs).toHaveLength(1);
      expect(songs[0].title).toBe('Song 1');
    });

    it('returns empty array for user with no songs', async () => {
      const songs = await songService.getUserSongs('nonexistent');

      expect(songs).toHaveLength(0);
    });
  });

  describe('getSong()', () => {
    it('returns song if user owns it', async () => {
      const imported = await songService.importSong(
        {
          title: 'Song',
          artist: 'Artist',
          youtubeId: 'vid1',
          youtubeUrl: 'https://youtube.com/watch?v=vid1',
          userId: 'user123',
        },
        {}
      );

      const song = await songService.getSong(imported._id, 'user123');

      expect(song._id).toBe(imported._id);
      expect(song.title).toBe('Song');
    });

    it('returns null if user does not own song', async () => {
      const imported = await songService.importSong(
        {
          title: 'Song',
          artist: 'Artist',
          youtubeId: 'vid1',
          youtubeUrl: 'https://youtube.com/watch?v=vid1',
          userId: 'user123',
        },
        {}
      );

      const song = await songService.getSong(imported._id, 'different_user');

      expect(song).toBeNull();
    });

    it('returns null for nonexistent song', async () => {
      const song = await songService.getSong('nonexistent', 'user123');

      expect(song).toBeNull();
    });
  });

  describe('deleteSong()', () => {
    it('deletes song if user owns it', async () => {
      const imported = await songService.importSong(
        {
          title: 'Song',
          artist: 'Artist',
          youtubeId: 'vid1',
          youtubeUrl: 'https://youtube.com/watch?v=vid1',
          userId: 'user123',
        },
        {}
      );

      const deleted = await songService.deleteSong(imported._id, 'user123');

      expect(deleted).toBe(true);

      const found = await songService.getSong(imported._id, 'user123');
      expect(found).toBeNull();
    });

    it('returns false if user does not own song', async () => {
      const imported = await songService.importSong(
        {
          title: 'Song',
          artist: 'Artist',
          youtubeId: 'vid1',
          youtubeUrl: 'https://youtube.com/watch?v=vid1',
          userId: 'user123',
        },
        {}
      );

      const deleted = await songService.deleteSong(imported._id, 'different_user');

      expect(deleted).toBe(false);
    });
  });

  describe('getStats()', () => {
    it('calculates song statistics', async () => {
      await songService.importSong(
        {
          title: 'Song 1',
          artist: 'Artist A',
          youtubeId: 'vid1',
          youtubeUrl: 'https://youtube.com/watch?v=vid1',
          userId: 'user123',
        },
        {}
      );

      await songService.importSong(
        {
          title: 'Song 2',
          artist: 'Artist A',
          youtubeId: 'vid2',
          youtubeUrl: 'https://youtube.com/watch?v=vid2',
          userId: 'user123',
        },
        {}
      );

      await songService.importSong(
        {
          title: 'Song 3',
          artist: 'Artist B',
          youtubeId: 'vid3',
          youtubeUrl: 'https://youtube.com/watch?v=vid3',
          userId: 'user123',
        },
        {}
      );

      const stats = await songService.getStats('user123');

      expect(stats.totalSongs).toBe(3);
      expect(stats.artistCount).toBe(2);
      expect(stats.artists).toContain('Artist A');
      expect(stats.artists).toContain('Artist B');
    });
  });

  describe('Performance (with InMemoryRepository)', () => {
    it('completes all operations in <100ms', async () => {
      const startTime = Date.now();

      // Import 50 songs
      for (let i = 0; i < 50; i++) {
        await songService.importSong(
          {
            title: `Song ${i}`,
            artist: `Artist ${i % 5}`,
            youtubeId: `vid${i}`,
            youtubeUrl: `https://youtube.com/watch?v=vid${i}`,
            userId: 'user123',
          },
          {}
        );
      }

      // Query operations
      await songService.getUserSongs('user123');
      await songService.getStats('user123');

      const duration = Date.now() - startTime;

      // Should complete instantly with in-memory storage
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Isolation between tests', () => {
    it('each test gets fresh repository', async () => {
      // First test created songs in beforeEach
      let songs = await songService.getUserSongs('user123');
      expect(songs).toHaveLength(0); // Fresh repository

      await songService.importSong(
        {
          title: 'Test Song',
          artist: 'Artist',
          youtubeId: 'vid1',
          youtubeUrl: 'https://youtube.com/watch?v=vid1',
          userId: 'user123',
        },
        {}
      );

      songs = await songService.getUserSongs('user123');
      expect(songs).toHaveLength(1);
    });
  });
});

/**
 * Integration test example (optional, uses real MongoDB)
 * 
 * Skip by default; enable only in CI with MongoDB running
 */

describe('SongService - Integration Tests (Optional)', () => {
  it.skip('works with real MongooseRepository', async () => {
    // Would use real MongoDB here
    // Only enable in CI environment
    const { MongooseRepository } = await import('../../adapters/MongooseRepository.js');
    const { Song } = await import('../../models/Song.js');

    if (!process.env.MONGODB_URI) {
      console.log('Skipping MongoDB integration test');
      return;
    }

    const songRepo = new MongooseRepository(Song);
    const service = new SongService(songRepo);

    // Test would work with real DB
  });
});
