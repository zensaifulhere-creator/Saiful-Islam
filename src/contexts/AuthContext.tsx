import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isSuperAdminEmail,
  OperationType,
  testFirestoreConnection,
} from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  authError: string | null;
  signingIn: boolean;
  showEntryModal: boolean;
  openLoginModal: () => void;
  dismissLoginModal: () => void;
  signInWithGoogle: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_DISMISS_KEY = 'fariha_entry_login_dismissed';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isPromotedAdmin, setIsPromotedAdmin] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);

  const isSuperAdmin = Boolean(
    user && user.emailVerified && isSuperAdminEmail(user.email)
  );
  const isAdmin = isSuperAdmin || isPromotedAdmin;

  // Boot connection verification
  useEffect(() => {
    void testFirestoreConnection();
  }, []);

  // Upsert visitor profile in /users/{uid} whenever authenticated
  const syncVisitorProfile = useCallback(async (firebaseUser: User) => {
    if (!firebaseUser.email) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    const path = `users/${firebaseUser.uid}`;

    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photoURL: firebaseUser.photoURL || '',
          visitCount: 1,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } else {
        const existingCount = Number(snap.data()?.visitCount || 1);
        await updateDoc(userRef, {
          displayName: firebaseUser.displayName || snap.data()?.displayName || 'Visitor',
          photoURL: firebaseUser.photoURL || snap.data()?.photoURL || '',
          visitCount: existingCount + 1,
          lastLoginAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Visitor profile sync notice:', error);
    }
  }, []);

  useEffect(() => {
    let unsubAdminDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (unsubAdminDoc) {
        unsubAdminDoc();
        unsubAdminDoc = null;
      }

      if (firebaseUser) {
        setShowEntryModal(false);
        void syncVisitorProfile(firebaseUser);

        const adminDocRef = doc(db, 'admins', firebaseUser.uid);
        unsubAdminDoc = onSnapshot(
          adminDocRef,
          (snap) => {
            setIsPromotedAdmin(snap.exists());
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `admins/${firebaseUser.uid}`);
          }
        );
      } else {
        setIsPromotedAdmin(false);
        const alreadyDismissed = sessionStorage.getItem(SESSION_DISMISS_KEY) === '1';
        if (!alreadyDismissed) {
          setShowEntryModal(true);
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubAdminDoc) unsubAdminDoc();
    };
  }, [syncVisitorProfile]);

  const openLoginModal = useCallback(() => {
    setAuthError(null);
    setShowEntryModal(true);
  }, []);

  const dismissLoginModal = useCallback(() => {
    sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
    setShowEntryModal(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setShowEntryModal(false);
      return true;
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message.replace('Firebase: ', '')
          : 'Google sign-in could not be completed.';
      setAuthError(msg);
      return false;
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        isSuperAdmin,
        isAdmin,
        authError,
        signingIn,
        showEntryModal,
        openLoginModal,
        dismissLoginModal,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
