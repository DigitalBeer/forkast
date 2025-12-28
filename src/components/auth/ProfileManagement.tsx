"use client";

import { useState, useEffect, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";
import { Crown, Key, Settings } from "lucide-react";

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Low-Carb",
  "Keto",
  "Paleo",
  "Halal",
  "Kosher",
];


export default function ProfileManagement() {
  const user = useAuthStore((s) => s.user);

  const [fullName, setFullName] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<"free" | "premium">("free");
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [measurementSystem, setMeasurementSystem] = useState<"metric" | "imperial">("metric");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async () => {
    if (!user) return;
    
    setInitialLoading(true);
    const supabase = createClient();
    
    // Fetch profile - if it doesn't exist, create it
    let { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // If no profile row exists, create one
    if (error?.code === 'PGRST116') {
      console.log("No profile found, creating one for user:", user.id);
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || "",
          dietary_preferences: [],
          measurement_system: "metric",
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating profile:", insertError);
      } else {
        data = newProfile;
        error = null;
      }
    } else if (error) {
      console.error("Error fetching profile:", error);
    }
    
    if (data) {
      setFullName(data.full_name || "");
      setSubscriptionStatus(data.subscription_status || "free");
      setDietaryPreferences(data.dietary_preferences || []);
      setMeasurementSystem(data.measurement_system || "metric");
    }
    setInitialLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    
    // Build update object - only include preference fields if they exist in the schema
    const updateData: Record<string, unknown> = {
      full_name: fullName,
      updated_at: new Date().toISOString(),
    };

    // Try to update with all fields
    const fullUpdateData = {
      ...updateData,
      dietary_preferences: dietaryPreferences,
      measurement_system: measurementSystem,
    };
    
    console.log("Attempting profile update with:", fullUpdateData);
    
    const { error, data: updateResult } = await supabase
      .from("profiles")
      .update(fullUpdateData)
      .eq("id", user.id)
      .select();

    console.log("Update result:", { error, updateResult });

    if (error) {
      // Check if it's a column error (migration not applied)
      const isColumnError = (
        error.code === '42703' || 
        error.code === 'PGRST204' ||
        error.message?.includes('dietary_preferences') ||
        error.message?.includes('measurement_system') ||
        error.message?.includes('column')
      );
      
      if (isColumnError) {
        console.warn("Preference columns not found, updating name only:", error.message);
        const result = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id)
          .select();
        
        if (result.error) {
          setError("Error updating profile");
          console.error("Error updating profile:", result.error);
        } else {
          setMessage("Profile updated (preferences require DB migration)");
        }
      } else {
        setError("Error updating profile");
        console.error("Error updating profile:", error);
      }
    } else {
      setMessage("Profile updated successfully");
    }
    setLoading(false);
  };

  const toggleDietaryPreference = (pref: string) => {
    setDietaryPreferences((prev) =>
      prev.includes(pref)
        ? prev.filter((p) => p !== pref)
        : [...prev, pref]
    );
  };

  if (!user) {
    return <div>Please log in to manage your profile</div>;
  }

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      {/* Subscription Status Card */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${subscriptionStatus === "premium" ? "bg-yellow-100" : "bg-gray-100"}`}>
              <Crown className={`w-5 h-5 ${subscriptionStatus === "premium" ? "text-yellow-600" : "text-gray-400"}`} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {subscriptionStatus === "premium" ? "Premium Plan" : "Free Plan"}
              </h2>
              <p className="text-sm text-gray-600">
                {subscriptionStatus === "premium" ? "Unlimited meals" : "Limited to 42 meals"}
              </p>
            </div>
          </div>
          <Link
            href="/account"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            data-testid="manage-subscription-link"
          >
            Manage Subscription
          </Link>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border p-4 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-500"
            data-testid="profile-email"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>
        
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Display Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your name"
            data-testid="profile-fullname"
          />
        </div>

        {/* Preferences Section */}
        <div className="border-t pt-4">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Preferences</h3>
          
          {/* Dietary Preferences */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Dietary Preferences</label>
            <div className="flex flex-wrap gap-2" data-testid="dietary-preferences">
              {DIETARY_OPTIONS.map((pref) => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => toggleDietaryPreference(pref)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    dietaryPreferences.includes(pref)
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                  data-testid={`dietary-${pref.toLowerCase().replace(/[^a-z]/g, "-")}`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          {/* Measurement System */}
          <div>
            <label className="block text-sm font-medium mb-2">Measurement System</label>
            <div className="flex gap-4" data-testid="measurement-system">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="measurementSystem"
                  value="metric"
                  checked={measurementSystem === "metric"}
                  onChange={() => setMeasurementSystem("metric")}
                  className="w-4 h-4 text-blue-600"
                  data-testid="measurement-metric"
                />
                <span className="text-sm">Metric (g, kg, ml, L)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="measurementSystem"
                  value="imperial"
                  checked={measurementSystem === "imperial"}
                  onChange={() => setMeasurementSystem("imperial")}
                  className="w-4 h-4 text-blue-600"
                  data-testid="measurement-imperial"
                />
                <span className="text-sm">Imperial (oz, lb, cups)</span>
              </label>
            </div>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm" data-testid="profile-error">{error}</p>}
        {message && <p className="text-green-600 text-sm" data-testid="profile-success">{message}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          data-testid="save-profile-button"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Change Password Link */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Key className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Password</h2>
              <p className="text-sm text-gray-600">Update your password</p>
            </div>
          </div>
          <Link
            href="/reset-password"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            data-testid="change-password-link"
          >
            Change Password
          </Link>
        </div>
      </div>
    </div>
  );
}
