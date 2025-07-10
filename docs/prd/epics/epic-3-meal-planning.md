# Epic 3: Intelligent Meal Planning

## Epic Goal
This epic delivers the interactive planning workspace and the final dashboard, enabling users to generate, customize, and manage their weekly meal plans with intelligent recommendations.

## Stories

### Story 3.1: Interactive Meal Planning Page
**As a** user,  
**I want** a dedicated page where I can generate and customize a new meal plan,  
**so that** I have a focused workspace for planning my meals.

**Acceptance Criteria:**
1. A `/plan` page is created with a weekly calendar view
2. Users can generate meal suggestions based on their repertoire
3. The interface allows dragging and dropping meals to different days/meals
4. The system tracks when meals were last made to ensure variety
5. Users can save their meal plans

### Story 3.2: Smart Meal Suggestions
**As a** user,  
**I want** the system to suggest meals I haven't had recently,  
**so that** I can maintain variety in my meal planning.

**Acceptance Criteria:**
1. The system tracks when each meal was last prepared
2. Suggestions prioritize meals not recently made
3. Users can filter suggestions by tags/categories
4. The system learns from user preferences over time
5. Users can refresh suggestions if they don't like the current ones

### Story 3.3: Generate Shopping List
**As a** user,  
**I want** to generate a shopping list from my meal plan,  
**so that** I can efficiently shop for ingredients.

**Acceptance Criteria:**
1. Users can generate a shopping list from their meal plan
2. Ingredients are aggregated and categorized
3. Quantities are automatically calculated
4. Users can add custom items to the shopping list
5. The list can be shared or printed

## Technical Notes
- Implement a "least-recently-used" algorithm for meal suggestions
- Use Supabase Row Level Security for data access control
- Optimistic UI updates for drag-and-drop functionality
- Local storage for anonymous users with migration path
- Responsive design for mobile and desktop use
