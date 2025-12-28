# Edge Function Deployment

The `get-meal-suggestions` Edge Function has been updated to filter by `meal_type`.

## Deploy via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions**
3. Find `get-meal-suggestions` function
4. Click **Deploy new version**
5. Copy the contents of `supabase/functions/get-meal-suggestions/index.ts`
6. Paste and deploy

## Or Deploy via CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy get-meal-suggestions
```

## Changes Made

- Added `meal_type` to database query
- Added case-insensitive filtering by meal type
- Now correctly filters meals when you select Breakfast, Lunch, Dinner, or Snack

## Testing

After deployment:
1. Go to Plan page
2. Click "Breakfast" filter
3. Verify only breakfast meals appear in suggestions panel
4. Repeat for Lunch, Dinner, Snack
