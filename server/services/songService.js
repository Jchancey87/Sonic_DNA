/**
 * SongService - Deep module for song management
 * 
 * Owns the business logic for:
 * - Validating song imports
 * - Searching songs
 * - Filtering by user
 * 
 * The repository (production or test) is injected as a dependency.
 * This decouples business logic from MongoDB, making tests fast.
 * 
 * Tests inject InMemoryRepository for instant, isolated tests.
 * Production injects MongooseRepository for real database access.
 */

export class SongService {
  constructor(songRepository, searchService) {
    if (!songRepository) {
      throw new Error('SongService requires a song repository');
    }
    this.songRepository = songRepository;
    this.searchService = searchService;
  }

  /**
   * Import a song from YouTube
   * @param {Object} songData - { title, artist, youtubeId, youtubeUrl, thumbnail, userId }
   * @param {Object} research - Research summary from search service
   * @returns {Promise<Object>} Created song document
   * @throws {Error} if song already imported or creation fails
   */
  async importSong(songData, research) {
    const { title, artist, youtubeId, youtubeUrl, userId } = songData;

    // Validate required fields
    if (!title || !artist || !youtubeId || !youtubeUrl || !userId) {
      throw new Error('Missing required fields: title, artist, youtubeId, youtubeUrl, userId');
    }

    // Check if already imported
    const existing = await this.songRepository.findOne({
      userId,
      youtubeId,
    });

    if (existing) {
      throw new Error('You have already imported this song');
    }

    // Create song with research
    const song = await this.songRepository.create({
      ...songData,
      researchSummary: research || { query: `${title} by ${artist}`, summary: '' },
      importedAt: new Date(),
    });

    return song;
  }

  /**
   * Get all songs for a user
   * @param {string} userId - User ID
   * @param {Object} filters - { artist?: string, search?: string }
   * @returns {Promise<Array>} Array of songs
   */
  async getUserSongs(userId, filters = {}) {
    const query = { userId };

    if (filters.artist) {
      query.artist = filters.artist;
    }

    const songs = await this.songRepository.find(query, {
      sort: { importedAt: -1 },
    });

    // Client-side search if needed (for title/research)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return songs.filter((song) => {
        const titleMatch = song.title.toLowerCase().includes(searchLower);
        const artistMatch = song.artist.toLowerCase().includes(searchLower);
        const researchMatch =
          song.researchSummary?.summary?.toLowerCase()?.includes(searchLower) || false;

        return titleMatch || artistMatch || researchMatch;
      });
    }

    return songs;
  }

  /**
   * Get a song by ID (verify ownership)
   * @param {string} songId - Song ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Song or null
   */
  async getSong(songId, userId) {
    const song = await this.songRepository.findById(songId);

    // Verify ownership
    if (song && song.userId !== userId) {
      return null; // Silently return null to avoid information leakage
    }

    return song;
  }

  /**
   * Delete a song (cascade delete audits)
   * @param {string} songId - Song ID
   * @param {string} userId - User ID
   * @param {Object} auditRepository - For cascade delete
   * @returns {Promise<boolean>} true if deleted
   */
  async deleteSong(songId, userId, auditRepository) {
    const song = await this.getSong(songId, userId);

    if (!song) {
      return false;
    }

    // Cascade delete all audits for this song
    if (auditRepository) {
      await auditRepository.deleteMany({ songId });
    }

    await this.songRepository.deleteById(songId);
    return true;
  }

  /**
   * Get song statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} { totalSongs, totalAudits, artistCount }
   */
  async getStats(userId) {
    const songs = await this.songRepository.find({ userId });

    const artists = new Set(songs.map((s) => s.artist));

    return {
      totalSongs: songs.length,
      artistCount: artists.size,
      artists: Array.from(artists),
    };
  }

  /**
   * Update song research
   * @param {string} songId - Song ID
   * @param {string} userId - User ID
   * @param {Object} research - New research data
   * @returns {Promise<Object>} Updated song
   */
  async updateResearch(songId, userId, research) {
    const song = await this.getSong(songId, userId);

    if (!song) {
      throw new Error('Song not found');
    }

    return this.songRepository.updateById(songId, {
      researchSummary: research,
      updatedAt: new Date(),
    });
  }
}
