'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Link as LinkIcon, Check, AlertCircle } from 'lucide-react';
import type { ScrapedRecipe } from '@/lib/scraping/types';

interface RecipeImportModalProps {
    open: boolean;
    onClose: () => void;
    onImport: (recipe: ScrapedRecipe) => void;
}

export function RecipeImportModal({ open, onClose, onImport }: RecipeImportModalProps) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<ScrapedRecipe | null>(null);

    const handleScrape = async () => {
        if (!url.trim()) {
            setError('Please enter a URL');
            return;
        }

        setLoading(true);
        setError(null);
        setPreview(null);

        try {
            const response = await fetch('/api/recipes/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to import recipe');
                return;
            }

            if (data.success && data.recipe) {
                setPreview(data.recipe);
            } else {
                setError('Could not extract recipe from this page');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import recipe');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = () => {
        if (preview) {
            onImport(preview);
            handleClose();
        }
    };

    const handleClose = () => {
        setUrl('');
        setError(null);
        setPreview(null);
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LinkIcon className="w-5 h-5" />
                        Import Recipe from URL
                    </DialogTitle>
                    <DialogDescription>
                        Paste a recipe URL from popular cooking sites to automatically import the recipe details.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {/* URL Input */}
                    {!preview && (
                        <>
                            <div className="space-y-2">
                                <label htmlFor="recipe-url" className="text-sm font-medium">
                                    Recipe URL
                                </label>
                                <Input
                                    id="recipe-url"
                                    type="url"
                                    placeholder="https://www.allrecipes.com/recipe/..."
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value);
                                        setError(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !loading) {
                                            handleScrape();
                                        }
                                    }}
                                    disabled={loading}
                                    aria-describedby={error ? 'url-error' : undefined}
                                />
                                {error && (
                                    <p id="url-error" className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </p>
                                )}
                            </div>

                            <div className="text-xs text-muted-foreground">
                                <p className="font-medium mb-1">Supported sites include:</p>
                                <p>AllRecipes, Food Network, BBC Good Food, Serious Eats, and many more sites with structured recipe data.</p>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={handleClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button onClick={handleScrape} disabled={loading || !url.trim()}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        'Import Recipe'
                                    )}
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Recipe Preview */}
                    {preview && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-green-800">Recipe imported successfully!</span>
                            </div>

                            <div className="border rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-lg">{preview.name}</h3>

                                {(preview.prepTime || preview.cookTime || preview.servings) && (
                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                        {preview.prepTime && (
                                            <span>Prep: {preview.prepTime}</span>
                                        )}
                                        {preview.cookTime && (
                                            <span>Cook: {preview.cookTime}</span>
                                        )}
                                        {preview.servings && (
                                            <span>Servings: {preview.servings}</span>
                                        )}
                                    </div>
                                )}

                                {preview.ingredients.length > 0 && (
                                    <div>
                                        <p className="font-medium text-sm mb-1">Ingredients ({preview.ingredients.length}):</p>
                                        <ul className="text-sm text-muted-foreground list-disc pl-5 max-h-48 overflow-y-auto border rounded-md p-2 bg-slate-50">
                                            {preview.ingredients.map((ing, i) => (
                                                <li key={i}>{ing}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {preview.instructions && (
                                    <div>
                                        <p className="font-medium text-sm mb-1">Instructions:</p>
                                        <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto border rounded-md p-2 bg-slate-50 whitespace-pre-wrap">
                                            {preview.instructions}
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-muted-foreground truncate">
                                    Source: {preview.sourceUrl}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setPreview(null)}>
                                    Try Different URL
                                </Button>
                                <Button onClick={handleImport}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Use This Recipe
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
