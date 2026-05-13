/**
 * Example: Testing Tavily integration with MockSearchAdapter
 * 
 * This demonstrates seam discipline:
 * - Real TavilyAdapter makes network calls (production)
 * - MockSearchAdapter returns instant data (tests)
 * - Both implement the same ISearchService interface
 * - Tests are isolated from network, costs, and rate limits
 * 
 * Run: npm test -- tests/adapters/tavilyAdapter.test.js
 */

import { describe, it, expect } from '@jest/globals';
import { TavilyAdapter } from '../../adapters/TavilyAdapter.js';
import { MockSearchAdapter } from '../../adapters/MockSearchAdapter.js';

describe('Tavily Search Adapters', () => {
  describe('TavilyAdapter', () => {
    it('handles missing API key gracefully', async () => {
      const adapter = new TavilyAdapter(null); // No API key
      const result = await adapter.searchSongInfo('Song', 'Artist');

      expect(result.query).toBe('Song by Artist');
      expect(result.results).toEqual([]);
      expect(result.summary).toContain('Configure Tavily API key');
    });

    it('returns structure with required fields', async () => {
      const adapter = new TavilyAdapter(null);
      const result = await adapter.searchSongInfo('Song', 'Artist');

      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
    });

    it.skip('searches with real API (integration test)', async () => {
      // Skip by default - only enable in CI with Tavily key configured
      if (!process.env.TAVILY_API_KEY) {
        console.log('Skipping Tavily integration test (no API key)');
        return;
      }

      const adapter = new TavilyAdapter(process.env.TAVILY_API_KEY);
      const result = await adapter.searchSongInfo('Bohemian Rhapsody', 'Queen');

      expect(result.query).toBe('Bohemian Rhapsody by Queen');
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.summary.length).toBeGreaterThan(0);
    });
  });

  describe('MockSearchAdapter', () => {
    it('returns consistent mock data', async () => {
      const adapter = new MockSearchAdapter();
      const result = await adapter.searchSongInfo('Song Title', 'Artist Name');

      expect(result.query).toBe('Song Title by Artist Name');
      expect(result.results.length).toBe(1);
      expect(result.summary).toContain('known for');
    });

    it('supports custom responses for test scenarios', async () => {
      const customResult = {
        results: [
          { title: 'Result 1', content: 'Content 1' },
          { title: 'Result 2', content: 'Content 2' },
        ],
        summary: 'Custom summary',
      };

      const adapter = new MockSearchAdapter(customResult);
      const result = await adapter.searchSongInfo('Song', 'Artist');

      expect(result.results).toHaveLength(2);
      expect(result.summary).toBe('Custom summary');
    });

    it('completes instantly without network', async () => {
      const adapter = new MockSearchAdapter();
      const startTime = Date.now();

      await adapter.searchSongInfo('Song', 'Artist');

      const duration = Date.now() - startTime;
      // Should be instant, no network latency
      expect(duration).toBeLessThan(10);
    });

    it('maintains timestamp consistency', async () => {
      const adapter = new MockSearchAdapter();
      const result1 = await adapter.searchSongInfo('Song', 'Artist');
      const result2 = await adapter.searchSongInfo('Song', 'Artist');

      // Timestamps should be different (millisecond resolution)
      expect(result1.timestamp).not.toBe(result2.timestamp);
      expect(typeof result1.timestamp).toBe('string');
      expect(typeof result2.timestamp).toBe('string');
    });
  });

  describe('Seam discipline', () => {
    it('both adapters implement same interface', async () => {
      const tavilyAdapter = new TavilyAdapter(null);
      const mockAdapter = new MockSearchAdapter();

      // Both should have the same methods
      expect(typeof tavilyAdapter.searchSongInfo).toBe('function');
      expect(typeof mockAdapter.searchSongInfo).toBe('function');

      // Both should return same structure
      const tavilyResult = await tavilyAdapter.searchSongInfo('Test', 'Artist');
      const mockResult = await mockAdapter.searchSongInfo('Test', 'Artist');

      expect(tavilyResult).toHaveProperty('query');
      expect(tavilyResult).toHaveProperty('results');
      expect(tavilyResult).toHaveProperty('summary');
      expect(tavilyResult).toHaveProperty('timestamp');

      expect(mockResult).toHaveProperty('query');
      expect(mockResult).toHaveProperty('results');
      expect(mockResult).toHaveProperty('summary');
      expect(mockResult).toHaveProperty('timestamp');
    });

    it('can swap adapters without changing test logic', async () => {
      // Test function that works with any search adapter
      async function testSearchFlow(adapter, title, artist) {
        const result = await adapter.searchSongInfo(title, artist);
        expect(result.query).toContain(title);
        return result;
      }

      const realAdapter = new TavilyAdapter(null);
      const mockAdapter = new MockSearchAdapter();

      // Same test works with both
      await testSearchFlow(realAdapter, 'Song', 'Artist');
      await testSearchFlow(mockAdapter, 'Song', 'Artist');
    });
  });

  describe('Error handling', () => {
    it('handles invalid inputs gracefully', async () => {
      const adapter = new MockSearchAdapter();

      // Should not throw for empty strings
      const result = await adapter.searchSongInfo('', '');
      expect(result).toHaveProperty('query');
    });

    it('returns fallback for real adapter with no API key', async () => {
      const adapter = new TavilyAdapter(''); // Invalid key

      const result = await adapter.searchSongInfo('Song', 'Artist');

      // Should still return valid structure, just with empty results
      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('summary');
    });
  });
});

/**
 * Example usage in route tests:
 * 
 * import { MockSearchAdapter } from '../../adapters/MockSearchAdapter.js';
 * 
 * test('POST /api/songs/import with mock search', async () => {
 *   const mockAdapter = new MockSearchAdapter();
 *   
 *   // In actual route, you would dependency-inject the adapter
 *   const result = await mockAdapter.searchSongInfo('Song', 'Artist');
 *   
 *   expect(result.summary).toBeDefined();
 * });
 */
