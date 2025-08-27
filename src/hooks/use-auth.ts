// src/hooks/use-auth.ts

"use client";

import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Assumes you have a client-side firebase config

// Define the shape of our extended user object
interface User extends FirebaseUser {
  status?: 'pending' | 'verified' | 'blocked';
  name?: string;
  redditUsername?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, now get their profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot for real-time updates to user status
        const unsubFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              ...firebaseUser,
              status: userData.status,
              name: userData.name,
              redditUsername: userData.redditUsername,
            });
          } else {
            // Firestore doc doesn't exist, but user is authenticated.
            // This might be a temporary state or an error.
            setUser(firebaseUser);
          }
          setLoading(false);
        });

        return () => unsubFirestore(); // Cleanup Firestore listener
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup auth listener
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);