"use client";

import { useState, useEffect, FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/auth";

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
}

export default function ProfileManagement() {
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      setError("Error loading profile");
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("profiles")
      .update({ 
        full_name: fullName,
        updated_at: new Date().toISOString() 
      })
      .eq("id", user.id);

    if (error) {
      setError("Error updating profile");
      console.error("Error updating profile:", error);
    } else {
      setMessage("Profile updated successfully");
    }
    setLoading(false);
  };

  if (!user) {
    return <div>Please log in to manage your profile</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="w-full px-3 py-2 border rounded bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
