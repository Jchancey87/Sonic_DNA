import { ISearchService } from '../ports/ISearchService.js';

/**
 * MockSearchAdapter - Test implementation of ISearchService
 * 
 * Returns mock research data for testing.
 * Allows tests to run instantly without network calls or cost.
 * Can be configured to simulate different responses or errors.
 * 
 * Usage:
 *   const mockAdapter = new MockSearchAdapter();
 *   const research = await mockAdapter.searchSongInfo('Song', 'Artist');
 *   // Completes instantly with predictable data
 * 
 * With custom response:
 *   const mockAdapter = new MockSearchAdapter({
 *     summary: 'Custom research for this test'
 *   });
 */

export class MockSearchAdapter extends ISearchService {
  constructor(responseOverride = null) {
    super();
    this.responseOverride = responseOverride;
  }

  async searchSongInfo(title, artist) {
    // Allow tests to inject custom responses
    if (this.responseOverride) {
      return {
        query: `${title} by ${artist}`,
        results: this.responseOverride.results || [],
        summary: this.responseOverride.summary || 'Mock research data',
        timestamp: new Date().toISOString(),
      };
    }

    // Default: return consistent mock data for testing
    return {
      query: `${title} by ${artist}`,
      results: [
        {
          title: `${title} - Song Analysis`,
          url: `https://example.com/songs/${title}`,
          content: `${title} by ${artist} is a well-crafted track featuring innovative arrangement and harmonic structure. The production showcases excellent texture work with spatial depth. The rhythm section demonstrates tight coordination between drums, bass, and groove elements.`,
        },
      ],
      summary: `${title} by ${artist} is known for its innovative production techniques and harmonic complexity. [Key topics: arrangement, harmony, texture]`,
      timestamp: new Date().toISOString(),
    };
  }
}
