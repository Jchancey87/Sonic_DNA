/**
 * TemplateComposer - Deep module for audit template generation
 * 
 * Owns the business logic for:
 * - Building customized prompts from song data
 * - Composing research context with lens descriptions
 * - Parsing and validating template responses
 * - Generating fallback templates
 * 
 * The AI adapter (production or test) is injected as a dependency.
 * This decouples the business logic from the external API.
 * 
 * Tests inject MockAIAdapter for instant, deterministic results.
 * Production injects OpenAIAdapter for real API calls.
 */

const LENS_DESCRIPTIONS = {
  rhythm: 'How does the song use drums, bass, and groove? Where do the kicks sit? How do the hats breathe? What is the pocket and feel?',
  texture: 'What are all the distinct textures and timbres? How is EQ used? What reverb and delays create space and depth? What is the surface feel?',
  harmony: 'What chords and progressions are used? Are there borrowed chords? Modal shifts? How does harmony move throughout?',
  arrangement: 'How is the song structured? What sections exist? How do transitions work? What instruments enter/exit? How does energy build?',
};

export class TemplateComposer {
  constructor(aiModelService) {
    if (!aiModelService) {
      throw new Error('TemplateComposer requires an IAIModelService adapter');
    }
    this.aiService = aiModelService;
  }

  /**
   * Generate a customized audit template for a song
   * 
   * @param {string} songTitle - Title of the song
   * @param {string} artist - Artist name
   * @param {string[]} lenses - Array of lens names ['rhythm', 'harmony', etc]
   * @param {string} researchSummary - Optional research context from Tavily or other source
   * @returns {Promise<Object>} Template object with lenses and questions
   * @throws {Error} if template generation or parsing fails
   */
  async generateTemplate(songTitle, artist, lenses, researchSummary = '') {
    // Validate inputs
    if (!songTitle || !artist || !lenses || lenses.length === 0) {
      throw new Error('songTitle, artist, and lenses are required');
    }

    // Validate lenses are known
    const invalidLenses = lenses.filter(lens => !LENS_DESCRIPTIONS[lens]);
    if (invalidLenses.length > 0) {
      throw new Error(`Unknown lenses: ${invalidLenses.join(', ')}`);
    }

    try {
      // Build the prompt
      const prompt = this._buildPrompt(songTitle, artist, lenses, researchSummary);

      // Call the AI adapter (production or mock)
      const responseJson = await this.aiService.generateTemplate(prompt);

      // Parse and validate response
      const template = JSON.parse(responseJson);
      return template;
    } catch (error) {
      // If AI service fails, fall back to hardcoded template
      console.warn(`Template generation failed (${error.message}), using fallback`);
      return this._buildFallbackTemplate(songTitle, artist, lenses);
    }
  }

  /**
   * Build the prompt sent to the AI model
   * This is pure business logic, testable independently
   * 
   * @private
   */
  _buildPrompt(songTitle, artist, lenses, researchSummary) {
    const lensDescriptions = lenses
      .map((lens) => `- ${lens}: ${LENS_DESCRIPTIONS[lens]}`)
      .join('\n');

    return `You are a music production expert specializing in detailed song analysis using the "Sonic DNA" methodology.

Song: "${songTitle}" by ${artist}
Research Context: ${researchSummary || 'No research available'}

Create a customized audit questionnaire for studying this song through these lenses:
${lensDescriptions}

Generate 4-6 focused, open-ended questions for EACH selected lens. Questions should:
1. Be actionable (something the listener can do while studying)
2. Reference specific musical techniques
3. Encourage detailed listening and analysis
4. Be specific to this song's characteristics

Format your response as JSON (no markdown, just the object):
{
  "title": "Sonic DNA Audit: [Song Name]",
  "artist": "${artist}",
  "lenses": {
    "lens_name": {
      "description": "short description of this lens",
      "questions": ["question 1", "question 2", ...]
    }
  },
  "workflow_guidance": "Brief guidance on how to approach this audit"
}

Only include the lenses specified: ${lenses.join(', ')}`;
  }

  /**
   * Generate a fallback template when AI service fails
   * Uses the same structure as AI-generated templates
   * 
   * @private
   */
  _buildFallbackTemplate(songTitle, artist, lenses) {
    const lensTemplates = {
      rhythm: {
        description: LENS_DESCRIPTIONS.rhythm,
        questions: [
          'What is the tempo and time signature?',
          'Describe the drum pattern and kick placement.',
          'How does the bass interact with the kick?',
          'What is the overall pocket and feel?',
          'Where does the groove breathe or swing?',
          'How do rhythmic elements create tension or release?',
        ],
      },
      texture: {
        description: LENS_DESCRIPTIONS.texture,
        questions: [
          'What are the main textures and timbres you hear?',
          'How is EQ used to shape each element?',
          'Describe the use of reverb and space.',
          'What delays or modulation effects are present?',
          'How do textures change through the song?',
          'What is the most interesting textural choice?',
        ],
      },
      harmony: {
        description: LENS_DESCRIPTIONS.harmony,
        questions: [
          'What is the key and primary chord progression?',
          'Are there any borrowed chords or surprising movements?',
          'How does harmony evolve through the song?',
          'Describe any modal shifts or harmonic tension.',
          'What chords create the most emotional impact?',
          'How does harmony interact with the melody?',
        ],
      },
      arrangement: {
        description: LENS_DESCRIPTIONS.arrangement,
        questions: [
          'What are the main sections (intro, verse, chorus, bridge)?',
          'How do instruments enter, build, and exit?',
          'Describe the energy arc from start to finish.',
          'What are the key transitions between sections?',
          'How is repetition and variation used?',
          'What arrangement element surprised you most?',
        ],
      },
    };

    const selectedLenses = {};
    lenses.forEach(lens => {
      if (lensTemplates[lens]) {
        selectedLenses[lens] = lensTemplates[lens];
      }
    });

    return {
      title: `Sonic DNA Audit: ${songTitle}`,
      artist,
      lenses: selectedLenses,
      workflow_guidance:
        'Work through each lens systematically. Play the song multiple times if needed. Take notes on specific moments and timestamps.',
    };
  }
}
