/**
 * Update meals with structured ingredients in metric units
 * 
 * Run with: npx tsx scripts/update-meal-ingredients.ts <user-email>
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EDGE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Updated meals with structured metric ingredients
const updatedMeals = [
  {
    name: 'Classic Full English Breakfast',
    ingredients: [
      { name: 'eggs', quantity: 2, unit: 'pieces' },
      { name: 'bacon rashers', quantity: 3, unit: 'pieces' },
      { name: 'sausages', quantity: 2, unit: 'pieces' },
      { name: 'baked beans', quantity: 200, unit: 'g' },
      { name: 'bread', quantity: 2, unit: 'slices' },
      { name: 'butter', quantity: 20, unit: 'g' },
      { name: 'mushrooms', quantity: 100, unit: 'g' },
      { name: 'tomatoes', quantity: 2, unit: 'pieces' }
    ]
  },
  {
    name: 'Avocado Toast with Poached Eggs',
    ingredients: [
      { name: 'sourdough bread', quantity: 2, unit: 'slices' },
      { name: 'avocado', quantity: 1, unit: 'whole' },
      { name: 'eggs', quantity: 2, unit: 'pieces' },
      { name: 'lemon juice', quantity: 1, unit: 'tbsp' },
      { name: 'chili flakes', quantity: 1, unit: 'tsp' },
      { name: 'salt', quantity: 1, unit: 'pinch' },
      { name: 'black pepper', quantity: 1, unit: 'pinch' }
    ]
  },
  {
    name: 'Greek Yogurt Parfait',
    ingredients: [
      { name: 'Greek yogurt', quantity: 200, unit: 'g' },
      { name: 'granola', quantity: 50, unit: 'g' },
      { name: 'mixed berries', quantity: 100, unit: 'g' },
      { name: 'honey', quantity: 1, unit: 'tbsp' },
      { name: 'mint leaves', quantity: 5, unit: 'leaves' }
    ]
  },
  {
    name: 'Scrambled Eggs with Smoked Salmon',
    ingredients: [
      { name: 'eggs', quantity: 3, unit: 'pieces' },
      { name: 'smoked salmon', quantity: 100, unit: 'g' },
      { name: 'cream', quantity: 30, unit: 'ml' },
      { name: 'butter', quantity: 10, unit: 'g' },
      { name: 'chives', quantity: 1, unit: 'tbsp' },
      { name: 'black pepper', quantity: 1, unit: 'pinch' }
    ]
  },
  {
    name: 'Banana Pancakes',
    ingredients: [
      { name: 'flour', quantity: 150, unit: 'g' },
      { name: 'eggs', quantity: 2, unit: 'pieces' },
      { name: 'milk', quantity: 200, unit: 'ml' },
      { name: 'bananas', quantity: 2, unit: 'pieces' },
      { name: 'butter', quantity: 20, unit: 'g' },
      { name: 'maple syrup', quantity: 50, unit: 'ml' },
      { name: 'baking powder', quantity: 2, unit: 'tsp' }
    ]
  },
  {
    name: 'Caesar Salad with Grilled Chicken',
    ingredients: [
      { name: 'chicken breasts', quantity: 2, unit: 'pieces' },
      { name: 'romaine lettuce', quantity: 200, unit: 'g' },
      { name: 'parmesan cheese', quantity: 50, unit: 'g' },
      { name: 'Caesar dressing', quantity: 50, unit: 'ml' },
      { name: 'croutons', quantity: 50, unit: 'g' },
      { name: 'lemon', quantity: 1, unit: 'piece' }
    ]
  },
  {
    name: 'Mediterranean Quinoa Bowl',
    ingredients: [
      { name: 'quinoa', quantity: 200, unit: 'g' },
      { name: 'feta cheese', quantity: 100, unit: 'g' },
      { name: 'cherry tomatoes', quantity: 150, unit: 'g' },
      { name: 'cucumber', quantity: 1, unit: 'whole' },
      { name: 'olives', quantity: 50, unit: 'g' },
      { name: 'red onion', quantity: 0.5, unit: 'whole' },
      { name: 'lemon', quantity: 1, unit: 'piece' },
      { name: 'olive oil', quantity: 2, unit: 'tbsp' }
    ]
  },
  {
    name: 'Chicken and Bacon Club Sandwich',
    ingredients: [
      { name: 'bread', quantity: 3, unit: 'slices' },
      { name: 'chicken breast', quantity: 150, unit: 'g' },
      { name: 'bacon rashers', quantity: 4, unit: 'pieces' },
      { name: 'lettuce', quantity: 50, unit: 'g' },
      { name: 'tomato', quantity: 2, unit: 'slices' },
      { name: 'mayonnaise', quantity: 2, unit: 'tbsp' },
      { name: 'cheese', quantity: 20, unit: 'g' }
    ]
  },
  {
    name: 'Thai Green Curry',
    ingredients: [
      { name: 'green curry paste', quantity: 2, unit: 'tbsp' },
      { name: 'coconut milk', quantity: 400, unit: 'ml' },
      { name: 'mixed vegetables', quantity: 300, unit: 'g' },
      { name: 'tofu', quantity: 200, unit: 'g' },
      { name: 'jasmine rice', quantity: 200, unit: 'g' },
      { name: 'Thai basil', quantity: 20, unit: 'g' },
      { name: 'lime', quantity: 1, unit: 'piece' }
    ]
  },
  {
    name: 'Tuna Niçoise Salad',
    ingredients: [
      { name: 'tuna steak', quantity: 200, unit: 'g' },
      { name: 'eggs', quantity: 2, unit: 'pieces' },
      { name: 'green beans', quantity: 150, unit: 'g' },
      { name: 'new potatoes', quantity: 200, unit: 'g' },
      { name: 'tomatoes', quantity: 2, unit: 'pieces' },
      { name: 'olives', quantity: 50, unit: 'g' },
      { name: 'anchovies', quantity: 4, unit: 'fillets' },
      { name: 'vinaigrette', quantity: 50, unit: 'ml' }
    ]
  },
  {
    name: 'Spaghetti Carbonara',
    ingredients: [
      { name: 'spaghetti', quantity: 400, unit: 'g' },
      { name: 'pancetta', quantity: 200, unit: 'g' },
      { name: 'eggs', quantity: 4, unit: 'pieces' },
      { name: 'parmesan cheese', quantity: 100, unit: 'g' },
      { name: 'black pepper', quantity: 2, unit: 'tsp' },
      { name: 'salt', quantity: 1, unit: 'tsp' }
    ]
  },
  {
    name: 'Beef Stir-Fry with Noodles',
    ingredients: [
      { name: 'beef strips', quantity: 400, unit: 'g' },
      { name: 'egg noodles', quantity: 200, unit: 'g' },
      { name: 'mixed vegetables', quantity: 300, unit: 'g' },
      { name: 'soy sauce', quantity: 50, unit: 'ml' },
      { name: 'ginger', quantity: 20, unit: 'g' },
      { name: 'garlic', quantity: 3, unit: 'cloves' },
      { name: 'sesame oil', quantity: 1, unit: 'tbsp' }
    ]
  },
  {
    name: 'Roast Chicken with Vegetables',
    ingredients: [
      { name: 'whole chicken', quantity: 1.5, unit: 'kg' },
      { name: 'potatoes', quantity: 500, unit: 'g' },
      { name: 'carrots', quantity: 300, unit: 'g' },
      { name: 'parsnips', quantity: 200, unit: 'g' },
      { name: 'onions', quantity: 2, unit: 'pieces' },
      { name: 'garlic', quantity: 1, unit: 'bulb' },
      { name: 'rosemary', quantity: 2, unit: 'sprigs' },
      { name: 'olive oil', quantity: 2, unit: 'tbsp' }
    ]
  },
  {
    name: 'Vegetarian Lasagna',
    ingredients: [
      { name: 'lasagna sheets', quantity: 200, unit: 'g' },
      { name: 'ricotta cheese', quantity: 250, unit: 'g' },
      { name: 'mozzarella cheese', quantity: 200, unit: 'g' },
      { name: 'spinach', quantity: 200, unit: 'g' },
      { name: 'mushrooms', quantity: 200, unit: 'g' },
      { name: 'tomato sauce', quantity: 500, unit: 'ml' },
      { name: 'parmesan cheese', quantity: 50, unit: 'g' }
    ]
  },
  {
    name: 'Salmon with Lemon Butter Sauce',
    ingredients: [
      { name: 'salmon fillets', quantity: 2, unit: 'pieces' },
      { name: 'butter', quantity: 50, unit: 'g' },
      { name: 'lemon', quantity: 1, unit: 'piece' },
      { name: 'asparagus', quantity: 200, unit: 'g' },
      { name: 'garlic', quantity: 2, unit: 'cloves' },
      { name: 'white wine', quantity: 50, unit: 'ml' },
      { name: 'cream', quantity: 100, unit: 'ml' }
    ]
  },
  {
    name: 'Chicken Tikka Masala',
    ingredients: [
      { name: 'chicken breasts', quantity: 500, unit: 'g' },
      { name: 'yogurt', quantity: 200, unit: 'g' },
      { name: 'tikka spices', quantity: 2, unit: 'tbsp' },
      { name: 'tomatoes', quantity: 400, unit: 'g' },
      { name: 'cream', quantity: 200, unit: 'ml' },
      { name: 'onions', quantity: 2, unit: 'pieces' },
      { name: 'garlic', quantity: 3, unit: 'cloves' },
      { name: 'ginger', quantity: 20, unit: 'g' },
      { name: 'basmati rice', quantity: 200, unit: 'g' }
    ]
  },
  {
    name: 'Beef Tacos',
    ingredients: [
      { name: 'beef mince', quantity: 500, unit: 'g' },
      { name: 'taco shells', quantity: 8, unit: 'pieces' },
      { name: 'lettuce', quantity: 100, unit: 'g' },
      { name: 'tomatoes', quantity: 2, unit: 'pieces' },
      { name: 'cheese', quantity: 100, unit: 'g' },
      { name: 'sour cream', quantity: 100, unit: 'ml' },
      { name: 'salsa', quantity: 200, unit: 'ml' },
      { name: 'guacamole', quantity: 100, unit: 'g' }
    ]
  },
  {
    name: 'Mushroom Risotto',
    ingredients: [
      { name: 'Arborio rice', quantity: 300, unit: 'g' },
      { name: 'mixed mushrooms', quantity: 300, unit: 'g' },
      { name: 'white wine', quantity: 100, unit: 'ml' },
      { name: 'vegetable stock', quantity: 1, unit: 'L' },
      { name: 'parmesan cheese', quantity: 100, unit: 'g' },
      { name: 'butter', quantity: 50, unit: 'g' },
      { name: 'onion', quantity: 1, unit: 'piece' },
      { name: 'garlic', quantity: 2, unit: 'cloves' }
    ]
  },
  {
    name: 'Fish and Chips',
    ingredients: [
      { name: 'white fish fillets', quantity: 400, unit: 'g' },
      { name: 'flour', quantity: 100, unit: 'g' },
      { name: 'beer', quantity: 200, unit: 'ml' },
      { name: 'potatoes', quantity: 500, unit: 'g' },
      { name: 'vegetable oil', quantity: 1, unit: 'L' },
      { name: 'mushy peas', quantity: 200, unit: 'g' },
      { name: 'tartar sauce', quantity: 50, unit: 'ml' }
    ]
  },
  {
    name: "Shepherd's Pie",
    ingredients: [
      { name: 'lamb mince', quantity: 500, unit: 'g' },
      { name: 'onions', quantity: 2, unit: 'pieces' },
      { name: 'carrots', quantity: 200, unit: 'g' },
      { name: 'frozen peas', quantity: 100, unit: 'g' },
      { name: 'beef gravy', quantity: 300, unit: 'ml' },
      { name: 'potatoes', quantity: 1, unit: 'kg' },
      { name: 'butter', quantity: 50, unit: 'g' },
      { name: 'milk', quantity: 100, unit: 'ml' },
      { name: 'cheese', quantity: 50, unit: 'g' }
    ]
  },
  {
    name: 'Prawn Pad Thai',
    ingredients: [
      { name: 'rice noodles', quantity: 200, unit: 'g' },
      { name: 'prawns', quantity: 200, unit: 'g' },
      { name: 'eggs', quantity: 2, unit: 'pieces' },
      { name: 'bean sprouts', quantity: 100, unit: 'g' },
      { name: 'peanuts', quantity: 50, unit: 'g' },
      { name: 'tamarind paste', quantity: 2, unit: 'tbsp' },
      { name: 'fish sauce', quantity: 2, unit: 'tbsp' },
      { name: 'lime', quantity: 1, unit: 'piece' }
    ]
  },
  {
    name: 'Margherita Pizza',
    ingredients: [
      { name: 'pizza dough', quantity: 300, unit: 'g' },
      { name: 'tomato sauce', quantity: 100, unit: 'ml' },
      { name: 'mozzarella cheese', quantity: 200, unit: 'g' },
      { name: 'fresh basil', quantity: 10, unit: 'leaves' },
      { name: 'olive oil', quantity: 2, unit: 'tbsp' },
      { name: 'salt', quantity: 1, unit: 'tsp' }
    ]
  },
  {
    name: 'Chicken Fajitas',
    ingredients: [
      { name: 'chicken breasts', quantity: 400, unit: 'g' },
      { name: 'bell peppers', quantity: 2, unit: 'pieces' },
      { name: 'onions', quantity: 2, unit: 'pieces' },
      { name: 'fajita seasoning', quantity: 2, unit: 'tbsp' },
      { name: 'tortillas', quantity: 6, unit: 'pieces' },
      { name: 'sour cream', quantity: 100, unit: 'ml' },
      { name: 'cheese', quantity: 100, unit: 'g' },
      { name: 'salsa', quantity: 150, unit: 'ml' }
    ]
  },
  {
    name: 'Butternut Squash Soup',
    ingredients: [
      { name: 'butternut squash', quantity: 1, unit: 'whole' },
      { name: 'onions', quantity: 2, unit: 'pieces' },
      { name: 'garlic', quantity: 3, unit: 'cloves' },
      { name: 'vegetable stock', quantity: 1, unit: 'L' },
      { name: 'coconut milk', quantity: 200, unit: 'ml' },
      { name: 'sage leaves', quantity: 10, unit: 'leaves' },
      { name: 'olive oil', quantity: 2, unit: 'tbsp' }
    ]
  },
  {
    name: 'BBQ Pulled Pork',
    ingredients: [
      { name: 'pork shoulder', quantity: 1.5, unit: 'kg' },
      { name: 'BBQ sauce', quantity: 300, unit: 'ml' },
      { name: 'brown sugar', quantity: 50, unit: 'g' },
      { name: 'smoked paprika', quantity: 2, unit: 'tsp' },
      { name: 'cumin', quantity: 2, unit: 'tsp' },
      { name: 'burger buns', quantity: 6, unit: 'pieces' },
      { name: 'coleslaw', quantity: 300, unit: 'g' }
    ]
  }
];

async function updateMealIngredients(userId: string) {
  console.log('Updating meals with structured ingredients...');

  for (const mealUpdate of updatedMeals) {
    console.log(`Updating: ${mealUpdate.name}`);
    
    const { error } = await supabase
      .from('meals')
      .update({ ingredients: mealUpdate.ingredients })
      .eq('name', mealUpdate.name)
      .eq('user_id', userId);

    if (error) {
      console.error(`Error updating ${mealUpdate.name}:`, error);
    } else {
      console.log(`✅ Updated ${mealUpdate.name}`);
    }
  }
}

// Main execution
async function main() {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error('Usage: npx tsx scripts/update-meal-ingredients.ts <user-email>');
    process.exit(1);
  }

  // Get user ID from email
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error fetching users:', userError);
    process.exit(1);
  }

  const user = userData.users.find(u => u.email === userEmail);

  if (!user) {
    console.error(`User not found: ${userEmail}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (${user.id})`);
  
  await updateMealIngredients(user.id);

  console.log('\n✅ Meal ingredients update complete!');
}

main().catch(console.error);
