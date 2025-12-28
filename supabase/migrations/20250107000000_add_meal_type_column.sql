-- Add meal_type column to meals table
ALTER TABLE public.meals 
ADD COLUMN meal_type TEXT CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack'));

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON public.meals(meal_type);

-- Add comment
COMMENT ON COLUMN public.meals.meal_type IS 'Type of meal: Breakfast, Lunch, Dinner, or Snack';
