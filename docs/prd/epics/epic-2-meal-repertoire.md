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

### Story 2.3: Meal Categories and Tags
**As a** user,  
**I want** to categorize and tag my meals,  
**so that** I can organize and filter my collection effectively.

**Acceptance Criteria:**
1. Users can add/remove tags to meals
2. Users can create custom categories
3. Meals can be filtered by tags and categories
4. Common tags are suggested when adding new meals

## Technical Notes
- Supabase tables needed: `meals`, `tags`, `meal_tags`
- Local storage fallback for anonymous users
- Optimistic UI updates for better user experience
- Client-side form validation
- Image upload capability for meal photos (stored in Supabase Storage)
