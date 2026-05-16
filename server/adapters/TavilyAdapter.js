import axios from 'axios';
import { ISearchService } from '../ports/ISearchService.js';

/**
 * TavilyAdapter - Production implementation of ISearchService
 * 
 * Calls the real Tavily API to research songs and artists.
 * This adapter handles:
 * - API authentication
 * - Multiple search queries (fallback if one fails)
 * - Response parsing
 * - Summary extraction
 * - Error handling and graceful degradation
 * 
 * Usage:
 *   const adapter = new TavilyAdapter();
 *   const research = await adapter.searchSongInfo('Song Name', 'Artist Name');
 */

export class TavilyAdapter extends ISearchService {
  constructor(apiKey = process.env.TAVILY_API_KEY) {
    super();
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.tavily.com/search';
  }

  async searchSongInfo(title, artist) {
    if (!this.apiKey || this.apiKey === 'your-tavily-api-key') {
      console.warn('[Tavily] ✗ No API key configured — skipping song research. Set TAVILY_API_KEY in .env');
      return this._noApiKeyResponse(title, artist);
    }
    console.log(`[Tavily] Searching for: "${title}" by ${artist}`);

    try {
      // Try multiple search queries to gather comprehensive info
      const queries = [
        `${title} ${artist} song analysis production`,
        `${artist} music style technique`,
        `${title} by ${artist}`,
      ];

      let allResults = [];
      let bestResults = [];

      for (const query of queries) {
        try {
          const response = await axios.post(
            this.apiUrl,
            {
              query: query,
              max_results: 5,
            },
            {
              timeout: 10000,
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.data.results) {
            allResults = allResults.concat(response.data.results);
            if (bestResults.length === 0) {
              bestResults = response.data.results.slice(0, 3);
            }
          }
        } catch (queryErr) {
          console.warn(`Tavily search for "${query}" failed:`, queryErr.message);
          // Continue to next query
        }
      }

      const summary = this._parseResearchSummary(bestResults);

      return {
        query: `${title} by ${artist}`,
        results: bestResults,
        summary: summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Tavily search error:', error.message);
      return {
        query: `${title} by ${artist}`,
        results: [],
        summary: `Error fetching research: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Response when API key is not configured
   * @private
   */
  _noApiKeyResponse(title, artist) {
    return {
      query: `${title} by ${artist}`,
      results: [],
      summary: 'No research data available. Configure Tavily API key to enable song research.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Parse and summarize research results
   * Extract relevant keywords and build summary from top results
   * @private
   */
  _parseResearchSummary(results) {
    if (!results || results.length === 0) {
      return 'No research results found.';
    }

    // Extract key information from top results
    const keywords = ['arrangement', 'harmony', 'production', 'rhythm', 'texture', 'technique', 'style', 'era'];
    const mentions = {};

    results.forEach((result) => {
      const content = (result.content || result.snippet || '').toLowerCase();
      keywords.forEach((keyword) => {
        if (content.includes(keyword)) {
          mentions[keyword] = (mentions[keyword] || 0) + 1;
        }
      });
    });

    // Build summary from top results
    const topMentions = Object.entries(mentions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key]) => key);

    let summary = '';
    if (results[0]) {
      summary = results[0].snippet || results[0].content || '';
    }

    if (topMentions.length > 0) {
      summary += ` [Key topics: ${topMentions.join(', ')}]`;
    }

    // Truncate to reasonable length
    return summary.substring(0, 500);
  }
}
