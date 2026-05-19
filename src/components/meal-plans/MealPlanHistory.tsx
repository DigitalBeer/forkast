'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { ShareModal } from '@/components/plan/ShareModal';

interface MealPlanHistoryItem {
  id: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  summary: {
    mealCount: number;
    sampleMeals: string[];
  };
}

interface MealPlanHistoryResponse {
  data: MealPlanHistoryItem[];
  count: number;
  hasMore: boolean;
}

export function MealPlanHistory() {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MealPlanHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTargetId, setShareTargetId] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery<MealPlanHistoryResponse>({
    queryKey: ['meal-plan-history', offset, limit],
    queryFn: async () => {
      const response = await fetch(`/api/meal-plans/history?limit=${limit}&offset=${offset}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view meal plan history');
        }
        throw new Error('Failed to load meal plan history');
      }
      return (await response.json()) as MealPlanHistoryResponse;
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load meal plan history'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const plans = data?.data || [];
  const count = data?.count || 0;
  const hasMore = data?.hasMore || false;

  async function handleDelete() {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/meal-plans/${deleteTarget.id}`, { method: 'DELETE' });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to delete this meal plan');
        }
        if (response.status === 404) {
          throw new Error('Meal plan not found');
        }
        throw new Error('Failed to delete meal plan');
      }

      toast.success('Meal plan deleted');
      queryClient.invalidateQueries({ queryKey: ['meal-plan-history'] });
      queryClient.invalidateQueries({ queryKey: ['latest-meal-plan'] });
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete meal plan');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  }

  const handleShare = (planId: string) => {
    setShareTargetId(planId);
    setShareModalOpen(true);
  };

  return (
    <>
      <div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-hand text-3xl text-cookbook-terracotta">Meal Plan History</h1>
              <p className="text-muted-foreground font-serif mt-1">{count} saved plan{count === 1 ? '' : 's'}</p>
            </div>
            <Link
              href="/plan"
              className="px-4 py-2 font-serif text-sm rounded-md border border-border hover:bg-muted transition-colors"
            >
              Back to Plan
            </Link>
          </div>

          <div data-testid="meal-plan-history-list" className="space-y-4">
            {plans.map((plan) => {
              const weekRange = `${format(parseISO(plan.startDate), 'MMM d')} - ${format(parseISO(plan.endDate), 'MMM d, yyyy')}`;
              const createdAt = plan.createdAt ? format(parseISO(plan.createdAt), 'MMM d, yyyy') : '';
              const sampleMeals = plan.summary.sampleMeals.join(', ');

              return (
                <div
                  key={plan.id}
                  className="bg-cookbook-cream/40 rounded-lg shadow-sm border border-border p-6 hover:border-cookbook-terracotta/30 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <Link
                      href={`/meal-plans/${plan.id}`}
                      className="min-w-0 flex-1"
                      data-testid="meal-plan-history-item"
                    >
                      <h2 className="font-serif text-lg font-semibold text-foreground">{weekRange}</h2>
                      <p className="text-sm text-muted-foreground font-serif mt-1">Saved {createdAt}</p>
                    </Link>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleShare(plan.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-cookbook-terracotta text-white font-serif text-sm rounded-md hover:bg-cookbook-terracotta/90 transition-colors"
                      >
                        <Share2 className="w-3 h-3" />
                        Share
                      </button>
                      <div className="text-sm text-foreground font-serif whitespace-nowrap">
                        {plan.summary.mealCount} meal{plan.summary.mealCount === 1 ? '' : 's'}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(plan);
                          setDeleteModalOpen(true);
                        }}
                        className="px-3 py-1.5 font-serif text-sm text-red-700 rounded-md border border-red-200 hover:bg-red-50 transition-colors"
                        data-testid="delete-meal-plan"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {sampleMeals && (
                    <p className="text-sm text-muted-foreground font-serif mt-3">
                      <span className="font-serif font-medium text-foreground">Preview:</span> {sampleMeals}
                    </p>
                  )}
                </div>
              );
            })}

            {plans.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-serif">No saved meal plans yet.</p>
                <Link
                  href="/plan"
                  className="inline-flex items-center mt-4 px-6 py-3 bg-cookbook-terracotta text-white font-serif rounded-md hover:bg-cookbook-terracotta/90 transition-colors"
                >
                  Create a Meal Plan
                </Link>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-8">
            <button
              type="button"
              onClick={() => setOffset((prev) => Math.max(prev - limit, 0))}
              disabled={offset === 0 || isFetching}
              className="px-4 py-2 font-serif text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="meal-plan-history-prev"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setOffset((prev) => prev + limit)}
              disabled={!hasMore || isFetching}
              className="px-4 py-2 font-serif text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="meal-plan-history-next"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (isDeleting) return;
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="Delete meal plan"
        description="This will permanently delete this saved meal plan. This cannot be undone."
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
      />
      {shareTargetId && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setShareTargetId(null);
          }}
          mealPlanId={shareTargetId}
        />
      )}
    </>
  );
}