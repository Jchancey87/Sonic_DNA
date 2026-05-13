/**
 * Example: Testing AuditService with InMemoryRepository
 * 
 * Demonstrates seam discipline for audit management:
 * - Business logic separated from database access
 * - Repositories injected (production MongoDB or test in-memory)
 * - Tests use InMemoryRepository for speed and isolation
 * 
 * Run: npm test -- tests/services/auditService.test.js
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuditService } from '../../services/auditService.js';
import { InMemoryRepository } from '../../adapters/InMemoryRepository.js';

describe('AuditService', () => {
  let auditService;
  let auditRepository;
  let techniqueRepository;
  let songRepository;

  beforeEach(async () => {
    // Use in-memory repositories for tests
    auditRepository = new InMemoryRepository();
    techniqueRepository = new InMemoryRepository();
    songRepository = new InMemoryRepository();

    auditService = new AuditService(auditRepository, techniqueRepository, songRepository);

    // Create a test song
    await songRepository.create({
      _id: 'song123',
      title: 'Test Song',
      artist: 'Test Artist',
      userId: 'user123',
    });
  });

  describe('createAudit()', () => {
    it('creates audit with selected lenses', async () => {
      const audit = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm', 'harmony'],
        responses: {
          'rhythm-q1': 'Answer to rhythm question 1',
        },
        workflowType: 'guided',
      });

      expect(audit._id).toBeDefined();
      expect(audit.lensSelection).toContain('rhythm');
      expect(audit.lensSelection).toContain('harmony');
      expect(audit.status).toBe('completed');
    });

    it('validates required fields', async () => {
      expect(async () => {
        await auditService.createAudit({
          songId: 'song123',
          userId: 'user123',
          lensSelection: [], // Empty lenses
        });
      }).rejects.toThrow();

      expect(async () => {
        await auditService.createAudit({
          songId: 'song123',
          // Missing userId
          lensSelection: ['rhythm'],
        });
      }).rejects.toThrow('Missing required fields');
    });

    it('verifies song ownership (if songRepository provided)', async () => {
      expect(async () => {
        await auditService.createAudit({
          songId: 'song123',
          userId: 'different_user', // Doesn't own this song
          lensSelection: ['rhythm'],
        });
      }).rejects.toThrow('Song not found');
    });
  });

  describe('getAudit()', () => {
    it('returns audit if user owns it', async () => {
      const created = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      const audit = await auditService.getAudit(created._id, 'user123');

      expect(audit._id).toBe(created._id);
    });

    it('returns null if user does not own audit', async () => {
      const created = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      const audit = await auditService.getAudit(created._id, 'different_user');

      expect(audit).toBeNull();
    });
  });

  describe('getAuditsForSong()', () => {
    beforeEach(async () => {
      // Create multiple audits for same song
      await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['harmony'],
      });
    });

    it('returns all audits for a song', async () => {
      const audits = await auditService.getAuditsForSong('song123', 'user123');

      expect(audits).toHaveLength(2);
      expect(audits.every((a) => a.songId === 'song123')).toBe(true);
    });

    it('returns empty array if user does not own song', async () => {
      const audits = await auditService.getAuditsForSong('song123', 'different_user');

      expect(audits).toHaveLength(0);
    });
  });

  describe('getUserAudits()', () => {
    beforeEach(async () => {
      // Create audits for one user
      await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      // Create audits for different user (won't affect user123)
      await songRepository.create({
        _id: 'song456',
        title: 'Other Song',
        userId: 'user456',
      });

      const auditService2 = new AuditService(auditRepository, techniqueRepository, songRepository);
      await auditService2.createAudit({
        songId: 'song456',
        userId: 'user456',
        lensSelection: ['harmony'],
      });
    });

    it('returns only audits for specified user', async () => {
      const audits = await auditService.getUserAudits('user123');

      expect(audits).toHaveLength(1);
      expect(audits[0].userId).toBe('user123');
    });

    it('returns audits in reverse chronological order', async () => {
      const audit1 = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      const audit2 = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['harmony'],
      });

      const audits = await auditService.getUserAudits('user123');

      // Most recent first
      expect(audits[0]._id).toBe(audit2._id);
      expect(audits[1]._id).toBe(audit1._id);
    });
  });

  describe('addBookmark()', () => {
    it('adds bookmark to audit', async () => {
      const audit = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      const updated = await auditService.addBookmark(audit._id, 'user123', {
        timestamp: 45.5,
        note: 'Interesting rhythm pattern here',
      });

      expect(updated.bookmarks).toHaveLength(1);
      expect(updated.bookmarks[0].timestamp).toBe(45.5);
      expect(updated.bookmarks[0].note).toContain('rhythm');
    });

    it('allows multiple bookmarks', async () => {
      const audit = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      await auditService.addBookmark(audit._id, 'user123', {
        timestamp: 30,
        note: 'Bookmark 1',
      });

      const updated = await auditService.addBookmark(audit._id, 'user123', {
        timestamp: 60,
        note: 'Bookmark 2',
      });

      expect(updated.bookmarks).toHaveLength(2);
    });

    it('rejects bookmark from different user', async () => {
      const audit = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      expect(async () => {
        await auditService.addBookmark(audit._id, 'different_user', {
          timestamp: 30,
          note: 'Hacked bookmark',
        });
      }).rejects.toThrow('Audit not found');
    });
  });

  describe('logTechnique()', () => {
    it('creates technique entry', async () => {
      const audit = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      const technique = await auditService.logTechnique(audit._id, 'user123', {
        description: 'Syncopated kick pattern',
        category: 'rhythm',
        sourceTimestamp: 45.5,
        tags: ['kick', 'syncopation'],
      });

      expect(technique._id).toBeDefined();
      expect(technique.description).toContain('kick');
      expect(technique.category).toBe('rhythm');
    });

    it('associates technique with song and user', async () => {
      const audit = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      const technique = await auditService.logTechnique(audit._id, 'user123', {
        description: 'Test technique',
        category: 'rhythm',
        sourceTimestamp: 0,
      });

      expect(technique.userId).toBe('user123');
      expect(technique.songId).toBe('song123');
      expect(technique.auditId).toBe(audit._id);
    });
  });

  describe('deleteAudit()', () => {
    it('deletes audit if user owns it', async () => {
      const audit = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      const deleted = await auditService.deleteAudit(audit._id, 'user123');

      expect(deleted).toBe(true);

      const found = await auditService.getAudit(audit._id, 'user123');
      expect(found).toBeNull();
    });

    it('cascade deletes techniques', async () => {
      const audit = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      // Create a technique
      await auditService.logTechnique(audit._id, 'user123', {
        description: 'Technique',
        category: 'rhythm',
        sourceTimestamp: 0,
      });

      // Verify technique exists
      let techniques = await techniqueRepository.find({ auditId: audit._id });
      expect(techniques).toHaveLength(1);

      // Delete audit
      await auditService.deleteAudit(audit._id, 'user123');

      // Technique should be deleted too
      techniques = await techniqueRepository.find({ auditId: audit._id });
      expect(techniques).toHaveLength(0);
    });

    it('returns false if user does not own audit', async () => {
      const audit = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      const deleted = await auditService.deleteAudit(audit._id, 'different_user');

      expect(deleted).toBe(false);

      // Original should still exist
      const found = await auditService.getAudit(audit._id, 'user123');
      expect(found).not.toBeNull();
    });
  });

  describe('getStats()', () => {
    it('calculates audit statistics', async () => {
      await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm', 'harmony'],
      });

      await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm', 'texture'],
      });

      const stats = await auditService.getStats('user123');

      expect(stats.totalAudits).toBe(2);
      expect(stats.completedAudits).toBe(2);
      expect(stats.lensStats.rhythm).toBe(2);
      expect(stats.lensStats.harmony).toBe(1);
      expect(stats.lensStats.texture).toBe(1);
    });
  });

  describe('Performance (with InMemoryRepository)', () => {
    it('handles 100 audits in <50ms', async () => {
      const startTime = Date.now();

      // Create 100 audits
      for (let i = 0; i < 100; i++) {
        await auditService.createAudit({
          songId: 'song123',
          userId: 'user123',
          lensSelection: ['rhythm', 'harmony'],
        });
      }

      // Query
      await auditService.getUserAudits('user123');
      await auditService.getStats('user123');

      const duration = Date.now() - startTime;

      // In-memory should be instant
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Error isolation', () => {
    it('errors do not corrupt state', async () => {
      const audit1 = await auditService.createAudit({
        songId: 'song123',
        userId: 'user123',
        lensSelection: ['rhythm'],
      });

      // Try to add bookmark with wrong user (should fail)
      expect(async () => {
        await auditService.addBookmark(audit1._id, 'wrong_user', {
          timestamp: 0,
          note: 'Hacked',
        });
      }).rejects.toThrow();

      // Original audit should be unchanged
      const found = await auditService.getAudit(audit1._id, 'user123');
      expect(found.bookmarks).toHaveLength(0); // Still no bookmarks
    });
  });
});
