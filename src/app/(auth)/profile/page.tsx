"use client";

import ProfileManagement from "@/components/auth/ProfileManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PaperPage } from "@/components/layout/PaperPage";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <PaperPage>
        <ProfileManagement />
      </PaperPage>
    </ProtectedRoute>
  );
}
