/**
 * Update existing meals with meal_type based on their names
 * Run with: npm run update:meal-types
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EDGE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Meal type mappings based on meal names
const mealTypeMap: Record<string, string> = {
  // Breakfast
  'Classic Full English Breakfast': 'Breakfast',
  'Avocado Toast with Poached Eggs': 'Breakfast',
  'Greek Yogurt Parfait': 'Breakfast',
  'Scrambled Eggs with Smoked Salmon': 'Breakfast',
  'Banana Pancakes': 'Breakfast',
  
  // Lunch
  'Caesar Salad with Grilled Chicken': 'Lunch',
  'Mediterranean Quinoa Bowl': 'Lunch',
  'Chicken and Bacon Club Sandwich': 'Lunch',
  'Thai Green Curry': 'Lunch',
  'Tuna Niçoise Salad': 'Lunch',
  'Butternut Squash Soup': 'Lunch',
  
  // Dinner
  'Spaghetti Carbonara': 'Dinner',
  'Beef Stir-Fry with Noodles': 'Dinner',
  'Roast Chicken with Vegetables': 'Dinner',
  'Vegetarian Lasagna': 'Dinner',
  'Salmon with Lemon Butter Sauce': 'Dinner',
  'Chicken Tikka Masala': 'Dinner',
  'Beef Tacos': 'Dinner',
  'Mushroom Risotto': 'Dinner',
  'Fish and Chips': 'Dinner',
  'Shepherd\'s Pie': 'Dinner',
  'Prawn Pad Thai': 'Dinner',
  'Margherita Pizza': 'Dinner',
  'Chicken Fajitas': 'Dinner',
  'BBQ Pulled Pork': 'Dinner',
};

async function updateMealTypes() {
  console.log('Fetching meals without meal_type...');

  const { data: meals, error } = await supabase
    .from('meals')
    .select('id, name, meal_type')
    .is('meal_type', null);

  if (error) {
    console.error('Error fetching meals:', error);
    return;
  }

  if (!meals || meals.length === 0) {
    console.log('No meals to update');
    return;
  }

  console.log(`Found ${meals.length} meals to update`);

  let updated = 0;
  let skipped = 0;

  for (const meal of meals) {
    const mealType = mealTypeMap[meal.name];

    if (mealType) {
      const { error: updateError } = await supabase
        .from('meals')
        .update({ meal_type: mealType })
        .eq('id', meal.id);

      if (updateError) {
        console.error(`Error updating meal ${meal.name}:`, updateError);
      } else {
        console.log(`✓ Updated "${meal.name}" → ${mealType}`);
        updated++;
      }
    } else {
      console.log(`⚠ Skipped "${meal.name}" (no mapping found)`);
      skipped++;
    }
  }

  console.log(`\n✅ Update complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
}

updateMealTypes().catch(console.error);
