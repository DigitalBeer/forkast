/**
 * Schema.org JSON-LD Recipe Parser
 * Extracts recipe data from structured data embedded in HTML pages
 */

import * as cheerio from 'cheerio';
import type {
  ScrapedRecipe,
  SchemaOrgRecipe,
  SchemaOrgHowToStep,
  SchemaOrgHowToSection,
} from '@/lib/scraping/types';

/**
 * Attempts to parse schema.org Recipe data from HTML content
 * @param html - Raw HTML content of the page
 * @param sourceUrl - Original URL of the recipe
 * @returns ScrapedRecipe if found, null otherwise
 */
export function parseSchemaOrgRecipe(html: string, sourceUrl: string): ScrapedRecipe | null {
  const $ = cheerio.load(html);
  
  // Find all JSON-LD script tags
  const jsonLdScripts = $('script[type="application/ld+json"]');
  
  for (let i = 0; i < jsonLdScripts.length; i++) {
    const scriptContent = $(jsonLdScripts[i]).html();
    if (!scriptContent) continue;
    
    try {
      const data = JSON.parse(scriptContent);
      const recipe = findRecipeInJsonLd(data);
      
      if (recipe) {
        return extractRecipeData(recipe, sourceUrl);
      }
    } catch {
      // Continue to next script if JSON parsing fails
      continue;
    }
  }
  
  return null;
}

/**
 * Recursively searches for Recipe type in JSON-LD data
 * Handles @graph arrays and nested structures
 */
function findRecipeInJsonLd(data: unknown): SchemaOrgRecipe | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  
  // Check if this object is a Recipe
  if (isRecipe(data)) {
    return data as SchemaOrgRecipe;
  }
  
  // Check @graph array (common pattern)
  if (Array.isArray((data as { '@graph'?: unknown[] })['@graph'])) {
    for (const item of (data as { '@graph': unknown[] })['@graph']) {
      if (isRecipe(item)) {
        return item as SchemaOrgRecipe;
      }
    }
  }
  
  // Check if data is an array
  if (Array.isArray(data)) {
    for (const item of data) {
      const recipe = findRecipeInJsonLd(item);
      if (recipe) return recipe;
    }
  }
  
  return null;
}

/**
 * Type guard to check if an object is a Recipe
 */
function isRecipe(obj: unknown): obj is SchemaOrgRecipe {
  if (!obj || typeof obj !== 'object') return false;
  const type = (obj as { '@type'?: string | string[] })['@type'];
  
  if (Array.isArray(type)) {
    return type.some(t => typeof t === 'string' && t.toLowerCase() === 'recipe');
  }
  
  return typeof type === 'string' && type.toLowerCase() === 'recipe';
}

/**
 * Extracts normalized recipe data from schema.org Recipe object
 */
function extractRecipeData(recipe: SchemaOrgRecipe, sourceUrl: string): ScrapedRecipe {
  return {
    name: recipe.name || 'Untitled Recipe',
    ingredients: extractIngredients(recipe.recipeIngredient),
    instructions: extractInstructions(recipe.recipeInstructions),
    imageUrl: extractImageUrl(recipe.image),
    sourceUrl,
    prepTime: formatDuration(recipe.prepTime),
    cookTime: formatDuration(recipe.cookTime),
    servings: extractServings(recipe.recipeYield),
  };
}

/**
 * Normalizes ingredient list
 */
function extractIngredients(ingredients: string[] | undefined): string[] {
  if (!ingredients || !Array.isArray(ingredients)) {
    return [];
  }
  
  return ingredients
    .map(ing => typeof ing === 'string' ? ing.trim() : '')
    .filter(ing => ing.length > 0);
}

/**
 * Extracts instructions from various schema.org formats
 */
function extractInstructions(
  instructions: string | SchemaOrgHowToStep[] | SchemaOrgHowToSection[] | undefined
): string {
  if (!instructions) {
    return '';
  }
  
  // Simple string
  if (typeof instructions === 'string') {
    return instructions.trim();
  }
  
  // Array of HowToStep or HowToSection
  if (Array.isArray(instructions)) {
    const steps: string[] = [];
    
    for (const item of instructions) {
      if (typeof item === 'string') {
        steps.push(item);
      } else if (isHowToStep(item)) {
        const text = item.text || item.name;
        if (text) steps.push(text);
      } else if (isHowToSection(item)) {
        // Handle sections with nested steps
        if (item.name) steps.push(`**${item.name}**`);
        if (item.itemListElement) {
          for (const step of item.itemListElement) {
            const text = step.text || step.name;
            if (text) steps.push(text);
          }
        }
      }
    }
    
    return steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
  }
  
  return '';
}

function isHowToStep(obj: unknown): obj is SchemaOrgHowToStep {
  return typeof obj === 'object' && obj !== null && 
    (obj as SchemaOrgHowToStep)['@type'] === 'HowToStep';
}

function isHowToSection(obj: unknown): obj is SchemaOrgHowToSection {
  return typeof obj === 'object' && obj !== null && 
    (obj as SchemaOrgHowToSection)['@type'] === 'HowToSection';
}

/**
 * Extracts image URL from various formats
 */
function extractImageUrl(
  image: string | { url?: string } | string[] | undefined
): string | undefined {
  if (!image) return undefined;
  
  if (typeof image === 'string') {
    return image;
  }
  
  if (Array.isArray(image) && image.length > 0) {
    return typeof image[0] === 'string' ? image[0] : undefined;
  }
  
  if (typeof image === 'object' && 'url' in image) {
    return image.url;
  }
  
  return undefined;
}

/**
 * Converts ISO 8601 duration to human-readable format
 * e.g., "PT30M" -> "30 min", "PT1H30M" -> "1 hr 30 min"
 */
function formatDuration(duration: string | undefined): string | undefined {
  if (!duration) return undefined;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  
  const [, hours, minutes, seconds] = match;
  const parts: string[] = [];
  
  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);
  if (seconds && !hours && !minutes) parts.push(`${seconds} sec`);
  
  return parts.length > 0 ? parts.join(' ') : undefined;
}

/**
 * Extracts servings as a string
 */
function extractServings(recipeYield: string | string[] | undefined): string | undefined {
  if (!recipeYield) return undefined;
  
  if (typeof recipeYield === 'string') {
    return recipeYield;
  }
  
  if (Array.isArray(recipeYield) && recipeYield.length > 0) {
    return recipeYield[0];
  }
  
  return undefined;
}
