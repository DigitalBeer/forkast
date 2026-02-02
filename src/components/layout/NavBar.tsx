"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, LogIn } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/plan", label: "Plan" },
  { href: "/planner", label: "Planner" },
  { href: "/meal-plans/history", label: "Saved Plans" },
  { href: "/meals", label: "Meals" },
  { href: "/meals/new", label: "New Meal" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  
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
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-gray-900">BMAD Meal Planner</Link>
        <div className="flex items-center gap-2 overflow-x-auto">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "px-3 py-1 rounded-md text-sm whitespace-nowrap transition-colors " +
                  (active
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100")
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
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Profile menu"
                  data-testid="profile-menu-button"
                >
                  <User className="w-5 h-5 text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer" data-testid="profile-link">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer">
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/staples" className="cursor-pointer" data-testid="manage-staples-link">
                    Manage Staples
                  </Link>
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
              className="flex items-center gap-1 px-3 py-1 rounded-md text-sm whitespace-nowrap transition-colors text-gray-700 hover:bg-gray-100"
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
