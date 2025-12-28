# Epic 1: Foundation & User Authentication

## Epic Goal
To establish the project's technical foundation by setting up the Next.js and Supabase projects. This epic will deliver the first piece of tangible user value by enabling users to create a secure, personal account and ensuring that any work they do as an anonymous visitor is seamlessly migrated when they sign up.

## Stories

### Story 1.1: Project Initialization & Static Landing Page
**As a** Project Owner,  
**I want** the initial Next.js project and Supabase integration set up,  
**so that** there is a foundational, runnable codebase and a simple landing page to build upon.

**Acceptance Criteria:**
1. A new Next.js project is created and configured
2. Supabase project is created and environment variables are connected
3. A simple landing page is visible
4. The project can be successfully run locally

### Story 1.2: User Authentication System
**As a** user of the BMAD Meal Planner,  
**I want** to be able to create an account and log in securely,  
**so that** I can access personalized meal planning features and save my data.

**Acceptance Criteria:**
1. Users can create a new account using email/password
2. Users can log in with their credentials
3. Users can log out of their account
4. Password reset functionality is available
5. Protected routes redirect unauthenticated users
6. Basic user profile information is stored in the database

### Story 1.3: Anonymous Data Migration on Sign-up
**As an** anonymous user with a temporary meal plan,  
**I want** my data to be automatically saved to my new account when I sign up,  
**so that** I don't lose my work.

**Acceptance Criteria:**
1. Local storage data is preserved during sign-up
2. Upon successful account creation, data is migrated to the Supabase account
3. Local storage is cleared post-migration
4. User can see migrated data after first login

## Technical Notes
- Next.js 14+ with App Router
- Supabase Auth with email/password authentication
- Session management with cookies
- Basic user profile storage in Supabase
- Environment configuration for development and production
