import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { firebaseUser, loading } = useAuth();
  if (loading) return <div className="mx-auto max-w-2xl px-4 pt-6 text-text-muted">…</div>;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
