/**
 * AuditService - Deep module for audit management
 * 
 * Owns the business logic for:
 * - Creating and validating audits
 * - Fetching user audits
 * - Managing technique entries (cascade delete)
 * 
 * Repositories (production or test) are injected as dependencies.
 */

export class AuditService {
  constructor(auditRepository, techniqueRepository, songRepository) {
    if (!auditRepository) {
      throw new Error('AuditService requires an audit repository');
    }
    this.auditRepository = auditRepository;
    this.techniqueRepository = techniqueRepository;
    this.songRepository = songRepository;
  }

  /**
   * Create a new audit
   * @param {Object} auditData - { songId, userId, lensSelection, responses, bookmarks, workflowType }
   * @returns {Promise<Object>} Created audit
   * @throws {Error} if validation fails
   */
  async createAudit(auditData) {
    const { songId, userId, lensSelection, responses } = auditData;

    // Validate required fields
    if (!songId || !userId || !lensSelection || !Array.isArray(lensSelection)) {
      throw new Error('Missing required fields or invalid lensSelection');
    }

    if (lensSelection.length === 0) {
      throw new Error('At least one lens must be selected');
    }

    // Verify song exists and belongs to user (if songRepository provided)
    if (this.songRepository) {
      const song = await this.songRepository.findOne({ _id: songId, userId });
      if (!song) {
        throw new Error('Song not found');
      }
    }

    // Create audit
    const audit = await this.auditRepository.create({
      songId,
      userId,
      lensSelection,
      responses: responses || {},
      bookmarks: auditData.bookmarks || [],
      techniques: auditData.techniques || [],
      workflowType: auditData.workflowType || 'quick',
      status: 'completed',
      createdAt: new Date(),
    });

    return audit;
  }

  /**
   * Get audit by ID (verify ownership)
   * @param {string} auditId - Audit ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Audit or null
   */
  async getAudit(auditId, userId) {
    const audit = await this.auditRepository.findById(auditId);

    // Verify ownership
    if (audit && audit.userId !== userId) {
      return null;
    }

    return audit;
  }

  /**
   * Get all audits for a song (verify user owns song)
   * @param {string} songId - Song ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of audits
   */
  async getAuditsForSong(songId, userId) {
    // Verify song belongs to user
    if (this.songRepository) {
      const song = await this.songRepository.findOne({ _id: songId, userId });
      if (!song) {
        return []; // Return empty array if not owner
      }
    }

    return this.auditRepository.find(
      { songId, userId },
      {
        sort: { createdAt: -1 },
      }
    );
  }

  /**
   * Get all audits for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of audits
   */
  async getUserAudits(userId) {
    return this.auditRepository.find({ userId }, {
      sort: { createdAt: -1 },
    });
  }

  /**
   * Update audit responses
   * @param {string} auditId - Audit ID
   * @param {string} userId - User ID
   * @param {Object} responses - New responses
   * @returns {Promise<Object>} Updated audit
   */
  async updateResponses(auditId, userId, responses) {
    const audit = await this.getAudit(auditId, userId);

    if (!audit) {
      throw new Error('Audit not found');
    }

    return this.auditRepository.updateById(auditId, {
      responses,
      updatedAt: new Date(),
    });
  }

  /**
   * Add bookmark to audit
   * @param {string} auditId - Audit ID
   * @param {string} userId - User ID
   * @param {Object} bookmark - { timestamp, note }
   * @returns {Promise<Object>} Updated audit
   */
  async addBookmark(auditId, userId, bookmark) {
    const audit = await this.getAudit(auditId, userId);

    if (!audit) {
      throw new Error('Audit not found');
    }

    const bookmarks = audit.bookmarks || [];
    bookmarks.push({
      ...bookmark,
      createdAt: new Date(),
    });

    return this.auditRepository.updateById(auditId, {
      bookmarks,
      updatedAt: new Date(),
    });
  }

  /**
   * Log technique entry
   * @param {string} auditId - Audit ID
   * @param {string} userId - User ID
   * @param {Object} technique - { description, category, sourceTimestamp, tags, notes }
   * @returns {Promise<Object>} Technique entry
   */
  async logTechnique(auditId, userId, technique) {
    const audit = await this.getAudit(auditId, userId);

    if (!audit) {
      throw new Error('Audit not found');
    }

    // Create technique entry (if technique repository exists)
    if (this.techniqueRepository) {
      return this.techniqueRepository.create({
        auditId,
        userId,
        songId: audit.songId,
        description: technique.description,
        category: technique.category,
        sourceTimestamp: technique.sourceTimestamp,
        tags: technique.tags || [],
        notes: technique.notes,
        createdAt: new Date(),
      });
    }

    // Fallback: add to audit techniques
    const techniques = audit.techniques || [];
    techniques.push(technique);

    return this.auditRepository.updateById(auditId, {
      techniques,
      updatedAt: new Date(),
    });
  }

  /**
   * Delete audit (cascade delete techniques)
   * @param {string} auditId - Audit ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} true if deleted
   */
  async deleteAudit(auditId, userId) {
    const audit = await this.getAudit(auditId, userId);

    if (!audit) {
      return false;
    }

    // Cascade delete techniques
    if (this.techniqueRepository) {
      await this.techniqueRepository.deleteMany({ auditId });
    }

    await this.auditRepository.deleteById(auditId);
    return true;
  }

  /**
   * Get audit statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} { totalAudits, completedAudits, lensStats }
   */
  async getStats(userId) {
    const audits = await this.auditRepository.find({ userId });

    const lensStats = {};
    audits.forEach((audit) => {
      (audit.lensSelection || []).forEach((lens) => {
        lensStats[lens] = (lensStats[lens] || 0) + 1;
      });
    });

    return {
      totalAudits: audits.length,
      completedAudits: audits.filter((a) => a.status === 'completed').length,
      lensStats,
    };
  }
}
