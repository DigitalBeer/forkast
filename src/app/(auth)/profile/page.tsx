"use client";

import ProfileManagement from "@/components/auth/ProfileManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <ProfileManagement />
      </div>
    </ProtectedRoute>
  );
}
