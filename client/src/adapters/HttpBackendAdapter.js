import axios from 'axios';
import { IBackendService } from '../ports/IBackendService.js';

/**
 * HttpBackendAdapter - Production implementation of IBackendService
 * 
 * Communicates with the real Express backend using Axios.
 */
export class HttpBackendAdapter extends IBackendService {
  constructor(baseURL) {
    super();
    this.api = axios.create({
      baseURL: baseURL || 'http://localhost:5050/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth
  async login(email, password) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email, password, name) {
    const response = await this.api.post('/auth/register', { email, password, name });
    return response.data;
  }

  // Songs
  async getSongs(filters = {}) {
    const response = await this.api.get('/songs', { params: filters });
    return response.data;
  }

  async getSong(id) {
    const response = await this.api.get(`/songs/${id}`);
    return response.data;
  }

  async importSong(youtubeUrl) {
    const response = await this.api.post('/songs/import', { youtubeUrl });
    return response.data;
  }

  async deleteSong(id) {
    const response = await this.api.delete(`/songs/${id}`);
    return response.data;
  }

  // Audits
  async getAudits() {
    const response = await this.api.get('/audits');
    return response.data;
  }

  async generateTemplate(songId, lenses, workflowType) {
    const response = await this.api.post('/audits/generate-template', { songId, lenses, workflowType });
    return response.data;
  }

  async createAudit(auditData) {
    const response = await this.api.post('/audits', auditData);
    return response.data;
  }

  async getAuditsForSong(songId) {
    const response = await this.api.get(`/audits/song/${songId}`);
    return response.data;
  }

  async getAudit(id) {
    const response = await this.api.get(`/audits/${id}`);
    return response.data;
  }

  async updateAudit(id, updates) {
    const response = await this.api.patch(`/audits/${id}`, updates);
    return response.data;
  }

  async deleteAudit(id) {
    const response = await this.api.delete(`/audits/${id}`);
    return response.data;
  }

  // Techniques
  async getTechniques(filters = {}) {
    const response = await this.api.get('/techniques', { params: filters });
    return response.data;
  }

  async addTechnique(techniqueData) {
    const response = await this.api.post('/techniques', techniqueData);
    return response.data;
  }

  async deleteTechnique(id) {
    const response = await this.api.delete(`/techniques/${id}`);
    return response.data;
  }
}
