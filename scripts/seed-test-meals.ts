/**
 * Test Meal Data Seeding Script
 * 
 * Run with: npx tsx scripts/seed-test-meals.ts <user-email>
 * 
 * Creates 25+ authentic meals with proper tags for testing
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Try both EDGE_SERVICE_ROLE_KEY and SUPABASE_SERVICE_ROLE_KEY for compatibility
const supabaseKey = process.env.EDGE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('- EDGE_SERVICE_ROLE_KEY:', process.env.EDGE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and EDGE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testMeals = [
  // Breakfast
  {
    name: 'Classic Full English Breakfast',
    description: 'Traditional British breakfast with eggs, bacon, sausages, beans, and toast',
    tags: ['Breakfast', 'British', 'High-Protein', 'Weekend'],
    ingredients: '2 eggs, 3 bacon rashers, 2 sausages, 1 tin baked beans, 2 slices bread, butter, mushrooms, tomatoes',
    instructions: '1. Fry bacon and sausages\n2. Cook eggs to preference\n3. Heat beans\n4. Grill tomatoes and mushrooms\n5. Toast bread\n6. Serve hot',
  },
  {
    name: 'Avocado Toast with Poached Eggs',
    description: 'Trendy breakfast with creamy avocado and perfectly poached eggs',
    tags: ['Healthy', 'Quick', 'Vegetarian'],
    ingredients: '2 slices sourdough, 1 ripe avocado, 2 eggs, lemon juice, chili flakes, salt, pepper',
    instructions: '1. Toast bread\n2. Mash avocado with lemon, salt, pepper\n3. Poach eggs\n4. Spread avocado on toast\n5. Top with eggs\n6. Sprinkle chili flakes',
  },
  {
    name: 'Greek Yogurt Parfait',
    description: 'Layered yogurt with granola, berries, and honey',
    tags: ['Healthy', 'Quick', 'No-Cook', 'Vegetarian'],
    ingredients: '200g Greek yogurt, 50g granola, 100g mixed berries, 1 tbsp honey, mint leaves',
    instructions: '1. Layer yogurt in glass\n2. Add granola\n3. Top with berries\n4. Drizzle honey\n5. Garnish with mint',
  },
  {
    name: 'Scrambled Eggs with Smoked Salmon',
    description: 'Creamy scrambled eggs with luxury smoked salmon',
    tags: ['Protein-Rich', 'Luxury', 'Quick'],
    ingredients: '3 eggs, 100g smoked salmon, 2 tbsp cream, butter, chives, black pepper',
    instructions: '1. Beat eggs with cream\n2. Melt butter in pan\n3. Scramble eggs slowly\n4. Serve with salmon\n5. Garnish with chives',
  },
  {
    name: 'Banana Pancakes',
    description: 'Fluffy pancakes with caramelized bananas and maple syrup',
    tags: ['Weekend', 'Sweet', 'Family-Friendly'],
    ingredients: '150g flour, 2 eggs, 200ml milk, 2 bananas, butter, maple syrup, baking powder',
    instructions: '1. Mix batter\n2. Rest 10 minutes\n3. Fry pancakes\n4. Caramelize banana slices\n5. Stack and drizzle syrup',
  },

  // Lunch
  {
    name: 'Caesar Salad with Grilled Chicken',
    description: 'Classic Caesar with crispy romaine, parmesan, and grilled chicken',
    tags: ['Healthy', 'High-Protein', 'Salad'],
    ingredients: '2 chicken breasts, romaine lettuce, parmesan, Caesar dressing, croutons, lemon',
    instructions: '1. Grill chicken\n2. Chop lettuce\n3. Make dressing\n4. Toss salad\n5. Top with chicken and parmesan',
  },
  {
    name: 'Mediterranean Quinoa Bowl',
    description: 'Nutritious bowl with quinoa, feta, olives, and roasted vegetables',
    tags: ['Healthy', 'Vegetarian', 'Meal-Prep'],
    ingredients: '200g quinoa, feta cheese, cherry tomatoes, cucumber, olives, red onion, lemon, olive oil',
    instructions: '1. Cook quinoa\n2. Chop vegetables\n3. Roast tomatoes\n4. Mix all ingredients\n5. Dress with lemon and oil',
  },
  {
    name: 'Chicken and Bacon Club Sandwich',
    description: 'Triple-decker sandwich with chicken, bacon, lettuce, and tomato',
    tags: ['Classic', 'Filling', 'Quick'],
    ingredients: '3 slices bread, chicken breast, 4 bacon rashers, lettuce, tomato, mayo, cheese',
    instructions: '1. Toast bread\n2. Cook bacon\n3. Grill chicken\n4. Layer ingredients\n5. Cut into triangles',
  },
  {
    name: 'Thai Green Curry',
    description: 'Aromatic Thai curry with vegetables and jasmine rice',
    tags: ['Spicy', 'Asian', 'Vegetarian'],
    ingredients: 'Green curry paste, coconut milk, vegetables, tofu, jasmine rice, Thai basil, lime',
    instructions: '1. Cook rice\n2. Fry curry paste\n3. Add coconut milk\n4. Add vegetables and tofu\n5. Simmer 15 minutes\n6. Garnish with basil',
  },
  {
    name: 'Tuna Niçoise Salad',
    description: 'French salad with tuna, eggs, green beans, and olives',
    tags: ['Healthy', 'French', 'Protein-Rich'],
    ingredients: 'Tuna, eggs, green beans, new potatoes, tomatoes, olives, anchovies, vinaigrette',
    instructions: '1. Boil eggs and potatoes\n2. Blanch green beans\n3. Arrange salad\n4. Add tuna\n5. Dress with vinaigrette',
  },

  // Dinner
  {
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with pancetta, eggs, and parmesan',
    tags: ['Italian', 'Quick', 'Comfort-Food'],
    ingredients: '400g spaghetti, 200g pancetta, 4 eggs, 100g parmesan, black pepper, salt',
    instructions: '1. Cook pasta\n2. Fry pancetta\n3. Beat eggs with parmesan\n4. Mix hot pasta with egg mixture\n5. Add pancetta\n6. Season with pepper',
  },
  {
    name: 'Beef Stir-Fry with Noodles',
    description: 'Quick Asian stir-fry with tender beef and vegetables',
    tags: ['Asian', 'Quick', 'High-Protein'],
    ingredients: '400g beef strips, egg noodles, mixed vegetables, soy sauce, ginger, garlic, sesame oil',
    instructions: '1. Cook noodles\n2. Stir-fry beef\n3. Add vegetables\n4. Add sauce\n5. Toss with noodles',
  },
  {
    name: 'Roast Chicken with Vegetables',
    description: 'Sunday roast with crispy chicken and roasted root vegetables',
    tags: ['Sunday-Roast', 'Family-Meal', 'British'],
    ingredients: 'Whole chicken, potatoes, carrots, parsnips, onions, garlic, rosemary, olive oil',
    instructions: '1. Season chicken\n2. Roast at 200°C for 1.5 hours\n3. Add vegetables after 30 minutes\n4. Rest chicken\n5. Serve with gravy',
  },
  {
    name: 'Vegetarian Lasagna',
    description: 'Layered pasta with vegetables, ricotta, and mozzarella',
    tags: ['Italian', 'Vegetarian', 'Comfort-Food', 'Batch-Cook'],
    ingredients: 'Lasagna sheets, ricotta, mozzarella, spinach, mushrooms, tomato sauce, parmesan',
    instructions: '1. Make vegetable sauce\n2. Layer pasta, sauce, cheese\n3. Repeat layers\n4. Top with mozzarella\n5. Bake 45 minutes at 180°C',
  },
  {
    name: 'Salmon with Lemon Butter Sauce',
    description: 'Pan-seared salmon with creamy lemon butter and asparagus',
    tags: ['Healthy', 'Quick', 'Luxury'],
    ingredients: '2 salmon fillets, butter, lemon, asparagus, garlic, white wine, cream',
    instructions: '1. Season salmon\n2. Pan-sear skin-side down\n3. Steam asparagus\n4. Make lemon butter sauce\n5. Serve together',
  },
  {
    name: 'Chicken Tikka Masala',
    description: 'British-Indian curry with tender chicken in creamy tomato sauce',
    tags: ['Indian', 'Curry', 'Popular'],
    ingredients: 'Chicken, yogurt, tikka spices, tomatoes, cream, onions, garlic, ginger, rice',
    instructions: '1. Marinate chicken\n2. Grill chicken\n3. Make sauce\n4. Simmer chicken in sauce\n5. Serve with rice',
  },
  {
    name: 'Beef Tacos',
    description: 'Mexican tacos with seasoned beef, salsa, and guacamole',
    tags: ['Mexican', 'Quick', 'Family-Friendly'],
    ingredients: '500g beef mince, taco shells, lettuce, tomatoes, cheese, sour cream, salsa, guacamole',
    instructions: '1. Brown beef\n2. Add taco seasoning\n3. Warm taco shells\n4. Assemble tacos\n5. Top with condiments',
  },
  {
    name: 'Mushroom Risotto',
    description: 'Creamy Italian rice with wild mushrooms and parmesan',
    tags: ['Italian', 'Vegetarian', 'Comfort-Food'],
    ingredients: 'Arborio rice, mixed mushrooms, white wine, stock, parmesan, butter, onion, garlic',
    instructions: '1. Sauté mushrooms\n2. Toast rice\n3. Add wine\n4. Gradually add stock\n5. Stir in butter and parmesan',
  },
  {
    name: 'Fish and Chips',
    description: 'British classic with battered fish and chunky chips',
    tags: ['British', 'Comfort-Food', 'Friday-Night'],
    ingredients: 'White fish, flour, beer, potatoes, oil for frying, mushy peas, tartar sauce',
    instructions: '1. Make batter\n2. Cut and fry chips\n3. Batter and fry fish\n4. Serve with peas and sauce',
  },
  {
    name: 'Shepherd\'s Pie',
    description: 'Traditional British pie with lamb mince and mashed potato topping',
    tags: ['British', 'Comfort-Food', 'Family-Meal'],
    ingredients: 'Lamb mince, onions, carrots, peas, gravy, potatoes, butter, milk, cheese',
    instructions: '1. Brown lamb\n2. Add vegetables\n3. Make gravy\n4. Top with mashed potato\n5. Bake until golden',
  },

  // More variety
  {
    name: 'Prawn Pad Thai',
    description: 'Thai street food classic with prawns and rice noodles',
    tags: ['Thai', 'Asian', 'Quick'],
    ingredients: 'Rice noodles, prawns, eggs, bean sprouts, peanuts, tamarind, fish sauce, lime',
    instructions: '1. Soak noodles\n2. Stir-fry prawns\n3. Add noodles and sauce\n4. Add eggs\n5. Garnish with peanuts and lime',
  },
  {
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with tomato, mozzarella, and basil',
    tags: ['Italian', 'Vegetarian', 'Family-Friendly'],
    ingredients: 'Pizza dough, tomato sauce, mozzarella, fresh basil, olive oil, salt',
    instructions: '1. Roll out dough\n2. Spread sauce\n3. Add mozzarella\n4. Bake at 250°C for 10 minutes\n5. Top with basil',
  },
  {
    name: 'Chicken Fajitas',
    description: 'Sizzling Mexican chicken with peppers and tortillas',
    tags: ['Mexican', 'Quick', 'Interactive'],
    ingredients: 'Chicken, bell peppers, onions, fajita seasoning, tortillas, sour cream, cheese, salsa',
    instructions: '1. Slice chicken and vegetables\n2. Stir-fry with seasoning\n3. Warm tortillas\n4. Serve with toppings',
  },
  {
    name: 'Butternut Squash Soup',
    description: 'Creamy autumn soup with roasted butternut squash',
    tags: ['Soup', 'Vegetarian', 'Autumn', 'Batch-Cook'],
    ingredients: 'Butternut squash, onions, garlic, vegetable stock, coconut milk, sage, olive oil',
    instructions: '1. Roast squash\n2. Sauté onions and garlic\n3. Add stock\n4. Blend until smooth\n5. Stir in coconut milk',
  },
  {
    name: 'BBQ Pulled Pork',
    description: 'Slow-cooked pork shoulder with BBQ sauce',
    tags: ['American', 'Slow-Cook', 'Batch-Cook'],
    ingredients: 'Pork shoulder, BBQ sauce, brown sugar, spices, burger buns, coleslaw',
    instructions: '1. Rub pork with spices\n2. Slow cook 8 hours\n3. Shred pork\n4. Mix with BBQ sauce\n5. Serve in buns',
  },
];

async function seedMeals(userId: string) {
  console.log(`Seeding ${testMeals.length} test meals for user ${userId}...`);

  const mealsToInsert = testMeals.map(meal => ({
    ...meal,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from('meals')
    .insert(mealsToInsert)
    .select();

  if (error) {
    console.error('Error seeding meals:', error);
    throw error;
  }

  console.log(`✅ Successfully created ${data?.length} meals`);
  return data;
}

// Main execution
async function main() {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error('Usage: npx tsx scripts/seed-test-meals.ts <user-email>');
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

  await seedMeals(user.id);

  console.log('\n✅ Test data seeding complete!');
}

main().catch(console.error);
