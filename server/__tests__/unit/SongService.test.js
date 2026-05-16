import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { SongService } from '../../services/songService.js';
import { InMemoryRepository } from '../../adapters/InMemoryRepository.js';

describe('SongService Unit Tests', () => {
  let songService;
  let songRepository;
  let mockSearchService;

  beforeEach(() => {
    songRepository = new InMemoryRepository();
    mockSearchService = {
      searchSongInfo: jest.fn()
    };
    songService = new SongService(songRepository, mockSearchService);
  });

  describe('importSong', () => {
    test('should save a new song correctly', async () => {
      const songData = {
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        youtubeId: 'fJ9rUzIMcZQ',
        youtubeUrl: 'https://youtube.com/watch?v=fJ9rUzIMcZQ',
        userId: 'user-1'
      };
      const research = { summary: 'A masterpiece' };

      const result = await songService.importSong(songData, research);

      expect(result._id).toBeDefined();
      expect(result.title).toBe('Bohemian Rhapsody');
      expect(result.researchSummary.summary).toBe('A masterpiece');
      
      const saved = await songRepository.findById(result._id);
      expect(saved.userId).toBe('user-1');
    });

    test('should throw error if song already imported by user', async () => {
      const songData = {
        title: 'Song',
        artist: 'Artist',
        youtubeId: 'id1',
        youtubeUrl: 'url1',
        userId: 'user-1'
      };

      await songService.importSong(songData, null);
      
      await expect(songService.importSong(songData, null))
        .rejects.toThrow('You have already imported this song');
    });
  });

  describe('getUserSongs', () => {
    test('should filter by search term', async () => {
      await songRepository.create({ title: 'Blue Monday', artist: 'New Order', userId: 'user-1' });
      await songRepository.create({ title: 'Bizarre Love Triangle', artist: 'New Order', userId: 'user-1' });
      await songRepository.create({ title: 'Other', artist: 'Other', userId: 'user-1' });

      const results = await songService.getUserSongs('user-1', { search: 'Blue' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Blue Monday');
    });
  });
});
