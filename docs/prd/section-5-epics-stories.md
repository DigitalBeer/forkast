# Section 5: Epics & Stories

---
**Epic 1: Foundation & User Onboarding**
* **Epic Goal:** To establish the project's technical foundation by setting up the Next.js and Supabase projects. This epic will deliver the first piece of tangible user value by enabling users to create a secure, personal account and ensuring that any work they do as an anonymous visitor is seamlessly migrated when they sign up.

    * **Story 1.1: Project Initialization & Static Landing Page**
        * **As a** Project Owner, **I want** the initial Next.js project and Supabase integration set up, **so that** there is a foundational, runnable codebase and a simple landing page to build upon.
        * **Acceptance Criteria:** 1. A new Next.js project is created and configured. 2. Supabase project is created and environment variables are connected. 3. A simple landing page is visible. 4. The project can be successfully run locally.

    * **Story 1.2: User Authentication System**
        * **As a** user, **I want** to create an account, log in, and log out securely, **so that** I can access personalized features and save my data.
        * **Acceptance Criteria:** 1. Users can create a new account using email/password. 2. Users can log in with their credentials. 3. Users can log out. 4. Password reset flow exists. 5. Protected routes redirect unauthenticated users.

    * **Story 1.3: Anonymous Data Migration on Sign-up**
        * **As an** anonymous user with a temporary meal plan, **I want** my data to be automatically saved to my new account when I sign up, **so that** I don't lose my work.
        * **Acceptance Criteria:** 1. Local storage data is preserved during sign-up. 2. Upon successful account creation, data is migrated to the Supabase account. 3. Local storage is cleared post-migration. 4. User can see migrated data after first login.

---
**Epic 2: Core Meal Management & Recommendation Engine**
* **Epic Goal:** This epic delivers the core "painkiller" of the application. It will allow users to build their personal list of meals and then experience the magic of the intelligent recommendation engine.

    * **Story 2.1: View Meal Repertoire Page**
        * **As a** user, **I want** to see a dedicated page listing all the meals I have saved, **so that** I can view my entire repertoire in one place.
        * **Acceptance Criteria:** 1. A "My Meals" page exists. 2. It displays meals from Supabase (logged-in) or local storage (anonymous). 3. An "Add Your First Meal" button is shown if the list is empty. 4. The list is searchable.

    * **Story 2.2: Add/Edit Meal Form**
        * **As a** user, **I want** to add new meals and edit existing ones, **so that** I can build and maintain my personal meal collection.
        * **Acceptance Criteria:** 1. Users can add a new meal. 2. Users can edit an existing meal. 3. Form includes validation. 4. Changes persist to Supabase (logged-in) or local storage (anonymous).

    * **Story 2.3: Delete a Meal**
        * **As a** user, **I want** to delete a meal from my repertoire, **so that** I can keep my list up-to-date and relevant.
        * **Acceptance Criteria:** 1. A "Delete" option exists for each meal. 2. Deletion requires confirmation. 3. Confirming deletion removes the meal from Supabase (logged-in) or local storage (anonymous).

    * **Story 2.4: Track Detailed Meal History**
        * **As a** developer, **I want** to save a detailed, timestamped record each time a user interacts with a meal in their plan, **so that** the system has rich data for recommendations.
        * **Acceptance Criteria:** 1. The `meal_history` table includes an `action_type` column. 2. The correct action type is recorded for each relevant user interaction.

    * **Story 2.5: Implement Meal Recommendation Engine**
        * **As a** user, **I want** the system to recommend meals based on my history and preferences, **so that** I can discover meals I might enjoy and reduce decision fatigue.
        * **Acceptance Criteria:** 1. Recommendation engine considers meal history and time since last prepared. 2. Works for authenticated and anonymous users.

    * **Story 2.6: Display Meal Suggestions**
        * **As a** user, **I want** to press a button and see a list of suggested meals, **so that** the app can help me decide what to cook next.
        * **Acceptance Criteria:** 1. "Suggest Meals" action exists. 2. Suggestions are displayed clearly. 3. Helpful message shown if insufficient data.

    * **Story 2.7: Enhance Recommendation Logic with Filters**
        * **As a** user, **I want** to request meal suggestions for a specific timeframe and match dietary needs, **so that** I receive relevant recommendations.
        * **Acceptance Criteria:** 1. UI supports filters. 2. Backend accepts filter parameters.

    * **Story 2.8: Refactor and Correct Recommendation Engine**
        * **As a** developer, **I want** to refactor the recommendation engine and fix bugs, **so that** it is maintainable and correct.
        * **Acceptance Criteria:** 1. Code quality issues addressed. 2. Filtering is applied correctly.

