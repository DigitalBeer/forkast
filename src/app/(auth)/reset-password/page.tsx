import ResetPasswordClientPage from './ResetPasswordClientPage';

export const metadata = {
  title: 'Reset Password | Forkast',
};

// This page uses useSearchParams() in its client component — cannot be prerendered
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return <ResetPasswordClientPage />;
}
