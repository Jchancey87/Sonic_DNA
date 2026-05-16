export class TechniqueService {
  constructor(techniqueRepository) {
    this.techniqueRepository = techniqueRepository;
  }

  async getUserTechniques(userId, filters = {}) {
    const { category, search, artist } = filters;
    let query = { userId };

    if (category && ['rhythm', 'texture', 'harmony', 'arrangement'].includes(category)) {
      query.category = category;
    }

    if (artist) {
      query.artist = { $regex: artist, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const techniques = await this.techniqueRepository.find(query, { sort: { createdAt: -1 } });
    
    // Group by category for easier display
    const grouped = {};
    techniques.forEach((tech) => {
      if (!grouped[tech.category]) {
        grouped[tech.category] = [];
      }
      grouped[tech.category].push(tech);
    });

    return { techniques, grouped };
  }

  async getTechniquesByCategory(userId, category) {
    if (!['rhythm', 'texture', 'harmony', 'arrangement'].includes(category)) {
      throw new Error('Invalid category');
    }

    return await this.techniqueRepository.find(
      { userId, category },
      { sort: { createdAt: -1 } }
    );
  }

  async addTechnique(data) {
    const { userId, songId, auditId, artist, description, category, sourceTimestamp, tags, notes } = data;

    if (!description || !category) {
      throw new Error('description and category required');
    }

    if (!['rhythm', 'texture', 'harmony', 'arrangement'].includes(category)) {
      throw new Error('Invalid category');
    }

    const techniqueData = {
      userId,
      songId,
      auditId,
      artist,
      description,
      category,
      sourceTimestamp,
      tags: tags || [],
      notes,
    };

    return await this.techniqueRepository.create(techniqueData);
  }

  async updateTechnique(techniqueId, userId, updates) {
    const { description, category, tags, notes } = updates;

    // Verify ownership
    const existing = await this.techniqueRepository.findById(techniqueId);
    if (!existing || existing.userId.toString() !== userId.toString()) {
      throw new Error('Technique not found');
    }

    return await this.techniqueRepository.updateById(techniqueId, {
      description,
      category,
      tags,
      notes,
      updatedAt: new Date()
    });
  }

  async deleteTechnique(techniqueId, userId) {
    // Verify ownership
    const existing = await this.techniqueRepository.findById(techniqueId);
    if (!existing || existing.userId.toString() !== userId.toString()) {
      throw new Error('Technique not found');
    }

    await this.techniqueRepository.deleteById(techniqueId);
    return true;
  }
}
