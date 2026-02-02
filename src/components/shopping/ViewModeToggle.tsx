'use client';

import React from 'react';
import { List, Eye } from 'lucide-react';

type ViewMode = 'by-item' | 'by-meal';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onViewModeChange('by-item')}
        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          viewMode === 'by-item'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label="View items grouped by category"
        title="View by Item"
      >
        <List className="w-4 h-4" />
        By Item
      </button>
      <button
        onClick={() => onViewModeChange('by-meal')}
        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          viewMode === 'by-meal'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label="View items grouped by meal"
        title="View by Meal"
      >
        <Eye className="w-4 h-4" />
        By Meal
      </button>
    </div>
  );
}
