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

### Story 3.4: Meal Duplication
**As a** user,  
**I want** to duplicate meals within my meal plan,  
**so that** I can easily plan for leftovers.

**Acceptance Criteria:**
1. Each meal card has a "Duplicate" option
2. Users can place a copy of the meal on another day/slot
3. Duplication works across different meal types

### Story 3.5: Accept and Save the Meal Plan
**As a** user,  
**I want** to "accept" my finalized meal plan,  
**so that** it is saved to my history.

**Acceptance Criteria:**
1. An "Accept Plan" button exists on the meal planning page
2. Clicking it saves the plan to the `meal_plans` table
3. Each meal in the plan is recorded in the `meal_history` table
4. The user receives a success notification
5. The user is redirected to their dashboard

### Story 3.6: Read-Only Dashboard View
**As a** user,  
**I want** my main dashboard to show my current, active meal plan,  
**so that** I can quickly see what's for dinner.

**Acceptance Criteria:**
1. The dashboard displays the most recently "accepted" plan
2. The view is read-only (no editing capabilities)
3. A "Plan Meals" button exists to navigate to the planning page
4. The dashboard shows the week range of the displayed meal plan
5. Each day shows the planned meals

### Story 3.7: Meal Plan History & Storage
**As a** user,  
**I want** to view and manage my past saved meal plans,  
**so that** I can reference previous plans or reuse them.

**Acceptance Criteria:**
1. Users can view a list of their past saved meal plans
2. Each past plan shows the week range and a summary of meals
3. Users can click on a past plan to view it in detail (read-only)
4. Users can duplicate a past plan to use as a starting point
5. The history view is accessible from the dashboard

### Story 3.8: Plan Page Layout Refinement
**As a** user,  
**I want** the meal planning page to have better layout with horizontal filters at the top,  
**so that** I have more horizontal space for both the meal plan and suggestions.

**Acceptance Criteria:**
1. Dietary and meal type filters are displayed horizontally at the top
2. The meal plan calendar is positioned below the filters
3. Meal suggestions panel has adequate horizontal space
4. The layout is responsive on mobile and desktop
5. Filter state persists when navigating away and returning

### Story 3.9: Meal Form UI Cleanup
**As a** user,  
**I want** the add/edit meal form to have a single save button,  
**so that** the interface is cleaner and less confusing.

**Acceptance Criteria:**
1. Only one save button is visible on the meal form
2. The save button is positioned consistently
3. Save functionality works correctly for both add and edit modes
4. Form validation and error handling remain intact
5. User receives appropriate feedback on save success/failure

### Story 3.10: Meal Plan Printing
**As a** user,  
**I want** to print my meal plan in a clean, printer-friendly format,  
**so that** I can reference it offline or post it on my refrigerator.

**Acceptance Criteria:**
1. A "Print" button is available on the dashboard and meal plan detail views
2. Clicking the button opens a print-friendly view of the meal plan
3. The print view includes the week range and all planned meals
4. The print view removes unnecessary UI elements
5. The print layout is optimized for standard paper sizes
6. Users can print directly from their browser's print dialog

### Story 3.11: Measurement Conversion
**As a** user,  
**I want** to convert ingredient measurements between different units,  
**so that** I can adapt recipes to my preferred measurement system.

**Acceptance Criteria:**
1. Users can convert between common volume units (cups, ml, liters, fl oz)
2. Users can convert between common weight units (grams, kg, oz, lbs)
3. Users can convert between temperature units (Celsius, Fahrenheit)
4. A conversion tool is accessible from the meal form and shopping list
5. Conversions are accurate and handle decimal values
6. The UI clearly shows the original and converted values

### Story 3.12: User Profile Management
**As a** user,  
**I want** to view and update my profile information and preferences,  
**so that** I can customize my experience and manage my account.

**Acceptance Criteria:**
1. Users can access a profile page from the main navigation
2. Users can view their current profile information
3. Users can update their display name
4. Users can set dietary preferences
5. Users can set default measurement system preference
6. Users can change their password
7. Changes are saved and reflected immediately in the UI

### Story 3.13: Meal Plan Sharing
**As a** user,  
**I want** to share my meal plan with family or friends,  
**so that** others can view or use my plan.

**Acceptance Criteria:**
1. Users can generate a shareable link for their meal plan
2. The shared link displays a read-only view of the meal plan
3. Shared plans are accessible without requiring login
4. Users can revoke or regenerate share links
5. Shared plans show the week range and all planned meals
6. Users can optionally include meal details in the share
7. A "Copy Link" button makes it easy to share the URL

### Story 3.17: Dashboard Redesign with Widgets
**As a** user,  
**I want** a dashboard that shows my meal planning overview with helpful widgets,  
**so that** I can quickly see my planning status, stats, and get inspired.

**Acceptance Criteria:**
1. Dashboard displays a summary card of the current active meal plan
2. A "Next 4 Weeks" card shows which weeks have meals planned
3. Quick stats widget shows meals planned this month and time saved
4. Photo carousel displays user's own meal profile pictures
5. Placeholder cards exist for future features (Recommended Meals, News/Tips)
6. Route restructure: `/` = Dashboard, `/plan` = Current Plan View, `/planner` = Interactive Planner

### Story 3.18: Recommended Meals Based on Similar Users
**As a** user,  
**I want** to see meal recommendations based on what similar users enjoy,  
**so that** I can discover new meals that match my taste preferences.

**Acceptance Criteria:**
1. Dashboard displays a "Recommended Meals" widget
2. Recommendations based on similarity between users' meal inventories
3. Suggested meals are ones similar users have that current user doesn't
4. Each recommendation shows meal name, image, and "Why recommended" reason
5. Users can dismiss or add recommended meals to their repertoire

## Technical Notes
- Implement a "least-recently-used" algorithm for meal suggestions
- Use Supabase Row Level Security for data access control
- Optimistic UI updates for drag-and-drop functionality
- Local storage for anonymous users with migration path
- Responsive design for mobile and desktop use
- Route architecture: Dashboard (`/`), Plan View (`/plan`), Planner (`/planner`)
