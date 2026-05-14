'use client';

import { useState, useRef, useEffect } from 'react';
import { COMMON_INGREDIENTS } from '@/lib/data/common-ingredients';

const QUICK_ALLERGENS = ['peanuts', 'tree nuts', 'shellfish', 'fish', 'soy', 'eggs', 'sesame'];

interface DislikedIngredientsStepProps {
  selected: string[];
  onChange: (items: string[]) => void;
}

export default function DislikedIngredientsStep({ selected, onChange }: DislikedIngredientsStepProps) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = input.trim()
    ? COMMON_INGREDIENTS.filter(
        (i) => i.includes(input.toLowerCase()) && !selected.includes(i)
      ).slice(0, 6)
    : [];

  const add = (item: string) => {
    const clean = item.trim().toLowerCase();
    if (clean && !selected.includes(clean)) {
      onChange([...selected, clean]);
    }
    setInput('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const remove = (item: string) => onChange(selected.filter((s) => s !== item));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      add(input.trim());
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Disliked Ingredients</h2>
      <p className="text-sm text-gray-500 mb-4">We will avoid these in your meal suggestions.</p>

      {/* Quick allergen buttons */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Common allergens — click to add:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ALLERGENS.filter((a) => !selected.includes(a)).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => add(a)}
              className="px-3 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-full hover:bg-red-100 transition-colors"
            >
              + {a}
            </button>
          ))}
        </div>
      </div>

      {/* Input with autocomplete */}
      <div ref={containerRef} className="relative mb-4">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type an ingredient and press Enter..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {showDropdown && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(s);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(item)}
                className="ml-1 hover:text-green-600 focus:outline-none"
                aria-label={`Remove ${item}`}
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      {selected.length === 0 && (
        <p className="text-sm text-gray-400 italic">No ingredients added yet.</p>
      )}
    </div>
  );
}
