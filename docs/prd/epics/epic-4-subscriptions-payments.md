# Epic 4: Subscriptions & Payments

## Epic Goal
This epic introduces the subscription model and payment processing, enabling users to upgrade from the free tier to access premium features.

## Stories

### Story 4.1: Subscription Plans & Billing
**As a** user,  
**I want** to view and select from different subscription plans,  
**so that** I can access premium features.

**Acceptance Criteria:**
1. A pricing page displays available subscription tiers
2. Users can view feature comparisons between plans
3. The free tier is limited to 42 meal entries
4. Users can upgrade/downgrade their subscription
5. Payment processing is secure and handles errors gracefully

### Story 4.2: Stripe Payment Integration
**As a** user,  
**I want** to upgrade via Stripe checkout and manage billing,  
**so that** I can pay for Premium and manage my subscription.

**Acceptance Criteria:**
1. Authenticated users can start a Stripe checkout session
2. A Stripe customer is created/associated to the user
3. Premium users can open the Stripe billing portal

### Story 4.3: Stripe Webhook Handler
**As a** system,  
**I want** to process Stripe webhook events,  
**so that** users automatically gain or lose Premium access based on billing state.

**Acceptance Criteria:**
1. A Stripe webhook endpoint exists
2. Webhook signature is verified
3. User subscription status is updated in the database

### Story 4.4: Premium Dashboard Analytics
**As a** premium subscriber,  
**I want** to see advanced analytics and insights about my meal planning habits,  
**so that** I can make better decisions and get more value from my subscription.

**Acceptance Criteria:**
1. Premium users see an analytics dashboard section
2. Analytics include meal frequency statistics
3. Analytics show variety metrics (unique meals per week/month)
4. Analytics display meal type distribution
5. Analytics show planning consistency (weeks with complete plans)
6. Users can filter analytics by date range
7. Analytics are visualized with charts/graphs
8. Free users see a preview/teaser with upgrade prompt

### Story 4.5: Recipe URL Scraping (Premium)
**As a** premium subscriber,  
**I want** to automatically import recipe details by pasting a URL,  
**so that** I can quickly add meals without manual data entry.

**Acceptance Criteria:**
1. Premium users see a "Import from URL" option on the add meal form
2. Users can paste a recipe URL from popular cooking sites
3. The system automatically extracts recipe name, ingredients, and instructions
4. Users can review and edit the imported data before saving
5. The system handles errors gracefully (unsupported sites, parsing failures)
6. Free users see the feature with an upgrade prompt
7. Imported recipes are attributed to their source URL

## Technical Notes
- Integrate with Stripe for payment processing
- Implement webhook handlers for subscription events
- Use Supabase RLS to enforce subscription limits
- Graceful degradation for expired/canceled subscriptions
- Secure storage of payment information (via Stripe)
- Email notifications for subscription events
- Rate limiting for API endpoints
