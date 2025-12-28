# Meal Planning Application Product Requirements Document (PRD)

**Version:** 1.1
**Date:** July 9, 2025

## Section 1: Goals and Background Context

**Goals**
* Achieve 10% month-over-month growth in DAU.
* Validate the core value proposition (25% of users save >10 recipes and plan weekly).
* Convert 5% of free users to paid within 6 months.
* Quantifiably reduce "meal planning fatigue."
* Enable weekly plan creation in under 15 minutes.

**Background Context**
This project addresses "meal planning fatigue" by creating a logic-driven meal planner that reduces cognitive load and reintroduces variety into home cooking. The initial MVP will validate this core value proposition.

**Change Log**
| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2025-07-08 | 1.0 | Initial PRD draft. | John, PM |
| 2025-07-09 | 1.1 | Added Epic 4 for Subscriptions & Payments. Added FR8 for Ingredients/Instructions to align with final UI/UX Spec. | Sarah, PO |
| 2025-07-09 | 1.0 | Initial Version | Team |
| 2025-07-15 | 1.1 | Added Epic 3 stories | Team |
| 2025-08-01 | 1.2 | Updated Testing Strategy | Team |

## Testing Strategy

Our testing approach focuses on delivering high-quality software through a pragmatic combination of automated E2E tests and manual verification:

### Automated Testing
- **Playwright E2E Tests**:
  - Cover critical user journeys and happy paths
  - Focus on complete user workflows rather than individual units
  - Run against a test environment that mimics production

### Manual Testing
- **Developer Testing Page**:
  - Interactive test harness at `/dev-testing` for rapid validation
  - Allows testing components in isolation with various states
  - Includes visual test results and debugging tools

### API Testing
- Direct testing of Edge Functions and API endpoints
- Focus on input validation, error cases, and edge conditions

### Quality Gates
1. All E2E tests must pass before deployment
2. Manual smoke testing of critical paths
3. Visual verification of UI components

This streamlined approach reduces maintenance overhead while ensuring application reliability through:
- Faster feedback cycles
- Reduced test fragility
- Focus on user-visible behavior
- Better alignment with business value

## Section 2: Requirements

**Functional Requirements**
* **FR1:** The system shall allow users to create a secure account and log in.
* **FR2:** The system shall provide a mechanism for users to manually add, view, edit, and delete meal entries.
* **FR3:** The system shall implement a recommendation engine based on the "least-recently-used" logic.
* **FR4:** The system shall provide a simple weekly display where users can view their planned meals.
* **FR5:** The system shall allow anonymous users to use the core features with data stored temporarily in local browser storage.
* **FR6:** The system shall provide a seamless process to migrate local data to a permanent account upon sign-up.
* **FR7:** The system shall allow a user to easily duplicate a meal entry within the weekly meal plan display.
* **FR8:** The system shall provide fields for users to add ingredients and instructions to their meal entries.

**Non-Functional Requirements**
* **NFR1:** The application's initial page load must complete in under 3 seconds.
* **NFR2:** The frontend shall be built using Next.js (React) and the backend using Supabase.
* **NFR3:** Free accounts will be limited to [42] meal entries.
* **NFR4:** The UI shall be responsive across modern desktop and mobile web browsers.

## Section 3: User Interface Design Goals

The UI will evoke a "warm, retro cookbook aesthetic" while prioritizing clarity. Key screens include a read-only Dashboard, an interactive Meal Planner page, a "My Meals" repertoire page, and an Add/Edit Meal Form. The design will be responsive and meet WCAG 2.1 AA accessibility standards.

## Section 4: Technical Assumptions

The project will be built in a Monorepo using a modern full-stack architecture where the Next.js frontend communicates directly with the Supabase BaaS platform. A comprehensive testing strategy will be required.

## Section 5: Epics & Stories

