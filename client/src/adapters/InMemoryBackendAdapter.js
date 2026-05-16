import { IBackendService } from '../ports/IBackendService.js';

/**
 * InMemoryBackendAdapter - Mock implementation of IBackendService
 * 
 * Used for isolated UI testing and Storybook.
 * Stores all data in memory (volatile).
 */
export class InMemoryBackendAdapter extends IBackendService {
  constructor() {
    super();
    this.songs = [];
    this.audits = [];
    this.techniques = [];
    this.currentUser = null;
  }

  // Auth
  async login(email, password) {
    this.currentUser = { id: 'user-1', email, name: 'Test User' };
    return { token: 'mock-token', user: this.currentUser };
  }

  async register(email, password, name) {
    this.currentUser = { id: 'user-1', email, name };
    return { token: 'mock-token', user: this.currentUser };
  }

  // Songs
  async getSongs(filters = {}) {
    return this.songs;
  }

  async getSong(id) {
    return this.songs.find(s => s._id === id) || null;
  }

  async importSong(youtubeUrl) {
    const song = {
      _id: `song-${Date.now()}`,
      title: 'Mock Song',
      artist: 'Mock Artist',
      youtubeUrl,
      youtubeId: 'mock-id',
      thumbnail: 'https://via.placeholder.com/150',
    };
    this.songs.push(song);
    return song;
  }

  async deleteSong(id) {
    this.songs = this.songs.filter(s => s._id !== id);
    return true;
  }

  // Audits
  async getAudits() {
    return this.audits;
  }

  async generateTemplate(songId, lenses) {
    return {
      title: 'Mock Audit',
      lenses: lenses.reduce((acc, lens) => {
        acc[lens] = { description: `Mock ${lens}`, questions: ['Q1?', 'Q2?'] };
        return acc;
      }, {})
    };
  }

  async createAudit(auditData) {
    const audit = { ...auditData, _id: `audit-${Date.now()}`, createdAt: new Date() };
    this.audits.push(audit);
    return audit;
  }

  async getAuditsForSong(songId) {
    return this.audits.filter(a => a.songId === songId);
  }

  async getAudit(id) {
    return this.audits.find(a => a._id === id) || null;
  }

  async updateAudit(id, updates) {
    const index = this.audits.findIndex(a => a._id === id);
    if (index === -1) throw new Error('Not found');
    this.audits[index] = { ...this.audits[index], ...updates };
    return this.audits[index];
  }

  async deleteAudit(id) {
    this.audits = this.audits.filter(a => a._id !== id);
    return true;
  }

  // Techniques
  async getTechniques(filters = {}) {
    return { techniques: this.techniques, grouped: {} };
  }

  async addTechnique(techniqueData) {
    const tech = { ...techniqueData, _id: `tech-${Date.now()}` };
    this.techniques.push(tech);
    return tech;
  }

  async deleteTechnique(id) {
    this.techniques = this.techniques.filter(t => t._id !== id);
    return true;
  }
}
