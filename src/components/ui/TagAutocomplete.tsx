"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagAutocompleteProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  suggestions: string[];
  onCreateTag?: (tag: string) => Promise<{ id: string | number; name: string } | null>;
}

export function TagAutocomplete({
  value = [],
  onChange,
  placeholder = "Add tags...",
  className,
  disabled = false,
  suggestions = [],
  onCreateTag,
}: TagAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (!inputValue) {
      setFilteredSuggestions(suggestions);
      return;
    }
    
    const filtered = suggestions.filter(
      (suggestion) =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(suggestion)
    );
    setFilteredSuggestions(filtered);
  }, [inputValue, suggestions, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [isCreating, setIsCreating] = useState(false);

  const handleAddTag = useCallback(async (tag: string) => {
    if (!tag.trim() || value.includes(tag.trim())) return;
    
    // Check if we need to create a new tag
    if (onCreateTag && !suggestions.includes(tag)) {
      setIsCreating(true);
      try {
        const newTag = await onCreateTag(tag);
        if (newTag) {
          const newTags = [...value, newTag.name];
          onChange(newTags);
          setInputValue("");
          setIsOpen(false);
        }
      } catch (error) {
        console.error('Failed to create tag:', error);
      } finally {
        setIsCreating(false);
      }
    } else {
      // Tag already exists or no creation needed. Avoid duplicates.
      if (!value.includes(tag)) {
        const newTags = [...value, tag];
        onChange(newTags);
      }
      setInputValue("");
      setIsOpen(false);
    }
  }, [onCreateTag, suggestions, value, onChange]);

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      handleAddTag(inputValue.trim());
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last tag on backspace when input is empty
      handleRemoveTag(value[value.length - 1]);
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={wrapperRef}>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <div
            key={tag}
            data-testid={`tag-${tag}`}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-primary text-primary-foreground"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="rounded-full hover:bg-primary/80 p-0.5"
              disabled={disabled}
              aria-label={`Remove ${tag} tag`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            data-testid="tag-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50 pr-10",
              className
            )}
            disabled={disabled || isCreating}
            aria-busy={isCreating}
          />
          <div className="absolute right-2 flex items-center">
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-muted-foreground hover:text-foreground"
                disabled={disabled}
                aria-label={isOpen ? "Close suggestions" : "Show suggestions"}
              >
                <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
              </button>
            )}
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
            {filteredSuggestions.length > 0 ? (
              <ul className="max-h-60 overflow-auto py-1 text-sm">
                {filteredSuggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => handleAddTag(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                      disabled={isCreating}
                    >
                      <span>{suggestion}</span>
                      {value.includes(suggestion) && <Check className="h-4 w-4 flex-shrink-0" />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : inputValue ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {onCreateTag ? (
                  <button
                    type="button"
                    onClick={() => handleAddTag(inputValue)}
                    className="text-primary hover:underline flex items-center justify-center gap-2 w-full"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <span>Create</span>
                        <span className="font-medium">&quot;{inputValue}&quot;</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>No matching tags found</span>
                    {isCreating && <Loader2 className="h-3 w-3 animate-spin" />}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Start typing to see suggestions
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
