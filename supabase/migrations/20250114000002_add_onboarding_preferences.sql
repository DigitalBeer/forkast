-- Add new columns to public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dietary_preferences text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS disliked_ingredients text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS meal_type_preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_profiles_dietary_preferences ON public.profiles USING GIN(dietary_preferences);
CREATE INDEX IF NOT EXISTS idx_profiles_disliked_ingredients ON public.profiles USING GIN(disliked_ingredients);