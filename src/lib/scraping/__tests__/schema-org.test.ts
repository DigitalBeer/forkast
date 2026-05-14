/**
 * Tests for Schema.org JSON-LD Recipe Parser
 */

import { describe, it, expect } from 'vitest';
import { parseSchemaOrgRecipe } from '../parsers/schema-org';

describe('Schema.org JSON-LD Parser', () => {
  describe('parseSchemaOrgRecipe', () => {
    it('parses a valid Recipe JSON-LD', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Chocolate Chip Cookies",
                "recipeIngredient": ["2 cups flour", "1 cup sugar", "1 cup chocolate chips"],
                "recipeInstructions": [
                  {"@type": "HowToStep", "text": "Mix dry ingredients"},
                  {"@type": "HowToStep", "text": "Add wet ingredients"},
                  {"@type": "HowToStep", "text": "Bake at 350°F for 12 minutes"}
                ],
                "image": "https://example.com/cookies.jpg",
                "prepTime": "PT15M",
                "cookTime": "PT12M",
                "recipeYield": "24 cookies"
              }
            </script>
          </head>
          <body></body>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com/recipe');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Chocolate Chip Cookies');
      expect(result?.ingredients).toHaveLength(3);
      expect(result?.ingredients).toContain('2 cups flour');
      expect(result?.instructions).toContain('Mix dry ingredients');
      expect(result?.imageUrl).toBe('https://example.com/cookies.jpg');
      expect(result?.prepTime).toBe('15 min');
      expect(result?.cookTime).toBe('12 min');
      expect(result?.servings).toBe('24 cookies');
      expect(result?.sourceUrl).toBe('https://example.com/recipe');
    });

    it('handles Recipe inside @graph array', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@graph": [
                  {"@type": "WebPage", "name": "Recipe Page"},
                  {
                    "@type": "Recipe",
                    "name": "Simple Pasta",
                    "recipeIngredient": ["pasta", "sauce"]
                  }
                ]
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Simple Pasta');
      expect(result?.ingredients).toEqual(['pasta', 'sauce']);
    });

    it('handles string instructions', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Quick Meal",
                "recipeInstructions": "Mix everything together and serve."
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      
      expect(result?.instructions).toBe('Mix everything together and serve.');
    });

    it('handles HowToSection instructions', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Complex Recipe",
                "recipeInstructions": [
                  {
                    "@type": "HowToSection",
                    "name": "Prep",
                    "itemListElement": [
                      {"@type": "HowToStep", "text": "Chop vegetables"}
                    ]
                  },
                  {
                    "@type": "HowToSection",
                    "name": "Cook",
                    "itemListElement": [
                      {"@type": "HowToStep", "text": "Stir fry"}
                    ]
                  }
                ]
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      
      expect(result?.instructions).toContain('**Prep**');
      expect(result?.instructions).toContain('Chop vegetables');
      expect(result?.instructions).toContain('**Cook**');
    });

    it('returns null when no Recipe JSON-LD found', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {"@type": "WebPage", "name": "Not a recipe"}
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result).toBeNull();
    });

    it('returns null for empty HTML', () => {
      const result = parseSchemaOrgRecipe('', 'https://example.com');
      expect(result).toBeNull();
    });

    it('handles malformed JSON gracefully', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              { this is not valid JSON }
            </script>
            <script type="application/ld+json">
              {"@type": "Recipe", "name": "Valid Recipe"}
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Valid Recipe');
    });

    it('handles array of images', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Photo Recipe",
                "image": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.imageUrl).toBe('https://example.com/img1.jpg');
    });

    it('handles image object with url property', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Object Image Recipe",
                "image": {"url": "https://example.com/photo.jpg"}
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.imageUrl).toBe('https://example.com/photo.jpg');
    });

    it('formats duration with hours and minutes', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Long Cook",
                "prepTime": "PT1H30M",
                "cookTime": "PT2H"
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      
      expect(result?.prepTime).toBe('1 hr 30 min');
      expect(result?.cookTime).toBe('2 hr');
    });

    it('handles Recipe as array type', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": ["Article", "Recipe"],
                "name": "Multi-type Recipe"
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Multi-type Recipe');
    });

    it('handles root-level array of JSON-LD objects', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              [
                {"@type": "WebPage", "name": "Page"},
                {"@type": "Recipe", "name": "Array Recipe"}
              ]
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Array Recipe');
    });

    it('handles null/primitive JSON-LD gracefully', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              null
            </script>
            <script type="application/ld+json">
              "just a string"
            </script>
            <script type="application/ld+json">
              42
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result).toBeNull();
    });

    it('handles instructions as array of strings', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "String Steps",
                "recipeInstructions": ["Mix", "Cook", "Serve"]
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.instructions).toBe('1. Mix\n2. Cook\n3. Serve');
    });

    it('handles unknown image format gracefully', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "No Image",
                "image": 123
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.imageUrl).toBeUndefined();
    });

    it('handles recipeYield as array', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Yield Array",
                "recipeYield": ["4 servings", "8 servings"]
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.servings).toBe('4 servings');
    });

    it('handles duration with seconds only', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Quick Recipe",
                "cookTime": "PT45S"
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.cookTime).toBe('45 sec');
    });

    it('handles instructions with HowToStep using name instead of text', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Named Steps",
                "recipeInstructions": [
                  {"@type": "HowToStep", "name": "Step one"}
                ]
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.instructions).toBe('1. Step one');
    });

    it('handles empty instructions', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "No Instructions"
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.instructions).toBe('');
    });

    it('handles non-string, non-array instructions', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Bad Instructions",
                "recipeInstructions": 42
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.instructions).toBe('');
    });

    it('handles non-string, non-array recipeYield', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Numeric Yield",
                "recipeYield": 4
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.servings).toBeUndefined();
    });

    it('handles missing recipe name fallback', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "recipeIngredient": ["stuff"]
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.name).toBe('Untitled Recipe');
    });

    it('handles empty ingredients array', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Empty Ingredients",
                "recipeIngredient": null
              }
            </script>
          </head>
        </html>
      `;

      const result = parseSchemaOrgRecipe(html, 'https://example.com');
      expect(result?.ingredients).toEqual([]);
    });
  });
});
