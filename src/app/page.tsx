export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between">
        <h1 className="text-lg font-bold">Forkast</h1>
        <nav className="flex items-center gap-4">
          <a href="/login" className="text-sm font-medium hover:underline">Log In</a>
          <a href="/signup" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">Sign Up</a>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center space-y-6 p-4 text-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
            Effortless Meal Planning
          </h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Plan your meals without mental fatigue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <a href="/signup" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              Get Started
            </a>
            <a href="/login" className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              Log In
            </a>
          </div>
        </div>
      </main>
      <footer className="flex items-center justify-center w-full h-24 border-t">
        <p className="text-muted-foreground">&copy; 2025 Forkast. All rights reserved.</p>
      </footer>
    </div>
  );
}
