# Epic 2: Meal Repertoire Management

## Epic Goal
This epic delivers the core functionality for users to build and manage their personal collection of meals. It introduces the foundation for the intelligent recommendation system by tracking meal usage patterns.

## Stories

### Story 2.1: View Meal Repertoire Page
**As a** user,  
**I want** to see a dedicated page listing all the meals I have saved,  
**so that** I can view my entire repertoire in one place.

**Acceptance Criteria:**
1. A "My Meals" page exists
2. It displays meals from Supabase (logged-in) or local storage (anonymous)
3. An "Add Your First Meal" button is shown if the list is empty
4. The list is searchable and sortable
5. Each meal shows key information (name, last made, etc.)

### Story 2.2: Add/Edit Meal Form
**As a** user,  
**I want** to add new meals and edit existing ones,  
**so that** I can build my personal meal collection.

**Acceptance Criteria:**
1. Users can add a new meal with name, description, and tags
2. Users can edit existing meal details
3. Form includes validation for required fields
4. Changes are persisted to Supabase (logged-in) or local storage (anonymous)
5. Users can add ingredients and cooking instructions

### Story 2.3: Delete a Meal
**As a** user,  
**I want** to be able to delete a meal from my repertoire,  
**so that** I can keep my list up-to-date and relevant.

**Acceptance Criteria:**
1. A "Delete" option exists for each meal
2. Clicking delete prompts for confirmation
3. Confirming deletion removes the meal from Supabase (logged-in) or local storage (anonymous)

### Story 2.4: Track Detailed Meal History
**As a** user,  
**I want** interactions with meals tracked with timestamps and action types,  
**so that** the system can provide better recommendations.

### Story 2.5: Implement Meal Recommendation Engine
**As a** user,  
**I want** meal recommendations based on history and preferences,  
**so that** meal planning is easier.

### Story 2.6: Display Meal Suggestions
**As a** user,  
**I want** to see suggested meals in the UI,  
**so that** I can quickly choose meals.

### Story 2.7: Enhance Recommendation Logic with Filters
**As a** user,  
**I want** to filter suggestions by dietary and meal type,  
**so that** I receive relevant recommendations.

### Story 2.8: Refactor and Correct Recommendation Engine
**As a** developer,  
**I want** to refactor and fix recommendation logic,  
**so that** it is maintainable and correct.

## Technical Notes
- Supabase tables needed: `meals`, `tags`, `meal_tags`
- Local storage fallback for anonymous users
- Optimistic UI updates for better user experience
- Client-side form validation
- Image upload capability for meal photos (stored in Supabase Storage)
