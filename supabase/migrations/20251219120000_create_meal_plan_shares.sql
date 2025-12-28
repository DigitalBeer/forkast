-- Create meal_plan_shares table for sharing meal plans
CREATE TABLE public.meal_plan_shares (
    id bigserial PRIMARY KEY,
    meal_plan_id bigint NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
    share_token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    include_details boolean NOT NULL DEFAULT false,
    expires_at timestamptz,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on share_token for fast lookups
CREATE INDEX idx_meal_plan_shares_token ON public.meal_plan_shares(share_token);

-- Create index on meal_plan_id for user queries
CREATE INDEX idx_meal_plan_shares_meal_plan_id ON public.meal_plan_shares(meal_plan_id);

-- Enable RLS
ALTER TABLE public.meal_plan_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see shares for their own meal plans
CREATE POLICY "Users can view their own meal plan shares" ON public.meal_plan_shares
    FOR SELECT USING (
        created_by = auth.uid()
    );

-- Policy: Users can only create shares for their own meal plans
CREATE POLICY "Users can create shares for their own meal plans" ON public.meal_plan_shares
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.meal_plans 
            WHERE id = meal_plan_shares.meal_plan_id 
            AND user_id = auth.uid()
        )
    );

-- Policy: Users can only delete their own shares
CREATE POLICY "Users can delete their own meal plan shares" ON public.meal_plan_shares
    FOR DELETE USING (
        created_by = auth.uid()
    );

-- Policy: Users can update their own shares
CREATE POLICY "Users can update their own meal plan shares" ON public.meal_plan_shares
    FOR UPDATE USING (
        created_by = auth.uid()
    ) WITH CHECK (
        created_by = auth.uid()
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meal_plan_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row updates
CREATE TRIGGER trigger_meal_plan_shares_updated_at
    BEFORE UPDATE ON public.meal_plan_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_plan_shares_updated_at();
