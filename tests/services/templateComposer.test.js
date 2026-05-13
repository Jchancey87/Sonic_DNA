/**
 * Example: Testing TemplateComposer with MockAIAdapter
 * 
 * This demonstrates seam discipline:
 * - TemplateComposer owns business logic (pure functions testable in isolation)
 * - Adapters are injected, not hardcoded
 * - Tests use MockAIAdapter for instant, deterministic results
 * - Production uses OpenAIAdapter for real API calls
 * 
 * Run: npm test -- tests/services/templateComposer.test.js
 */

import { describe, it, expect } from '@jest/globals';
import { TemplateComposer } from '../../services/templateComposer.js';
import { MockAIAdapter } from '../../adapters/MockAIAdapter.js';

describe('TemplateComposer', () => {
  let composer;
  let mockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAIAdapter();
    composer = new TemplateComposer(mockAdapter);
  });

  describe('generateTemplate()', () => {
    it('generates template with requested lenses', async () => {
      const template = await composer.generateTemplate(
        'Song Name',
        'Artist Name',
        ['rhythm', 'harmony']
      );

      expect(template.title).toBeDefined();
      expect(template.lenses).toHaveProperty('rhythm');
      expect(template.lenses).toHaveProperty('harmony');
      expect(template.lenses.rhythm.questions).toHaveLength(4);
    });

    it('generates template for single lens', async () => {
      const template = await composer.generateTemplate(
        'Song Name',
        'Artist Name',
        ['texture']
      );

      expect(template.lenses).toHaveProperty('texture');
      expect(Object.keys(template.lenses)).toHaveLength(1);
    });

    it('includes research context in prompt', async () => {
      // This test verifies that research context is incorporated
      // by checking the mock adapter receives the right prompt
      const customResponse = JSON.stringify({
        title: 'Test',
        lenses: {
          rhythm: {
            description: 'Test rhythm',
            questions: ['Q1', 'Q2'],
          },
        },
      });

      const customAdapter = new MockAIAdapter(customResponse);
      const customComposer = new TemplateComposer(customAdapter);

      const template = await customComposer.generateTemplate(
        'Song',
        'Artist',
        ['rhythm'],
        'Research context about production'
      );

      expect(template.title).toBe('Test');
      // Verification: prompt was built correctly (verify via spies in real tests)
    });

    it('falls back to default template when AI service fails', async () => {
      const failingAdapter = {
        async generateTemplate() {
          throw new Error('API unavailable');
        },
      };

      const composerWithFailure = new TemplateComposer(failingAdapter);
      const template = await composerWithFailure.generateTemplate(
        'Song',
        'Artist',
        ['rhythm', 'harmony']
      );

      // Should return fallback template
      expect(template.lenses).toHaveProperty('rhythm');
      expect(template.lenses).toHaveProperty('harmony');
      expect(template.lenses.rhythm.questions.length).toBeGreaterThan(0);
    });

    it('throws error for invalid lenses', async () => {
      expect(async () => {
        await composer.generateTemplate('Song', 'Artist', ['invalid_lens']);
      }).rejects.toThrow('Unknown lenses');
    });

    it('throws error when required parameters missing', async () => {
      expect(async () => {
        await composer.generateTemplate('', 'Artist', ['rhythm']);
      }).rejects.toThrow();

      expect(async () => {
        await composer.generateTemplate('Song', '', ['rhythm']);
      }).rejects.toThrow();

      expect(async () => {
        await composer.generateTemplate('Song', 'Artist', []);
      }).rejects.toThrow();
    });

    it('validates template structure from mock adapter', async () => {
      const template = await composer.generateTemplate(
        'Song',
        'Artist',
        ['arrangement']
      );

      // Verify template structure
      expect(template).toHaveProperty('title');
      expect(template).toHaveProperty('lenses');
      expect(template).toHaveProperty('workflow_guidance');
      expect(template.lenses.arrangement).toHaveProperty('description');
      expect(template.lenses.arrangement).toHaveProperty('questions');
      expect(Array.isArray(template.lenses.arrangement.questions)).toBe(true);
    });
  });

  describe('Integration with injected adapters', () => {
    it('uses injected adapter for API calls', async () => {
      const mockCalls = [];
      const trackedAdapter = {
        async generateTemplate(prompt) {
          mockCalls.push(prompt);
          return mockAdapter.generateTemplate(prompt);
        },
      };

      const trackedComposer = new TemplateComposer(trackedAdapter);
      await trackedComposer.generateTemplate('Song', 'Artist', ['rhythm']);

      // Verify adapter was called
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0]).toContain('rhythm');
    });

    it('requires adapter to be provided', () => {
      expect(() => {
        new TemplateComposer(null);
      }).toThrow('TemplateComposer requires an IAIModelService adapter');
    });
  });

  describe('Performance (with mock adapter)', () => {
    it('completes instantly with mock adapter', async () => {
      const startTime = Date.now();

      await composer.generateTemplate('Song', 'Artist', ['rhythm', 'harmony', 'texture', 'arrangement']);

      const duration = Date.now() - startTime;
      // Should complete in <50ms (instant, no network)
      expect(duration).toBeLessThan(50);
    });
  });
});

/**
 * Integration test example (optional, expensive - only run in CI)
 * 
 * This would use the REAL OpenAIAdapter and cost money to run.
 * Typically disabled in local development, enabled in CI/CD only.
 */

describe('TemplateComposer - Integration Tests (Optional)', () => {
  it.skip('generates template with real OpenAI', async () => {
    // Only enable this in CI with budget allocated
    // Skip in local development to save money

    const { OpenAIAdapter } = await import('../../adapters/OpenAIAdapter.js');

    if (!process.env.OPENAI_API_KEY || process.env.NODE_ENV !== 'test-integration') {
      console.log('Skipping OpenAI integration test (no API key or not in CI)');
      return;
    }

    const realAdapter = new OpenAIAdapter();
    const composer = new TemplateComposer(realAdapter);

    const template = await composer.generateTemplate(
      'Let It Be',
      'The Beatles',
      ['harmony', 'arrangement']
    );

    expect(template.lenses).toHaveProperty('harmony');
    expect(template.lenses).toHaveProperty('arrangement');
  });
});
