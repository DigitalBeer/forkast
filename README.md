# Forkast

Welcome to the Forkast project! This application is designed to help you discover recipes, create shopping lists, and plan your meals with ease.

## Getting Started

To get the development environment running, follow these steps:

### 1. Install Dependencies

First, install the project dependencies using npm:

```bash
npm install
```

### 2. Set Up Environment Variables

This project requires a Supabase backend. You'll need to create a new Supabase project and connect it to this application.

1.  **Create a Supabase Project**: If you don't have one already, go to [Supabase](https://supabase.com/) and create a new project.
2.  **Get API Keys**: In your Supabase project dashboard, navigate to **Settings** > **API** to find your Project URL and `anon` public key.
3.  **Create `.env.local` file**: Create a `.env.local` file in the root of the project by copying the example file:

    ```bash
    cp .env.local.example .env.local
    ```

4.  **Add Your Keys**: Open the `.env.local` file and add the keys you retrieved from your Supabase project:

    ```
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

### 3. Run the Development Server

Once your environment variables are set, you can start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) with TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Database, Storage)

