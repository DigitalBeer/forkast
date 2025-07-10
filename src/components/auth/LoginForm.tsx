"use client";

import { FormEvent, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message === "Invalid login credentials") {
        setError("Invalid email or password. If you just signed up, please check your email for a confirmation link.");
      } else {
        setError(error.message);
      }
    } else {
      setUser(data.user ?? null);
      router.push("/");
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
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}
