# Meal Planning Application UI/UX Specification

**Version:** 1.0
**Date:** July 9, 2025

### Section 1: Overall UX Goals & Principles

* **Target Personas:** The Busy Family Planner; The Health-Conscious Professional.
* **Usability Goals:** Efficiency (<15 min plan time), Simplicity (low cognitive load), Engagement (effortless satisfaction).
* **Design Principles:** Inspired by Cookbooks, Designed for Clarity; Clarity Above All; Guided, Not Rigid; Progressive Disclosure.

### Section 2: Information Architecture (IA)

The application consists of public-facing pages (Landing, Signup, Login) and authenticated pages (Dashboard, Meal Planner, My Meals, Add/Edit Meal Form). Navigation is simple and task-oriented.

### Section 3: User Flows

* **Flow 1: Onboarding a New Anonymous User:** Guides a new user from the landing page through adding their first meals and seeing a generated plan, all without signing up.
* **Flow 2: Weekly Planning for Returning User:** The core loop for a logged-in user to generate, customize, and save a new weekly plan.

### Section 4: Wireframes & Mockups (Conceptual)

* **Dashboard:** A vertical accordion layout showing the read-only active plan, with the current day expanded by default. Includes a "Companion Block" for engaging insights.
* **Meal Planner:** An interactive workspace with controls to generate a filtered plan, and tools to customize it via drag-and-drop, replace, and duplicate actions before accepting.
* **My Meals:** A grid-based view of the user's entire meal inventory, with search/filter controls and actions to Add, Edit, or Duplicate meals. Meal cards include a circular image.
* **Add/Edit Meal Form:** A two-column, "resume-style" layout for entering all meal details, including name, photo, type, URL, ingredients, and instructions, plus a stats bar for saved meals.