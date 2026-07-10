'use client';

import Link from 'next/link';
import { Calendar, ChefHat, ShoppingCart, Users, ArrowRight, Utensils } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 md:py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8">
              <ChefHat className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Your Personal Meal Planning Assistant</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight">
              Plan Your Meals,<br />
              <span className="text-primary">Simplify Your Life</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Forkast helps you plan delicious meals, organize your shopping list,
              and save time in the kitchen. Start planning smarter today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
              Everything You Need to Plan Better
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete meal planning solution that grows with your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Weekly Planning"
              description="Plan your entire week with our intuitive drag-and-drop interface."
            />
            <FeatureCard
              icon={<ShoppingCart className="w-6 h-6" />}
              title="Smart Shopping"
              description="Automatically generate shopping lists from your meal plans."
            />
            <FeatureCard
              icon={<Utensils className="w-6 h-6" />}
              title="Recipe Collection"
              description="Build your personal cookbook with your favorite recipes."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Share Plans"
              description="Share meal plans with family and friends easily."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create an Account"
              description="Sign up for free and set up your profile with dietary preferences."
            />
            <StepCard
              number="2"
              title="Add Your Meals"
              description="Import recipes or create your own meals from scratch."
            />
            <StepCard
              number="3"
              title="Plan & Shop"
              description="Schedule meals and generate shopping lists automatically."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
            Ready to Start Planning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of home cooks who have simplified their meal planning with Forkast.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            <span className="font-serif font-semibold text-foreground">Forkast</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Forkast. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative text-center">
      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
