/**
 * TechniqueService - Business logic for technique notebook.
 *
 * Key changes:
 * - Uses 'lens' instead of 'category' (schema rename).
 * - Full filter query builder: q (full-text), lens, artist, songId, auditId,
 *   tags (CSV), sortBy, order, page, limit.
 * - All queries filter deletedAt: null.
 * - Soft-delete on deleteTechnique().
 */

const VALID_LENSES = ['rhythm', 'texture', 'harmony', 'arrangement'];
const VALID_NEXT_ACTIONS = ['study', 'practice', 'transcribe', 'apply', 'revisit', null];

export class TechniqueService {
  constructor(techniqueRepository) {
    this.techniqueRepository = techniqueRepository;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async getUserTechniques(userId, filters = {}) {
    const {
      q,
      lens,
      category,   // backward-compat alias for lens
      artist,
      songId,
      auditId,
      tags,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit,
    } = filters;

    const resolvedLens = lens || category;
    const query = { userId, deletedAt: null };

    if (resolvedLens && VALID_LENSES.includes(resolvedLens)) {
      query.lens = resolvedLens;
    }
    if (artist) {
      query.artist = { $regex: artist, $options: 'i' };
    }
    if (songId) {
      query.songId = songId;
    }
    if (auditId) {
      query.auditId = auditId;
    }
    if (tags) {
      const tagList = String(tags).split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) query.tags = { $in: tagList };
    }

    // Full-text search via MongoDB $text index (techniqueName + description + notes)
    if (q) {
      query.$text = { $search: q };
    }

    // Legacy fallback: if no text index, use regex on description
    if (filters.search && !q) {
      query.$or = [
        { description: { $regex: filters.search, $options: 'i' } },
        { techniqueName: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } },
        { notes: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const validSortFields = ['createdAt', 'techniqueName', 'lens', 'artist'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = order === 'asc' ? 1 : -1;

    const queryOptions = { sort: { [sortField]: sortDir } };
    if (limit) {
      queryOptions.limit = Number(limit);
      queryOptions.skip = (Number(page) - 1) * Number(limit);
    }

    const techniques = await this.techniqueRepository.find(query, queryOptions);

    // Group by lens for notebook display
    const grouped = {};
    techniques.forEach((tech) => {
      const key = tech.lens || tech.category || 'other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(tech);
    });

    return { techniques, grouped };
  }

  async getTechniquesByLens(userId, lens) {
    if (!VALID_LENSES.includes(lens)) throw new Error('Invalid lens');
    return this.techniqueRepository.find(
      { userId, lens, deletedAt: null },
      { sort: { createdAt: -1 } }
    );
  }

  // Keep backward-compat method name
  async getTechniquesByCategory(userId, category) {
    return this.getTechniquesByLens(userId, category);
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async addTechnique(data) {
    const {
      userId,
      songId,
      auditId,
      artist,
      techniqueName,
      description,
      lens,
      category,     // backward-compat alias
      exampleTimestamp,
      sourceTimestamp, // backward-compat alias
      tags,
      notes,
      confidence,
      nextAction,
    } = data;

    const resolvedLens = lens || category;

    if (!description) throw new Error('description is required');
    if (!resolvedLens) throw new Error('lens is required');
    if (!VALID_LENSES.includes(resolvedLens)) throw new Error('Invalid lens');
    if (confidence !== undefined && (confidence < 1 || confidence > 5)) {
      throw new Error('confidence must be between 1 and 5');
    }
    if (nextAction && !VALID_NEXT_ACTIONS.includes(nextAction)) {
      throw new Error('Invalid nextAction value');
    }

    return this.techniqueRepository.create({
      userId,
      songId,
      auditId,
      artist,
      techniqueName: techniqueName || '',
      description,
      lens: resolvedLens,
      exampleTimestamp: exampleTimestamp ?? sourceTimestamp,
      tags: tags || [],
      notes,
      confidence,
      nextAction: nextAction || null,
      deletedAt: null,
    });
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async updateTechnique(techniqueId, userId, updates) {
    const existing = await this.techniqueRepository.findById(techniqueId);
    if (!existing || existing.deletedAt || existing.userId.toString() !== userId.toString()) {
      throw new Error('Technique not found');
    }

    const allowed = ['techniqueName', 'description', 'lens', 'artist', 'tags', 'notes', 'confidence', 'nextAction', 'exampleTimestamp'];
    const sanitized = { updatedAt: new Date() };
    for (const key of allowed) {
      if (updates[key] !== undefined) sanitized[key] = updates[key];
    }
    // backward compat: accept 'category' as 'lens'
    if (updates.category && !updates.lens) sanitized.lens = updates.category;

    return this.techniqueRepository.updateById(techniqueId, sanitized);
  }

  // ─── Delete (soft) ────────────────────────────────────────────────────────

  async deleteTechnique(techniqueId, userId) {
    const existing = await this.techniqueRepository.findById(techniqueId);
    if (!existing || existing.deletedAt || existing.userId.toString() !== userId.toString()) {
      throw new Error('Technique not found');
    }
    await this.techniqueRepository.updateById(techniqueId, { deletedAt: new Date() });
    return true;
  }
}
