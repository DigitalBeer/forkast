'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Copy, Check, Share2, Trash2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealPlanId: string;
}

interface Share {
  id: number;
  shareToken: string;
  shareUrl: string;
  includeDetails: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export function ShareModal({ isOpen, onClose, mealPlanId }: ShareModalProps) {
  const [includeDetails, setIncludeDetails] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch existing shares
  const { data: sharesData, isLoading } = useQuery<{ shares: Share[] }>({
    queryKey: ['meal-plan-shares', mealPlanId],
    queryFn: async () => {
      const response = await fetch(`/api/meal-plans/${mealPlanId}/shares`);
      if (!response.ok) throw new Error('Failed to fetch shares');
      return response.json();
    },
    enabled: isOpen && !!mealPlanId,
  });

  // Create new share
  const createShareMutation = useMutation({
    mutationFn: async (options: { includeDetails: boolean }) => {
      const response = await fetch(`/api/meal-plans/${mealPlanId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!response.ok) throw new Error('Failed to create share');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan-shares', mealPlanId] });
    },
  });

  // Delete share
  const deleteShareMutation = useMutation({
    mutationFn: async (shareId: number) => {
      const response = await fetch(`/api/meal-plans/${mealPlanId}/shares/${shareId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete share');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan-shares', mealPlanId] });
    },
  });

  const handleCreateShare = () => {
    createShareMutation.mutate({ includeDetails });
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDeleteShare = (shareId: number) => {
    if (confirm('Are you sure you want to revoke this share link?')) {
      deleteShareMutation.mutate(shareId);
    }
  };

  if (!isOpen) return null;

  const shares = sharesData?.shares || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Share Meal Plan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Create New Share */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Create New Share Link</h3>
            
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include meal details (ingredients & instructions)</span>
              </label>
            </div>

            <button
              onClick={handleCreateShare}
              disabled={createShareMutation.isPending}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createShareMutation.isPending ? 'Creating...' : 'Generate Share Link'}
            </button>
          </div>

          {/* Existing Shares */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : shares.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Active Share Links</h3>
              <div className="space-y-3">
                {shares.map((share) => (
                  <div key={share.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">
                          Created {new Date(share.createdAt).toLocaleDateString()}
                          {share.includeDetails && ' • Includes details'}
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={share.shareUrl}
                            readOnly
                            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 font-mono"
                          />
                          <button
                            onClick={() => handleCopyUrl(share.shareUrl)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                          >
                            {copiedUrl === share.shareUrl ? (
                              <>
                                <Check className="w-3 h-3 text-green-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteShare(share.id)}
                        disabled={deleteShareMutation.isPending}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600"
                        title="Revoke share"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No active share links. Create one above to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
