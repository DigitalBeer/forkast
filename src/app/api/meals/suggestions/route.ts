import { NextRequest, NextResponse } from 'next/server';

// Dummy data for meal suggestions
const dummySuggestions = [
  { id: 'meal-1', name: 'Spaghetti Bolognese', meal_type: 'Dinner' },
  { id: 'meal-2', name: 'Chicken Salad', meal_type: 'Lunch' },
  { id: 'meal-3', name: 'Oatmeal with Berries', meal_type: 'Breakfast' },
];

export async function GET(_req: NextRequest) {
  console.log("--- [LOG] /api/meals/suggestions endpoint hit ---");

  try {
    // In a real implementation, you would fetch this from a database
    // or a recommendation engine.
    console.log("[LOG] Returning dummy meal suggestions.");
    return NextResponse.json(dummySuggestions, { status: 200 });

  } catch (error) {
    console.error("[ERROR] in /api/meals/suggestions:", error);
    return NextResponse.json({ message: 'Error fetching meal suggestions' }, { status: 500 });
  }
}
