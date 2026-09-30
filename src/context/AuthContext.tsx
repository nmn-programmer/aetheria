import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut, 
  updateProfile, 
  onAuthStateChanged,
  User 
} from '../firebase/firebase';
import { AuthUser } from '../types/breathwork';
import { cloudSync } from '../services/cloudSyncService';
import { saveSettings, saveCustomTechniques } from '../utils/storage';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  migrationMessage: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  clearAuthError: () => void;
  clearMigrationMessage: () => void;
}

const GUEST_KEY = 'aetheria_guest_mode_active';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ 
  children: ReactNode;
  onCloudDataPulled?: (data: { settings?: any; customTechniques?: any; stats?: any }) => void;
}> = ({ children, onCloudDataPulled }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Practitioner'),
          photoURL: firebaseUser.photoURL,
          isGuest: false,
          providerId: firebaseUser.providerData?.[0]?.providerId || 'password',
        };

        setUser(authUser);
        cloudSync.setUser(authUser);
        localStorage.removeItem(GUEST_KEY);

        // Pull latest cloud data
        const cloudData = await cloudSync.pullUserDataFromCloud(firebaseUser.uid);
        if (cloudData && onCloudDataPulled) {
          onCloudDataPulled(cloudData);
        }
      } else {
        // Check if explicitly marked guest
        const isGuest = localStorage.getItem(GUEST_KEY) === 'true';
        if (isGuest) {
          const guestUser: AuthUser = {
            uid: 'guest_local_user',
            email: null,
            displayName: 'Guest Practitioner',
            photoURL: null,
            isGuest: true,
          };
          setUser(guestUser);
          cloudSync.setUser(null);
        } else {
          // Default to guest if no auth yet
          setUser({
            uid: 'guest_local_user',
            email: null,
            displayName: 'Guest Practitioner',
            photoURL: null,
            isGuest: true,
          });
          cloudSync.setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [onCloudDataPulled]);

  const signInWithGoogle = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const authUser: AuthUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          isGuest: false,
          providerId: 'google.com',
        };
        setUser(authUser);
        cloudSync.setUser(authUser);
        localStorage.removeItem(GUEST_KEY);

        // Migrate any offline guest sessions/custom patterns to cloud
        const { migratedSessions, migratedCustoms } = await cloudSync.migrateGuestDataToCloud(authUser);
        if (migratedSessions > 0 || migratedCustoms > 0) {
          setMigrationMessage(`Merged ${migratedSessions} offline session(s) & custom patterns into your cloud account.`);
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setAuthError('Sign-in was cancelled.');
      } else {
        setAuthError(err.message || 'Unable to sign in with Google. Please try again.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        const authUser: AuthUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || email.split('@')[0],
          photoURL: result.user.photoURL,
          isGuest: false,
          providerId: 'password',
        };
        setUser(authUser);
        cloudSync.setUser(authUser);
        localStorage.removeItem(GUEST_KEY);

        const { migratedSessions } = await cloudSync.migrateGuestDataToCloud(authUser);
        if (migratedSessions > 0) {
          setMigrationMessage(`Synchronized ${migratedSessions} practice records to your cloud profile.`);
        }
      }
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setAuthError('Incorrect email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setAuthError('Too many failed attempts. Please wait a moment.');
      } else {
        setAuthError(err.message || 'Sign in failed. Please check your credentials.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        if (name && name.trim()) {
          try {
            await updateProfile(result.user, { displayName: name.trim() });
          } catch {}
        }

        const authUser: AuthUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: name?.trim() || email.split('@')[0],
          photoURL: null,
          isGuest: false,
          providerId: 'password',
        };
        setUser(authUser);
        cloudSync.setUser(authUser);
        localStorage.removeItem(GUEST_KEY);

        const { migratedSessions, migratedCustoms } = await cloudSync.migrateGuestDataToCloud(authUser);
        if (migratedSessions > 0 || migratedCustoms > 0) {
          setMigrationMessage(`Your existing routines & streak were synced to your new cloud account.`);
        }
      }
    } catch (err: any) {
      console.error('Email Sign-Up Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address.');
      } else {
        setAuthError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    setIsAuthenticating(true);
    try {
      await firebaseSignOut(auth);
      localStorage.setItem(GUEST_KEY, 'true');
      setUser({
        uid: 'guest_local_user',
        email: null,
        displayName: 'Guest Practitioner',
        photoURL: null,
        isGuest: true,
      });
      cloudSync.setUser(null);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const continueAsGuest = () => {
    localStorage.setItem(GUEST_KEY, 'true');
    setUser({
      uid: 'guest_local_user',
      email: null,
      displayName: 'Guest Practitioner',
      photoURL: null,
      isGuest: true,
    });
    cloudSync.setUser(null);
  };

  const clearAuthError = () => setAuthError(null);
  const clearMigrationMessage = () => setMigrationMessage(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticating,
        authError,
        migrationMessage,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        continueAsGuest,
        clearAuthError,
        clearMigrationMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
