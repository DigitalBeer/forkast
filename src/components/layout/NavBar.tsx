'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/plan', label: 'Plan' },
  { href: '/planner', label: 'Planner' },
  { href: '/meal-plans/history', label: 'Saved Plans' },
  { href: '/meals', label: 'Meals' },
  { href: '/meals/new', label: 'New Meal' },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    logout();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-30 bg-cookbook-cream/95 backdrop-blur border-b border-border print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-hand font-bold text-cookbook-terracotta text-2xl leading-none"
        >
          Forkast
        </Link>
        <div className="flex items-center gap-2 overflow-x-auto">
          {links.map(l => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  'px-3 py-1 rounded text-sm whitespace-nowrap transition-colors font-serif ' +
                  (active
                    ? 'bg-cookbook-terracotta/10 text-cookbook-terracotta font-medium underline decoration-wavy underline-offset-4 decoration-[1px]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                }
              >
                {l.label}
              </Link>
            );
          })}

          {/* Profile/Login Icon */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Profile menu"
                  data-testid="profile-menu-button"
                >
                  <User className="w-5 h-5 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="cursor-pointer"
                    data-testid="profile-link"
                  >
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer">
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/account/staples"
                    className="cursor-pointer"
                    data-testid="manage-staples-link"
                  >
                    Manage Staples
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a
                    href="mailto:developer@example.com?subject=Forkast%20Issue%20Report"
                    className="cursor-pointer"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="report-issue-link"
                  >
                    Report an Issue
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  data-testid="logout-button"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 px-3 py-1 rounded-md text-sm whitespace-nowrap transition-colors text-foreground hover:bg-muted"
              data-testid="login-link"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
