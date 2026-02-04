/**
 * Recipe scraping types and interfaces
 */

export interface ScrapedRecipe {
  name: string;
  ingredients: string[];
  instructions: string;
  imageUrl?: string;
  sourceUrl: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
}

export interface ScrapingResult {
  success: boolean;
  recipe?: ScrapedRecipe;
  error?: ScrapingError;
}

export enum ScrapingErrorCode {
  UNSUPPORTED_SITE = 'UNSUPPORTED_SITE',
  PARSING_FAILED = 'PARSING_FAILED',
  INVALID_URL = 'INVALID_URL',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PREMIUM_REQUIRED = 'PREMIUM_REQUIRED',
}

export interface ScrapingError {
  code: ScrapingErrorCode;
  message: string;
}

export const ScrapingErrorMessages: Record<ScrapingErrorCode, string> = {
  [ScrapingErrorCode.UNSUPPORTED_SITE]: 'This site is not supported for recipe import',
  [ScrapingErrorCode.PARSING_FAILED]: 'Could not extract recipe data from this page',
  [ScrapingErrorCode.INVALID_URL]: 'Please enter a valid URL',
  [ScrapingErrorCode.RATE_LIMIT]: 'Too many requests. Please try again later',
  [ScrapingErrorCode.NETWORK_ERROR]: 'Failed to fetch the recipe page',
  [ScrapingErrorCode.PREMIUM_REQUIRED]: 'Recipe import is a premium feature',
};

/**
 * Schema.org Recipe type according to https://schema.org/Recipe
 */
export interface SchemaOrgRecipe {
  '@type': 'Recipe' | string;
  name?: string;
  recipeIngredient?: string[];
  recipeInstructions?: string | SchemaOrgHowToStep[] | SchemaOrgHowToSection[];
  image?: string | { url?: string } | string[];
  prepTime?: string;
  cookTime?: string;
  recipeYield?: string | string[];
}

export interface SchemaOrgHowToStep {
  '@type': 'HowToStep';
  text?: string;
  name?: string;
}

export interface SchemaOrgHowToSection {
  '@type': 'HowToSection';
  name?: string;
  itemListElement?: SchemaOrgHowToStep[];
}
