import axios from 'axios';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = 'https://api.tavily.com/search';

export async function searchSongInfo(title, artist) {
  try {
    if (!TAVILY_API_KEY) {
      console.warn('Tavily API key not configured');
      return {
        query: `${title} by ${artist}`,
        results: [],
        summary: 'No research data available. Configure Tavily API key to enable song research.',
      };
    }

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
          TAVILY_API_URL,
          {
            api_key: TAVILY_API_KEY,
            query: query,
            topic: 'music',
            max_results: 5,
          },
          { timeout: 10000 }
        );

        if (response.data.results) {
          allResults = allResults.concat(response.data.results);
          if (bestResults.length === 0) {
            bestResults = response.data.results.slice(0, 3);
          }
        }
      } catch (queryErr) {
        console.warn(`Tavily search for "${query}" failed:`, queryErr.message);
      }
    }

    // Parse and summarize key findings
    const summary = parseResearchSummary(bestResults);

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

function parseResearchSummary(results) {
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
    summary += `\n\nKey topics: ${topMentions.join(', ')}`;
  }

  return summary.substring(0, 500); // Limit to 500 chars
}

export default { searchSongInfo };