---
**Epic 3: Weekly Meal Planning & Interaction**
* **Epic Goal:** This epic delivers the interactive planning workspace and the final dashboard.

    * **Story 3.1: Create Interactive Meal Planning Page**
        * **As a** user, **I want** a dedicated page where I can generate and customize a new meal plan, **so that** I have a focused workspace.
        * **Acceptance Criteria:** 1. A `/plan` page is created. 2. It contains the "Suggest Meals" interface. 3. It displays suggestions in an interactive weekly calendar format.

    * **Story 3.2: Smart Meal Suggestions**
        * **As a** user, **I want** the system to suggest meals I haven't had recently, **so that** I can maintain variety in my meal planning.
        * **Acceptance Criteria:** 1. The system tracks when each meal was last prepared. 2. Suggestions prioritize meals not recently made. 3. Users can filter suggestions.

    * **Story 3.3: Generate Shopping List**
        * **As a** user, **I want** to generate a shopping list from my meal plan, **so that** I can efficiently shop for ingredients.
        * **Acceptance Criteria:** 1. Users can generate a shopping list from their meal plan. 2. Ingredients are aggregated. 3. Quantities are calculated.

    * **Story 3.4: Implement Meal Duplication on Planning Page**
        * **As a** user, **I want** to duplicate a meal, **so that** I can easily plan for leftovers.
        * **Acceptance Criteria:** 1. Each meal card has a "Duplicate" option. 2. It allows the user to place a copy of the meal on another day/slot.

    * **Story 3.5: Accept and Save the Meal Plan**
        * **As a** user, **I want** to "accept" my finalized meal plan, **so that** it is saved to my history.
        * **Acceptance Criteria:** 1. A "Save Plan" action exists. 2. Clicking it saves the plan to meal plan storage. 3. Each meal in the plan is recorded in meal history as planned. 4. The user receives confirmation.

    * **Story 3.6: Create Read-Only Dashboard View**
        * **As a** user, **I want** my main dashboard to show my current, active meal plan, **so that** I can quickly see what's for dinner.
        * **Acceptance Criteria:** 1. The dashboard displays the most recently "accepted" plan. 2. The view is read-only. 3. A link exists to navigate to the planning page.

    * **Story 3.7: Meal Plan History & Storage**
        * **As a** user, **I want** to view and reuse past saved meal plans, **so that** I can reference or duplicate previous weeks.
        * **Acceptance Criteria:** 1. Users can view a list of saved plans. 2. Users can view a plan in detail (read-only). 3. Users can duplicate a past plan.

    * **Story 3.8: Plan Page Layout Refinement**
        * **As a** user, **I want** improved plan page layout with horizontal filters, **so that** I have more space for planning and suggestions.
        * **Acceptance Criteria:** 1. Filters are displayed horizontally. 2. Layout is responsive. 3. Filter state persists.

    * **Story 3.9: Meal Form UI Cleanup**
        * **As a** user, **I want** the add/edit meal form to have a single save button, **so that** the interface is cleaner and less confusing.
        * **Acceptance Criteria:** 1. Only one save button is visible.

    * **Story 3.10: Meal Plan Printing**
        * **As a** user, **I want** to print my meal plan in a printer-friendly format, **so that** I can reference it offline.
        * **Acceptance Criteria:** 1. A print action exists. 2. Print view removes unnecessary UI.

    * **Story 3.11: Measurement Conversion**
        * **As a** user, **I want** to convert ingredient measurements between units, **so that** I can adapt recipes to my preferences.
        * **Acceptance Criteria:** 1. Common volume and weight conversions exist.

    * **Story 3.12: User Profile Management**
        * **As a** user, **I want** to view and update my profile information, **so that** I can manage my account.
        * **Acceptance Criteria:** 1. Users can view profile. 2. Users can update display name.

    * **Story 3.13: Meal Plan Sharing**
        * **As a** user, **I want** to share my meal plan via a link, **so that** others can view it.
        * **Acceptance Criteria:** 1. A share link can be generated. 2. Shared plans are viewable read-only.

    * **Story 3.14: Shopping List Sync for Authenticated Users**
        * **As a** user, **I want** shopping list checkboxes to sync across devices, **so that** I can use my list anywhere.
        * **Acceptance Criteria:** 1. Checked state persists per user.

    * **Story 3.15: Pantry Inventory / "Have it" Check**
        * **As a** user, **I want** to mark ingredients I already have, **so that** my shopping list is more accurate.
        * **Acceptance Criteria:** 1. Items can be marked "have it".

    * **Story 3.16: Drag-and-Drop Polish (Swap vs Replace)**
        * **As a** user, **I want** smoother drag-and-drop interactions, **so that** adjusting my plan feels intuitive.
        * **Acceptance Criteria:** 1. Drag-and-drop behavior is predictable.

