/**
 * HTML Fallback Parser
 * Extracts recipe data using common CSS selectors when JSON-LD is not available
 */

import * as cheerio from 'cheerio';
import type { ScrapedRecipe } from '@/lib/scraping/types';

// Common CSS selectors for recipe content
const SELECTORS = {
  name: [
    'h1.recipe-title',
    'h1.recipe-name',
    'h1[class*="recipe-title"]',
    'h1[class*="recipe-name"]',
    '.recipe-header h1',
    '[class*="recipe"] h1',
    'article h1',
    'h1',
  ],
  ingredients: [
    '.recipe-ingredients li',
    '.ingredients li',
    '[class*="ingredient"] li',
    '.ingredient-list li',
    'ul[class*="ingredient"] li',
    '[itemprop="recipeIngredient"]',
  ],
  instructions: [
    '.recipe-instructions li',
    '.recipe-directions li',
    '.instructions li',
    '.directions li',
    '[class*="instruction"] li',
    '[class*="direction"] li',
    '[itemprop="recipeInstructions"]',
    '.recipe-steps li',
    '.steps li',
  ],
  instructionsContainer: [
    '.recipe-instructions',
    '.recipe-directions',
    '.instructions',
    '.directions',
    '[class*="instruction"]',
    '[itemprop="recipeInstructions"]',
  ],
  image: [
    '.recipe-image img',
    '.recipe-photo img',
    '[class*="recipe"] img',
    'article img',
    '.hero-image img',
    'picture img',
  ],
  prepTime: [
    '[class*="prep-time"]',
    '[itemprop="prepTime"]',
    '[class*="prepTime"]',
  ],
  cookTime: [
    '[class*="cook-time"]',
    '[itemprop="cookTime"]',
    '[class*="cookTime"]',
  ],
  servings: [
    '[class*="yield"]',
    '[class*="servings"]',
    '[itemprop="recipeYield"]',
  ],
};

/**
 * Attempts to parse recipe data from HTML using common selectors
 * @param html - Raw HTML content of the page
 * @param sourceUrl - Original URL of the recipe
 * @returns ScrapedRecipe if extractable, null otherwise
 */
export function parseHtmlFallback(html: string, sourceUrl: string): ScrapedRecipe | null {
  const $ = cheerio.load(html);
  
  // Try to extract recipe name
  const name = extractFirstMatch($, SELECTORS.name);
  if (!name) {
    return null; // Can't identify a recipe without a name
  }
  
  // Extract ingredients
  const ingredients = extractListItems($, SELECTORS.ingredients);
  
  // Extract instructions
  let instructions = extractListItems($, SELECTORS.instructions);
  
  // If no list items found, try to get instructions as paragraphs
  if (instructions.length === 0) {
    const instructionsText = extractFirstMatch($, SELECTORS.instructionsContainer);
    if (instructionsText) {
      instructions = [instructionsText];
    }
  }
  
  // If we couldn't find ingredients or instructions, this might not be a recipe page
  if (ingredients.length === 0 && instructions.length === 0) {
    return null;
  }
  
  // Extract image
  const imageUrl = extractImageSrc($, SELECTORS.image);
  
  // Extract timing and servings
  const prepTime = extractFirstMatch($, SELECTORS.prepTime);
  const cookTime = extractFirstMatch($, SELECTORS.cookTime);
  const servings = extractFirstMatch($, SELECTORS.servings);
  
  return {
    name: cleanText(name),
    ingredients: ingredients.map(cleanText),
    instructions: instructions.length > 0 
      ? instructions.map((step, i) => `${i + 1}. ${cleanText(step)}`).join('\n')
      : '',
    imageUrl,
    sourceUrl,
    prepTime: prepTime ? cleanText(prepTime) : undefined,
    cookTime: cookTime ? cleanText(cookTime) : undefined,
    servings: servings ? cleanText(servings) : undefined,
  };
}

/**
 * Extracts text from first matching selector
 */
function extractFirstMatch($: cheerio.CheerioAPI, selectors: string[]): string | null {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const text = element.text().trim();
      if (text) return text;
    }
  }
  return null;
}

/**
 * Extracts all list items from matching selectors
 */
function extractListItems($: cheerio.CheerioAPI, selectors: string[]): string[] {
  const items: string[] = [];
  
  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text && !items.includes(text)) {
        items.push(text);
      }
    });
    
    if (items.length > 0) break; // Use first selector that matches
  }
  
  return items;
}

/**
 * Extracts image src from first matching selector
 */
function extractImageSrc($: cheerio.CheerioAPI, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      // Try data-src first (lazy loading), then src
      const src = element.attr('data-src') || element.attr('src');
      if (src && src.startsWith('http')) {
        return src;
      }
    }
  }
  return undefined;
}

/**
 * Cleans up extracted text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/^\s+|\s+$/g, '')  // Trim
    .replace(/[\n\r\t]/g, ' ');  // Remove newlines/tabs
}