---
**Epic 1: Foundation & User Onboarding**
* **Epic Goal:** To establish the project's technical foundation by setting up the Next.js and Supabase projects. This epic will deliver the first piece of tangible user value by enabling users to create a secure, personal account and ensuring that any work they do as an anonymous visitor is seamlessly migrated when they sign up.

    * **Story 1.1: Project Initialization & Static Landing Page**
        * **As a** Project Owner, **I want** the initial Next.js project and Supabase integration set up, **so that** there is a foundational, runnable codebase and a simple landing page to build upon.
        * **Acceptance Criteria:** 1. A new Next.js project is created and configured. 2. Supabase project is created and environment variables are connected. 3. A simple landing page is visible. 4. The project can be successfully run locally.

    * **Story 1.2: User Sign-up with Email and Password**
        * **As a** new user, **I want** to sign up for an account using my email and password, **so that** I can save my meal plans permanently.
        * **Acceptance Criteria:** 1. A `/signup` page exists with a form. 2. A new user account is created in Supabase Auth. 3. User receives a confirmation email. 4. User is instructed to check their email for confirmation.

    * **Story 1.3: User Login and Logout**
        * **As a** registered user, **I want** to log in to my account and log out when I'm finished, **so that** I can securely access my saved data.
        * **Acceptance Criteria:** 1. A `/login` page exists. 2. User can log in with valid credentials and is redirected to their dashboard. 3. An error message is shown on failure. 4. A "Logout" button is visible and functional.

    * **Story 1.4: Anonymous Data Migration on Sign-up**
        * **As an** anonymous user with a temporary meal plan, **I want** my data to be automatically saved to my new account when I sign up, **so that** I don't lose my work.
        * **Acceptance Criteria:** 1. Local storage data is preserved during sign-up. 2. Upon successful account creation, data is migrated to the Supabase account. 3. Local storage is cleared post-migration. 4. User can see migrated data after first login.

---
**Epic 2: Core Meal Management & Recommendation Engine**
* **Epic Goal:** This epic delivers the core "painkiller" of the application. It will allow users to build their personal list of meals and then experience the magic of the intelligent recommendation engine.

    * **Story 2.1: View Meal Repertoire Page**
        * **As a** user, **I want** to see a dedicated page listing all the meals I have saved, **so that** I can view my entire repertoire in one place.
        * **Acceptance Criteria:** 1. A "My Meals" page exists. 2. It displays meals from Supabase (logged-in) or local storage (anonymous). 3. An "Add Your First Meal" button is shown if the list is empty. 4. The list is searchable.

    * **Story 2.2: Add a New Meal**
        * **As a** user, **I want** to add a new meal with a name and type to my repertoire, **so that** I can build my personal list of options.
        * **Acceptance Criteria:** 1. An "Add Meal" button opens a form. 2. The form includes fields for name, type, ingredients, and instructions. 3. The new meal is saved to the correct location. 4. The new meal appears in the repertoire list immediately.

    * **Story 2.3: Edit and Delete Existing Meals**
        * **As a** user, **I want** to edit the name or type of a meal, or delete it entirely, **so that** I can manage my list.
        * **Acceptance Criteria:** 1. Each meal has "Edit" and "Delete" options. 2. Edit pre-populates a form. 3. Delete requires confirmation. 4. Changes are reflected in the UI and data store.

    * **Story 2.4: Track Detailed Meal History**
        * **As a** developer, **I want** to save a detailed, timestamped record each time a user interacts with a meal in their plan, **so that** the system has rich data for recommendations.
        * **Acceptance Criteria:** 1. The `meal_history` table includes an `action_type` column. 2. The correct action type is recorded for each relevant user interaction.

    * **Story 2.5: Implement Core Recommendation Logic**
        * **As a** developer, **I want** to create a backend function that returns a list of suggested meals, prioritized by the longest time since they were last planned.
        * **Acceptance Criteria:** 1. A Supabase Edge Function is created. 2. It correctly queries the user's meals and history. 3. It returns one meal per type that is least recently planned. 4. The function is secure and performant.

    * **Story 2.6: Display Meal Suggestions**
        * **As a** user, **I want** to press a button and see a list of suggested meals, **so that** the app can help me decide what to cook next.
        * **Acceptance Criteria:** 1. A "Suggest Meals" button exists. 2. Clicking it calls the recommendation function. 3. The suggested meals are clearly displayed. 4. A helpful message is shown if there is insufficient data.

    * **Story 2.7: Enhance Recommendation Logic with Filters**
        * **As a** user, **I want** to request meal suggestions for a specific timeframe and that match certain dietary needs, **so that** I receive relevant recommendations.
        * **Acceptance Criteria:** 1. The interface provides options for start date and number of days. 2. The interface allows filtering by meal type and dietary types. 3. The backend function accepts these parameters and returns a correctly structured plan.

