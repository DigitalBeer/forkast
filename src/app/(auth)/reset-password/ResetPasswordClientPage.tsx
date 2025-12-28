"use client";

import { useEffect, useState } from "react";

import PasswordResetForm from "@/components/auth/PasswordResetForm";
import { useSearchParams } from "next/navigation";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";
import { createClient } from "@/lib/supabase/client";


export default function ResetPasswordClientPage() {
  const [isUpdateForm, setIsUpdateForm] = useState(false);
  const searchParams = useSearchParams();


  useEffect(() => {
    const supabase = createClient();

    // If redirected with ?type=recovery or code param, show update form immediately
    const urlType = searchParams.get("type");
    const code = searchParams.get("code");
    const accessToken = searchParams.get("access_token");
    const hash = typeof window !== "undefined" ? window.location.hash : null;

    if (
      urlType === "recovery" ||
      code ||
      accessToken ||
      (hash && hash.includes("type=recovery"))
    ) {
      setIsUpdateForm(true);
    }

    // If the user already has a valid session after redirect, show update form
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsUpdateForm(true);
      }
    });

    // Also listen for PASSWORD_RECOVERY or SIGNED_IN events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setIsUpdateForm(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {isUpdateForm ? "Update Your Password" : "Reset Your Password"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isUpdateForm
              ? "Enter your new password below."
              : "Enter your email to receive a password reset link."}
          </p>
        </div>
        {isUpdateForm ? <UpdatePasswordForm /> : <PasswordResetForm />}
        {!isUpdateForm && (
          <div className="text-center text-sm">
            <p>
              Remember your password?{' '}
              <a href="/login" className="text-blue-600 hover:underline">
                Log in
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
