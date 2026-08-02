/**
 * User Setup Script: Premium + Meal Inventory
 *
 * Sets the user to premium (unlimited meals) and populates their personal meal inventory.
 * Run with: npm run setup:user -- mat.deegee@gmail.com
 *   or directly: dotenv -e .env.local -- tsx scripts/setup-user-meals.ts mat.deegee@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EDGE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('- Service role key:', supabaseKey ? '✓ Set' : '✗ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const personalMeals = [
  { name: 'Curry', tags: ['Dinner', 'Curry', 'Comfort-Food'] },
  { name: 'Pizza and garlic bread', tags: ['Dinner', 'Italian', 'Family-Friendly'] },
  { name: 'Spaghetti Bolognese', tags: ['Dinner', 'Italian', 'Comfort-Food'] },
  { name: 'Quorn Chilli', tags: ['Dinner', 'Vegetarian', 'Comfort-Food'] },
  { name: 'Steak, chips, onions, tomatoes, mushrooms', tags: ['Dinner', 'High-Protein', 'Weekend'] },
  { name: 'Katsu Curry', tags: ['Dinner', 'Japanese', 'Curry'] },
  { name: 'Pasta, sausages, pasta sauce', tags: ['Dinner', 'Quick', 'Comfort-Food'] },
  { name: 'Quiche, new potatoes, vegetables/baked beans', tags: ['Dinner', 'Vegetarian'] },
  { name: 'Spanish omelette (bacon or chorizo)', tags: ['Dinner', 'Spanish', 'Eggs'] },
  { name: 'Hot dogs', tags: ['Dinner', 'Quick', 'Family-Friendly'] },
  { name: 'Fish cakes, new potatoes, vegetables', tags: ['Dinner', 'Fish', 'British'] },
  { name: 'Thai Green Curry', tags: ['Dinner', 'Thai', 'Curry', 'Spicy'] },
  { name: 'Burritos', tags: ['Dinner', 'Mexican', 'Filling'] },
  { name: 'Slow cooker beef, roast potatoes, Yorkshire puddings, vegetables', tags: ['Dinner', 'Slow-Cook', 'Sunday-Roast', 'British'] },
  { name: 'Lasagne', tags: ['Dinner', 'Italian', 'Comfort-Food', 'Batch-Cook'] },
  { name: 'Jacket potato, cheese, baked beans, coleslaw, and salad', tags: ['Dinner', 'Vegetarian', 'Quick'] },
  { name: 'Fajitas', tags: ['Dinner', 'Mexican', 'Interactive'] },
  { name: 'Stir fry, hoisin sauce and noodles', tags: ['Dinner', 'Asian', 'Quick'] },
  { name: 'Burger and wedges', tags: ['Dinner', 'American', 'Family-Friendly'] },
  { name: 'Cajun turkey salad', tags: ['Dinner', 'Healthy', 'Salad', 'High-Protein'] },
  { name: 'Beef & Udon Noodles', tags: ['Dinner', 'Asian', 'High-Protein'] },
  { name: 'Cottage pie', tags: ['Dinner', 'British', 'Comfort-Food', 'Family-Meal'] },
  { name: 'Meatballs and spaghetti', tags: ['Dinner', 'Italian', 'Comfort-Food'] },
  { name: 'Wraps, Quorn dippers & wedges', tags: ['Dinner', 'Vegetarian', 'Quick'] },
  { name: 'Mediterranean roast vegetables, cous cous, falafel, hummus and crudites', tags: ['Dinner', 'Vegetarian', 'Mediterranean', 'Healthy'] },
  { name: 'Fish & chips', tags: ['Dinner', 'British', 'Comfort-Food', 'Friday-Night'] },
  { name: 'Orange Chicken & Rice', tags: ['Dinner', 'Asian', 'Family-Friendly'] },
  { name: 'Quorn pies and veg', tags: ['Dinner', 'Vegetarian'] },
  { name: 'Chicken and chorizo jambalaya', tags: ['Dinner', 'American', 'Spicy', 'High-Protein'] },
  { name: 'Sausage, peas & mash', tags: ['Dinner', 'British', 'Comfort-Food', 'Quick'] },
  { name: 'Greek kebab wraps with Oomph, red cabbage, hummus, falafels, halloumi', tags: ['Dinner', 'Mediterranean', 'Vegetarian-Option'] },
];

async function setPremium(userId: string) {
  console.log('\n🔑 Setting subscription to premium...');

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: 'premium' })
    .eq('id', userId);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  console.log('✅ Subscription set to premium (unlimited meals)');
}

async function addMeals(userId: string) {
  console.log(`\n🍽️  Inserting ${personalMeals.length} meals...`);

  // Check which meals already exist to avoid duplicates
  const { data: existing } = await supabase
    .from('meals')
    .select('name')
    .eq('user_id', userId);

  const existingNames = new Set((existing ?? []).map((m: { name: string }) => m.name.toLowerCase()));

  const toInsert = personalMeals
    .filter(m => !existingNames.has(m.name.toLowerCase()))
    .map(meal => ({ ...meal, user_id: userId }));

  if (toInsert.length === 0) {
    console.log('ℹ️  All meals already exist in the inventory — nothing to insert.');
    return;
  }

  if (toInsert.length < personalMeals.length) {
    console.log(`ℹ️  Skipping ${personalMeals.length - toInsert.length} already-existing meals`);
  }

  const { data, error } = await supabase.from('meals').insert(toInsert).select();

  if (error) {
    console.error('Error inserting meals:', error);
    throw error;
  }

  console.log(`✅ Successfully added ${data?.length} meals to inventory`);
}

async function main() {
  const userEmail = process.argv[2] ?? 'mat.deegee@gmail.com';

  console.log(`\n👤 Looking up user: ${userEmail}`);

  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error fetching users:', userError);
    process.exit(1);
  }

  const user = userData.users.find(u => u.email === userEmail);

  if (!user) {
    console.error(`❌ User not found: ${userEmail}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.email} (${user.id})`);

  await setPremium(user.id);
  await addMeals(user.id);

  console.log('\n🎉 Setup complete! User has unlimited meal access and all meals are in their inventory.');
}

main().catch(console.error);