---
**Epic 3: Weekly Meal Planning & Interaction**
* **Epic Goal:** This epic delivers the interactive planning workspace and the final dashboard.

    * **Story 3.1: Create Interactive Meal Planning Page**
        * **As a** user, **I want** a dedicated page where I can generate and customize a new meal plan, **so that** I have a focused workspace.
        * **Acceptance Criteria:** 1. A `/plan` page is created. 2. It contains the "Suggest Meals" interface. 3. It displays suggestions in an interactive weekly calendar format.

    * **Story 3.2: Cycle Through Meal Suggestions**
        * **As a** user, **I want** to cycle to the next best suggestion when I don't like a proposed meal, **so that** I can quickly find an alternative.
        * **Acceptance Criteria:** 1. Each meal card has a "Replace" option. 2. Clicking it calls the recommendation engine to get the next-best suggestion. 3. The UI updates with the new meal.

    * **Story 3.3: Implement Meal Reordering on Planning Page**
        * **As a** user, **I want** to move meals from one day to another, **so that** I can adjust my plan.
        * **Acceptance Criteria:** 1. The user can drag and drop a meal card. 2. The date display for the slot updates correctly.

    * **Story 3.4: Implement Meal Duplication on Planning Page**
        * **As a** user, **I want** to duplicate a meal, **so that** I can easily plan for leftovers.
        * **Acceptance Criteria:** 1. Each meal card has a "Duplicate" option. 2. It allows the user to place a copy of the meal on another day/slot.

    * **Story 3.5: Accept and Save the Meal Plan**
        * **As a** user, **I want** to "accept" my finalized meal plan, **so that** it is saved to my history.
        * **Acceptance Criteria:** 1. An "Accept Plan" button exists. 2. Clicking it saves the plan to the `meal_history` table. 3. The user receives confirmation and is redirected to their dashboard.

    * **Story 3.6: Create Read-Only Dashboard View**
        * **As a** user, **I want** my main dashboard to show my current, active meal plan, **so that** I can quickly see what's for dinner.
        * **Acceptance Criteria:** 1. The dashboard displays the most recently "accepted" plan. 2. The view is read-only. 3. A link exists to navigate to the planning page.

---
**Epic 4: Subscription & Payment**
* **Epic Goal:** To integrate a secure payment system to allow users to upgrade to a premium plan.

    * **Story 4.1: View Plan Limits and Upgrade Prompt**
        * **As a** free user, **I want** to be clearly informed when I reach my meal limit, **so that** I understand the value of upgrading.
        * **Acceptance Criteria:** 1. When at their limit, a user is prevented from saving a new meal. 2. A message appears informing them of the limit. 3. The message explains the benefit of upgrading and has an "Upgrade Now" button. 4. The message can be dismissed.

    * **Story 4.2: View Subscription Plans & Pricing Page**
        * **As a** user, **I want** to see a clear pricing page, **so that** I can choose the right plan.
        * **Acceptance Criteria:** 1. The "Upgrade Now" button links to a `/pricing` page. 2. The page displays "Free" and "Premium" plans for comparison with features listed. 3. The price is clearly displayed. 4. The "Premium Plan" has an "Upgrade" button.

    * **Story 4.3: Complete a Secure Payment for Subscription**
        * **As a** user, **I want** to securely enter my payment details and complete my purchase, **so that** I can upgrade my account.
        * **Acceptance Criteria:** 1. The "Upgrade" button leads to a checkout form. 2. Checkout is handled by Stripe. 3. A secure Stripe payment form is displayed. 4. On success, the user is redirected to a "Success" page; on failure, an error is shown.

    * **Story 4.4: Activate Premium Access After Successful Payment**
        * **As a** system administrator, **I want** the system to automatically update a user's account after a successful payment, **so that** they immediately receive access to paid features.
        * **Acceptance Criteria:** 1. The system exposes a secure webhook endpoint for Stripe. 2. It can verify and handle the `checkout.session.completed` event. 3. It updates the user's `subscription_status` in the database. 4. Premium features are unlocked for that user.