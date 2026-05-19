'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { StaplesManager } from '@/components/plan/StaplesManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaperPage } from '@/components/layout/PaperPage';

export default function ManageStaplesPage() {
  return (
    <PaperPage>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Account
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Manage Pantry Staples</h1>
          <p className="mt-2 text-gray-600">
            Select ingredients you always have on hand. These will be automatically marked as &quot;Already Have&quot; in your shopping lists.
          </p>
        </div>

        {/* Staples Manager */}
        <Card>
          <CardHeader>
            <CardTitle>Your Staples</CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              Customize your pantry staples to streamline your shopping experience.
            </p>
          </CardHeader>
          <CardContent>
            <StaplesManager />
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">How Staples Work</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Staples are ingredients you always have on hand (salt, pepper, oil, etc.)</li>
            <li>• When generating a shopping list, staples are automatically marked as &quot;Already Have&quot;</li>
            <li>• You can customize your staples based on your cooking preferences</li>
            <li>• Your staples are saved to your account and sync across devices</li>
            <li>• You can still mark staple items as &quot;Need to Buy&quot; if you run out</li>
          </ul>
        </div>
      </div>
    </PaperPage>
  );
}
