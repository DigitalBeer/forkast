import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.EDGE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a random date within the last 30 days
function getRandomDateInLast30Days(): string {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
  return new Date(randomTime).toISOString();
}

async function updateMealLastPreparedDates() {
  try {
    console.log('Fetching all meals...');
    
    // Fetch all meals
    const { data: meals, error } = await supabase
      .from('meals')
      .select('id, name, last_prepared');
    
    if (error) {
      console.error('Error fetching meals:', error);
      return;
    }
    
    if (!meals || meals.length === 0) {
      console.log('No meals found in the database.');
      return;
    }
    
    console.log(`Found ${meals.length} meals. Updating with random dates...`);
    
    // Update each meal with a random last_prepared date
    for (const meal of meals) {
      const randomDate = getRandomDateInLast30Days();
      
      const { error: updateError } = await supabase
        .from('meals')
        .update({ last_prepared: randomDate })
        .eq('id', meal.id);
      
      if (updateError) {
        console.error(`Error updating meal ${meal.id} (${meal.name}):`, updateError);
      } else {
        console.log(`✓ Updated "${meal.name}" with date: ${randomDate}`);
      }
    }
    
    console.log('\n✅ All meals have been updated with random last_prepared dates from the last 30 days!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
updateMealLastPreparedDates();
