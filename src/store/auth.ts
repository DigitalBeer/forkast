"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type User } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (u: User | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      error: null,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      logout: () => set({ user: null }),
    }),
    {
      name: "auth-state",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
