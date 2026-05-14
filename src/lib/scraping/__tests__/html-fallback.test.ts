/**
 * Tests for HTML Fallback Parser
 */

import { describe, it, expect } from 'vitest';
import { parseHtmlFallback } from '../parsers/html-fallback';

describe('HTML Fallback Parser', () => {
  describe('parseHtmlFallback', () => {
    it('parses recipe with common class names', () => {
      const html = `
        <html>
          <body>
            <article>
              <h1 class="recipe-title">Homemade Pizza</h1>
              <ul class="recipe-ingredients">
                <li>2 cups flour</li>
                <li>1 cup water</li>
                <li>1 tsp yeast</li>
              </ul>
              <ol class="recipe-instructions">
                <li>Mix ingredients</li>
                <li>Knead dough</li>
                <li>Bake at 450°F</li>
              </ol>
              <img src="https://example.com/pizza.jpg" />
            </article>
          </body>
        </html>
      `;

      const result = parseHtmlFallback(html, 'https://example.com/recipe');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Homemade Pizza');
      expect(result?.ingredients).toHaveLength(3);
      expect(result?.ingredients).toContain('2 cups flour');
      expect(result?.instructions).toContain('Mix ingredients');
      expect(result?.imageUrl).toBe('https://example.com/pizza.jpg');
    });

    it('handles ingredients list class', () => {
      const html = `
        <html>
          <body>
            <h1>Simple Soup</h1>
            <ul class="ingredients">
              <li>Water</li>
              <li>Salt</li>
            </ul>
          </body>
        </html>
      `;

      const result = parseHtmlFallback(html, 'https://example.com');

      expect(result?.name).toBe('Simple Soup');
      expect(result?.ingredients).toEqual(['Water', 'Salt']);
    });

    it('handles itemprop attributes', () => {
      const html = `
        <html>
          <body>
            <article>
              <h1>Microdata Recipe</h1>
              <span itemprop="recipeIngredient">1 cup milk</span>
              <span itemprop="recipeIngredient">2 eggs</span>
              <div itemprop="recipeInstructions">Mix and cook.</div>
            </article>
          </body>
        </html>
      `;

      const result = parseHtmlFallback(html, 'https://example.com');

      expect(result?.ingredients).toContain('1 cup milk');
      expect(result?.ingredients).toContain('2 eggs');
    });

    it('returns null when no recipe name found', () => {
      const html = `
        <html>
          <body>
            <div>No heading here</div>
          </body>
        </html>
      `;

      const result = parseHtmlFallback(html, 'https://example.com');
      expect(result).toBeNull();
    });

    it('returns null when only name found but no content', () => {
      const html = `
        <html>
          <body>
            <h1>Recipe Title</h1>
            <p>Just some text, no ingredients or instructions</p>
          </body>
        </html>
      `;

      const result = parseHtmlFallback(html, 'https://example.com');
      expect(result).toBeNull();
    });

    it('handles data-src for lazy-loaded images', () => {
      const html = `
        <html>
          <body>
            <h1>Lazy Image Recipe</h1>
            <ul class="ingredients"><li>Ingredient 1</li></ul>
            <div class="recipe-image">
              <img data-src="https://example.com/lazy.jpg" src="/placeholder.jpg" />
            </div>
          </body>
        </html>
      `;

      const result = parseHtmlFallback(html, 'https://example.com');
      expect(result?.imageUrl).toBe('https://example.com/lazy.jpg');
    });

    it('cleans up whitespace in extracted text', () => {
      const html = `
        <html>
          <body>
            <h1>  Spaced   Title  </h1>
            <ul class="ingredients">
              <li>
                Ingredient with
                newlines
              </li>
            </ul>
          </body>
        </html>
      `;

      const result = parseHtmlFallback(html, 'https://example.com');

      expect(result?.name).toBe('Spaced Title');
      expect(result?.ingredients[0]).toBe('Ingredient with newlines');
    });

    it('extracts prep and cook time', () => {
      const html = `
        <html>
          <body>
            <h1>Timed Recipe</h1>
            <ul class="ingredients"><li>Stuff</li></ul>
            <span class="prep-time">15 minutes</span>
            <span class="cook-time">30 minutes</span>
            <span class="servings">4 servings</span>
          </body>
        </html>
      `;

      const result = parseHtmlFallback(html, 'https://example.com');

      expect(result?.prepTime).toBe('15 minutes');
      expect(result?.cookTime).toBe('30 minutes');
      expect(result?.servings).toBe('4 servings');
    });

    it('numbers instructions in output', () => {
      const html = `
        <html>
          <body>
            <h1>Numbered Recipe</h1>
            <ul class="ingredients"><li>Item</li></ul>
            <ol class="instructions">
              <li>Step one</li>
              <li>Step two</li>
            </ol>
          </body>
        </html>
      `;

      const result = parseHtmlFallback(html, 'https://example.com');

      expect(result?.instructions).toBe('1. Step one\n2. Step two');
    });

    it('falls back to instructions container text when no list items found', () => {
      const html = `
        <html>
          <body>
            <h1>Text Instructions</h1>
            <ul class="ingredients"><li>Item</li></ul>
            <div class="recipe-instructions">Mix everything together and bake at 350.</div>
          </body>
        </html>
      `;

      const result = parseHtmlFallback(html, 'https://example.com');

      expect(result?.instructions).toBe('1. Mix everything together and bake at 350.');
    });

    it('handles empty text in matched selectors', () => {
      const html = `
        <html>
          <body>
            <span class="prep-time"></span>
            <h1 class="recipe-name"></h1>
            <span class="cook-time"></span>
            <span class="servings"></span>
            <article>
              <h1>Real Title</h1>
              <ul class="ingredients">
                <li></li>
                <li>Actual item</li>
              </ul>
              <div class="recipe-image">
                <img src="/relative-image.jpg" />
              </div>
              <ul class="instructions">
                <li>Do the thing</li>
              </ul>
            </article>
          </body>
        </html>
      `;

      const result = parseHtmlFallback(html, 'https://example.com');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Real Title');
      expect(result?.ingredients).toEqual(['Actual item']);
      expect(result?.imageUrl).toBeUndefined();
    });
  });
});
