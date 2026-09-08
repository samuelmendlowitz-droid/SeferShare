import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Button } from './ui/Button';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { firebaseUser, loading, profile, profileError, retryProfile, signOut } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!firebaseUser) return <Navigate to="/login" replace />;

  // A signed-in Firebase user with no loadable account record must never be let
  // into the app looking signed-in with blank data — show a clear retry instead.
  if (!profile) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-semibold">We couldn't load your account</p>
        {profileError && <p className="max-w-sm text-sm text-error">{profileError}</p>}
        <div className="flex gap-2">
          <Button onClick={retryProfile}>Try again</Button>
          <Button variant="secondary" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
