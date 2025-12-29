-- Migration: Convert plain text ingredients to structured JSON format (Fixed)
-- This script converts all non-array ingredients to structured arrays

BEGIN;

-- First, let's see what we're working with
DO $$
DECLARE
    meal_record RECORD;
    ingredients_text TEXT;
    ingredients_array JSONB := '[]'::JSONB;
    ingredient_items TEXT[];
    item TEXT;
    ingredient_obj JSONB;
BEGIN
    -- Loop through all meals
    FOR meal_record IN 
        SELECT id, name, ingredients 
        FROM meals
        WHERE ingredients IS NOT NULL
    LOOP
        -- Reset for each meal
        ingredients_array := '[]'::JSONB;
        
        -- Try to handle the ingredients field
        BEGIN
            -- Check if it's already a valid JSON array
            IF jsonb_typeof(meal_record.ingredients) = 'array' THEN
                -- Already structured, skip
                CONTINUE;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Not JSONB at all, continue with conversion
        END;
        
        -- Convert to text for processing
        ingredients_text := meal_record.ingredients::TEXT;
        
        -- Skip if empty
        IF ingredients_text IS NULL OR trim(ingredients_text) = '' THEN
            -- Set to empty array
            UPDATE meals SET ingredients = '[]'::JSONB WHERE id = meal_record.id;
            CONTINUE;
        END IF;
        
        -- Try to parse as existing JSON array
        BEGIN
            ingredients_array := ingredients_text::JSONB;
            IF jsonb_typeof(ingredients_array) = 'array' THEN
                -- Already valid, just ensure it's JSONB
                UPDATE meals SET ingredients = ingredients_array WHERE id = meal_record.id;
                CONTINUE;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Not valid JSON, proceed with text parsing
        END;
        
        -- Parse plain text (comma-separated)
        ingredient_items := string_to_array(ingredients_text, ',');
        
        FOREACH item IN ARRAY ingredient_items
        LOOP
            item := trim(item);
            IF item != '' THEN
                ingredient_obj := jsonb_build_object(
                    'name', item,
                    'quantity', 1,
                    'unit', ''
                );
                ingredients_array := ingredients_array || ingredient_obj;
            END IF;
        END LOOP;
        
        -- Update the meal with structured ingredients
        UPDATE meals 
        SET ingredients = ingredients_array 
        WHERE id = meal_record.id;
        
        RAISE NOTICE 'Converted meal: % (% ingredients)', meal_record.name, jsonb_array_length(ingredients_array);
    END LOOP;
END $$;

-- Verify the migration
SELECT 
    id,
    name,
    CASE 
        WHEN ingredients IS NULL THEN 'NULL'
        WHEN jsonb_typeof(ingredients) = 'array' THEN 'ARRAY'
        ELSE 'OTHER (' || jsonb_typeof(ingredients)::TEXT || ')'
    END as ingredient_type,
    CASE 
        WHEN jsonb_typeof(ingredients) = 'array' THEN jsonb_array_length(ingredients)
        ELSE NULL
    END as ingredient_count
FROM meals
ORDER BY ingredient_type DESC, name;

COMMIT;
