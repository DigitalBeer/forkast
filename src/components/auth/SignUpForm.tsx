"use client";

import { FormEvent, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/auth";
import type { AuthState } from "@/store/auth";


export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const setUser = useAuthStore((s: AuthState) => s.setUser);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setUser(data.user ?? null);
      setMessage("Success! Please check your email for a confirmation link.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {message && <p className="text-green-600 text-sm">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Creating..." : "Sign Up"}
      </button>
    </form>
  );
}
