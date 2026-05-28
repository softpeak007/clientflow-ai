import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  signOut: () => Promise<void>;
  signInAsDemo: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Initial load: Check if there is an active local demo user
    const localUserVal = localStorage.getItem('demo_user');
    if (localUserVal) {
      try {
        const parsed = JSON.parse(localUserVal);
        setUser(parsed);
        setIsDemoMode(true);
        setLoading(false);
      } catch (err) {
        localStorage.removeItem('demo_user');
      }
    }

    // Always register the onAuthStateChanged listener to catch real Firebase authentication actions
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If a local demo user session is currently stored and active, prioritize it
      if (localStorage.getItem('demo_user')) {
        return;
      }

      if (firebaseUser) {
        setIsDemoMode(false);
        setLoading(true);
        try {
          // Check if user exists in Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            // Check if we registered a temporary signup role during registration to handle listener concurrency
            const pendingRole = localStorage.getItem('pending_signup_role') || 'admin';
            localStorage.removeItem('pending_signup_role');
            
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: pendingRole as UserRole,
              createdAt: new Date().toISOString(),
            };
            
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            } catch (errDoc) {
              console.warn("Failed creating profile document in Firestore database:", errDoc);
            }
            setUser(newUser);
          }
        } catch (err) {
          console.warn("Firestore collection lookup restricted: loading local fallback to prevent interface lockouts", err);
          
          // Secure a local fallback container in environments where Firestore reads are disabled
          const pendingRole = localStorage.getItem('pending_signup_role') || 'admin';
          const fallbackUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: pendingRole as UserRole,
            createdAt: new Date().toISOString(),
          };
          setUser(fallbackUser);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setIsDemoMode(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInAsDemo = (role: UserRole) => {
    const demoUser: User = {
      uid: role === 'admin' ? 'demo-admin-id' : 'demo-client-id',
      email: role === 'admin' ? 'sarah.freelancer@example.com' : 'john.client@example.com',
      displayName: role === 'admin' ? 'Sarah Connor (Freelancer)' : 'John Doe (Acme Corp)',
      role: role,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('demo_user', JSON.stringify(demoUser));
    setIsDemoMode(true);
    setUser(demoUser);
  };

  const signOut = async () => {
    localStorage.removeItem('demo_user');
    localStorage.removeItem('pending_signup_role');
    setIsDemoMode(false);
    setUser(null);
    try {
      await auth.signOut();
    } catch (e) {
      console.warn("Sign out failure:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, signOut, signInAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
