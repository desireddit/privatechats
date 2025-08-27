// src/hooks/use-auth.ts

"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// This is the new, richer User type we'll use throughout the app
export interface UserProfile {
  uid: string;
  name?: string;
  redditUsername?: string;
  status?: 'pending' | 'verified' | 'blocked';
}

interface AuthContextType {
  user: FirebaseUser | null; // The basic user from Firebase Auth
  userProfile: UserProfile | null; // The detailed profile from Firestore
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // If user is logged in, listen for real-time changes to their profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
        return () => unsubFirestore(); // Cleanup Firestore listener
      } else {
        // User is signed out
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup auth listener
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);