---
**Epic 4: Subscription & Payment**
* **Epic Goal:** To integrate a secure payment system to allow users to upgrade to a premium plan.

    * **Story 4.1: Subscription Plans & Billing**
        * **As a** user, **I want** to view and select from subscription plans, **so that** I can access premium features.
        * **Acceptance Criteria:** 1. A pricing page exists. 2. Free tier meal limit is defined. 3. Users can start upgrade flow.

    * **Story 4.2: Stripe Payment Integration**
        * **As a** user, **I want** to upgrade via Stripe checkout and manage billing, **so that** I can pay for Premium and manage my subscription.
        * **Acceptance Criteria:** 1. Authenticated users can start Stripe checkout. 2. Stripe customer is associated to the user. 3. Billing portal is available.

    * **Story 4.3: Stripe Webhook Handler**
        * **As a** system, **I want** to process Stripe webhook events, **so that** users automatically gain or lose Premium access based on billing state.
        * **Acceptance Criteria:** 1. Webhook endpoint exists. 2. Webhook signature is verified. 3. `profiles.subscription_status` is updated.

    * **Story 4.4: Premium Dashboard Analytics**
        * **As a** premium subscriber, **I want** to see analytics about my meal planning habits, **so that** I can make better decisions.
        * **Acceptance Criteria:** 1. Analytics dashboard exists for premium users. 2. Free users see upgrade prompt.

    * **Story 4.5: Recipe URL Scraping (Premium)**
        * **As a** premium subscriber, **I want** to import recipe details from a URL, **so that** I can add meals faster.
        * **Acceptance Criteria:** 1. Import from URL exists for premium. 2. Errors are handled gracefully.

---
**Epic 5: UX & Design Enhancements**
* **Epic Goal:** Improve visual design and user experience polish.

    * **Story 5.1: Visual Design Enhancements**
        * **As a** user, **I want** a warm, cookbook aesthetic, **so that** the app feels delightful.
        * **Acceptance Criteria:** 1. Visual improvements are consistent and accessible.

    * **Story 5.2: Cook Mode**
        * **As a** user, **I want** a cook mode view, **so that** I can follow a plan while cooking.

    * **Story 5.3: Onboarding "Taste Profile" Wizard**
        * **As a** user, **I want** onboarding to capture my preferences, **so that** suggestions fit me.

    * **Story 5.4: Interactive "Empty State" Sample Pack**
        * **As a** user, **I want** a guided empty state, **so that** I can get started quickly.

    * **Story 5.5: Meal Image Management**
        * **As a** user, **I want** to manage meal images, **so that** my repertoire is more visual.

---
**Epic 6: Offline & Reliability**
* **Epic Goal:** Support offline-friendly usage.

    * **Story 6.1: Offline Support**
        * **As a** user, **I want** the app to work offline, **so that** I can plan without connectivity.