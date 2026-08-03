-- Add meal_type column to meals table
-- IF NOT EXISTS: the base create-meals-table migration already declares a
-- (constraint-less) `meal_type` column, so replaying migrations in order
-- against a fresh database would otherwise fail here with "column
-- meal_type already exists". Production applied this migration before that
-- happened to be true, so it is unaffected either way.
ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS meal_type TEXT CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack'));

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON public.meals(meal_type);

-- Add comment
COMMENT ON COLUMN public.meals.meal_type IS 'Type of meal: Breakfast, Lunch, Dinner, or Snack';
