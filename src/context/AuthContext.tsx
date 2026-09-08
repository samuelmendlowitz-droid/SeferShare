import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type ConfirmationResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import type { User } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: User | null;
  loading: boolean;
  redirectError: string | null;
  /** Set when firebaseUser exists but loading its Firestore profile failed — never
   *  silently let someone into the app with a signed-in-looking but blank/broken state. */
  profileError: string | null;
  retryProfile: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  startPhoneSignIn: (phoneNumber: string, recaptchaContainerId: string) => Promise<ConfirmationResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function ensureUserProfile(firebaseUser: FirebaseUser): Promise<User> {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as User;
  }
  const profile: User = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName ?? '',
    email: firebaseUser.email ?? '',
    // Firestore rejects literal `undefined` field values — omit `phone` entirely
    // rather than setting it to undefined when the provider didn't supply one
    // (Google/email sign-in never do).
    ...(firebaseUser.phoneNumber ? { phone: firebaseUser.phoneNumber } : {}),
    preferredLanguage: 'en',
    isVendor: false,
    vendorApproved: false,
    savedPaymentMethods: [],
    createdAt: Date.now(),
  };
  await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  async function loadProfile(fbUser: FirebaseUser) {
    try {
      const p = await ensureUserProfile(fbUser);
      setProfile(p);
      setProfileError(null);
    } catch (err) {
      // A signed-in Firebase user with no loadable Firestore profile must never be
      // treated as "in" — RequireAuth checks profileError to block that half-signed-in,
      // blank-looking state instead of showing empty personal info silently.
      setProfile(null);
      setProfileError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    // Surfaces errors from the signInWithRedirect round-trip (e.g. stale pending-auth
    // state left over from a previous failed attempt) instead of leaving the UI stuck
    // silently on the loading state — onAuthStateChanged alone doesn't report these.
    getRedirectResult(auth).catch((err) => {
      setRedirectError(err instanceof Error ? err.message : String(err));
    });

    // Safety net: never let the app hang on the loading spinner forever if auth
    // state resolution stalls for any reason.
    const stuckTimer = setTimeout(() => setLoading(false), 8000);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      clearTimeout(stuckTimer);
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadProfile(fbUser);
      } else {
        setProfile(null);
        setProfileError(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(stuckTimer);
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      loading,
      redirectError,
      profileError,
      retryProfile() {
        if (firebaseUser) void loadProfile(firebaseUser);
      },
      async signInWithGoogle() {
        // Popup sign-in depends on sessionStorage syncing between the popup and
        // opener window, which many browsers now block by default (Chrome storage
        // partitioning, Safari ITP, Brave shields) — redirect avoids that entirely.
        await signInWithRedirect(auth, new GoogleAuthProvider());
      },
      async signInWithEmail(email, password) {
        await signInWithEmailAndPassword(auth, email, password);
      },
      async registerWithEmail(email, password, displayName) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          displayName,
          email,
          preferredLanguage: 'en',
          isVendor: false,
          vendorApproved: false,
          savedPaymentMethods: [],
          createdAt: serverTimestamp(),
        });
      },
      async startPhoneSignIn(phoneNumber, recaptchaContainerId) {
        const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
        return signInWithPhoneNumber(auth, phoneNumber, verifier);
      },
      async signOut() {
        await firebaseSignOut(auth);
      },
    }),
    [firebaseUser, profile, loading, redirectError, profileError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
