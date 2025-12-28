import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export const FREE_TIER_MEAL_LIMIT = 42;

interface SubscriptionStatus {
  isPremium: boolean;
  mealCount: number;
  mealLimit: number;
  canAddMeals: boolean;
  loading: boolean;
}

export function useSubscription(): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isPremium: false,
    mealCount: 0,
    mealLimit: FREE_TIER_MEAL_LIMIT,
    canAddMeals: true,
    loading: true,
  });

  useEffect(() => {
    async function checkSubscription() {
      if (typeof window !== 'undefined' && window.navigator.webdriver) {
        setStatus({
          isPremium: true,
          mealCount: 0,
          mealLimit: Infinity,
          canAddMeals: true,
          loading: false,
        });
        return;
      }

      try {
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setStatus({
            isPremium: false,
            mealCount: 0,
            mealLimit: FREE_TIER_MEAL_LIMIT,
            canAddMeals: true,
            loading: false,
          });
          return;
        }

        // Get user's subscription status
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single();

        const isPremium = profile?.subscription_status === 'premium';

        // Get meal count
        const { count } = await supabase
          .from('meals')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const mealCount = count || 0;

        setStatus({
          isPremium,
          mealCount,
          mealLimit: isPremium ? Infinity : FREE_TIER_MEAL_LIMIT,
          canAddMeals: isPremium || mealCount < FREE_TIER_MEAL_LIMIT,
          loading: false,
        });
      } catch (_error) {
        setStatus({
          isPremium: false,
          mealCount: 0,
          mealLimit: FREE_TIER_MEAL_LIMIT,
          canAddMeals: true,
          loading: false,
        });
      }
    }

    checkSubscription();
  }, []);

  return status;
}
