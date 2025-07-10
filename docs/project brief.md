# Project Brief: Meal Planning Application

### Executive Summary

Our meal planning application is designed to combat meal fatigue and forgetfulness for busy families, young professionals, and individuals with specific dietary needs. It addresses the common problem of repetitive meal cycles and the complexity of planning for mixed-diet households by intelligently suggesting meals from a user's repertoire that they haven't had in the longest time. The application will operate on a data-gated freemium model, with premium tiers unlocking advanced capabilities.

### Problem Statement

Users experience significant "meal planning fatigue," leading to repetitive meals, added stress, and less-than-ideal meal choices. Existing digital tools are fragmented, failing to offer a single, intelligent solution. In an era of busy lives and rising costs, a tool that reduces daily workload and brings joy back to home cooking is highly relevant.

### Proposed Solution

We will develop a smart meal planner with a "warm, retro cookbook aesthetic." The core feature is a recommendation engine that suggests meals the user hasn't had in the longest time. The app will be built on Next.js and Supabase.

### Target Users

* **Primary: The Busy Family Planner:** Time-poor heads of households needing efficiency and inspiration.
* **Secondary: The Health-Conscious Professional:** Tech-savvy individuals focused on dietary goals who value efficiency and data.

### MVP Scope

The MVP will focus on the core recommendation engine and basic meal management. The business model is a **Data-Gated Freemium** approach, where the free tier is limited to a set number of meals (~42). Advanced features like Recipe Scraping and the Cooking Gantt Chart are reserved for the premium tier.

### Post-MVP Vision

Future features include Recipe Scraping, a Visual Cooking Gantt Chart, Smart Shopping Lists, Bulk Import, Printable Plans, a Recipe Scaler, a Built-in Measurement Converter, a Prep-Ahead Planner, and Community Recipe Sharing.

### Technical Considerations

* **Frontend:** Next.js (React)
* **Backend & Database:** Supabase
* **Hosting:** Vercel & Supabase

### Constraints & Assumptions

* **Constraints:** A passion project with no fixed budget or timeline, to be built by one person using AI coding platforms.
* **Assumptions:** Users will manually enter initial meal names; the "least-recently-used" logic is a compelling hook; the data-gated model will encourage upgrades.

### Risks & Open Questions

* **Risks:** The free tier may be "good enough," initial manual entry could cause user friction, and the logic engine could feel too rigid without more context.
* **Open Questions:** What is the optimal meal limit for the free tier? What is the most compelling premium feature to build first?