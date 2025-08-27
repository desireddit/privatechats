// src/app/actions.ts

"use server";

import { auth, db } from "@/lib/firebase-admin"; // We'll create this admin file next
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
// Add this new function to src/app/actions.ts
import { cookies } from 'next/headers';
import { getDoc } from "firebase/firestore";
import { getAuth } from "firebase-admin/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where, FieldValue } from "firebase-admin/firestore";
// NOTE: We need a secure way to get the current user's UID on the server.
// We will implement this with session cookies in the next step.
// For now, this is a placeholder to show the logic. We will replace this.
async function getUserIdFromServer(): Promise<string | null> {
    // This part is a placeholder. In the next step, we will replace this
    // with a secure method using session cookies.
    console.warn("getUserIdFromServer is a placeholder and not secure yet.");
    // To make this testable, we'll temporarily return a hardcoded test user ID.
    // Replace 'YOUR_TEST_USER_ID' with a UID from your Firebase Auth users.
    const TEST_USER_ID = "YOUR_TEST_USER_ID"; // IMPORTANT: Replace this for testing.
    return TEST_USER_ID;
}

// ... (keep the other functions: createUser, signInAdmin, getAllUsers)

export async function generateVerificationId() {
  try {
    const sessionCookie = cookies().get('__session')?.value || '';
    if (!sessionCookie) {
      return { error: "You must be logged in to perform this action." };
    }
    
    // Verify the session cookie to get the user's UID
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;
    
    // Generate a simple, readable unique ID
    const uniqueId = `ID-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Update the user's document in Firestore
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return { error: "User profile not found." };
    }

    await setDoc(userDocRef, { uniqueId: uniqueId }, { merge: true });

    // In a real app, you might also create a notification for the admin here.

    return { uniqueId: uniqueId };

  } catch (error: any) {
    console.error("Error generating verification ID:", error);
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/invalid-session-cookie') {
        return { error: "Your session has expired. Please log in again." };
    }
    return { error: "A server error occurred. Please try again later." };
  }
}
// This function creates a new user in Firebase Auth and a corresponding user document in Firestore.
export async function createUser(params: {
  name: string;
  redditUsername: string;
  password: string;
}) {
  const { name, redditUsername, password } = params;

  if (!name || !redditUsername || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 6) {
      return { error: "Password must be at least 6 characters long." };
  }

  try {
    // Check if the redditUsername is already taken in Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("redditUsername", "==", redditUsername));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return { error: "This Reddit username is already taken." };
    }

    // Create user in Firebase Authentication
    // We use a fake email to satisfy Firebase's requirement, which is a standard pattern.
    const userRecord = await auth.createUser({
      email: `${redditUsername}@privatechats.local`,
      password: password,
      displayName: name,
    });

    // Create user document in Firestore
    await setDoc(doc(db, "users", userRecord.uid), {
      name: name,
      redditUsername: redditUsername,
      status: "pending",
      uniqueId: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      activityLog: [],
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating user:", error);
    // Provide a more user-friendly error message
    const message = error.code === 'auth/email-already-exists' 
        ? "This Reddit username is already taken."
        : "Failed to create account. Please try again.";
    return { error: message };
  }
}

// NOTE: The signInUser function requires client-side Firebase.
// This server action is a placeholder. The actual sign-in logic
// will be handled on the client using the Firebase SDK. We will
// implement that in a later step.
export async function signInUser(params: {
  redditUsername: string;
  password: string;
}) {
  // This is a placeholder to show the structure.
  // The actual sign-in will be implemented in the component itself
  // using the client-side Firebase SDK for security.
  console.log("Attempting to sign in user:", params.redditUsername);
  return { success: true };
}

// Add this new function to src/app/actions.ts

// ... (keep the existing createUser function)

export async function signInAdmin(params: {
  username?: string;
  password?: string;
}) {
  const { username, password } = params;

  // These credentials should be stored as environment variables for better security
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "desireddit4us";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Venky@1322Private";

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return { error: "Invalid username or password." };
  }

  try {
    // If credentials are correct, create a custom token with an "admin" claim.
    // This is a secure way to grant admin privileges.
    const adminUID = "admin_user_main"; // A static UID for the admin user
    const customToken = await auth.createCustomToken(adminUID, { admin: true });

    return { token: customToken };
  } catch (error: any) {
    console.error("Error creating admin custom token:", error);
    return { error: "Server error during authentication." };
  }
}

// Add this new function to src/app/actions.ts

// ... (keep the existing createUser and signInAdmin functions)

export async function getAllUsers() {
  try {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        redditUsername: data.redditUsername,
        status: data.status,
        // Ensure createdAt is a string to avoid serialization issues
        createdAt: data.createdAt, 
      };
    });

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    // In a real app, you'd handle this more gracefully
    return []; 
  }
}

export async function generateVerificationId() {
  const uid = await getUserIdFromServer(); // This will be replaced with a secure method
  
  if (!uid) {
    return { error: "You must be logged in to perform this action." };
  }

  try {
    // Generate a simple, readable unique ID
    const uniqueId = `ID-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Update the user's document in Firestore
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, { 
      uniqueId: uniqueId,
      // We can also log when the ID was generated
      uniqueIdCreatedAt: FieldValue.serverTimestamp(),
     }, { merge: true });

    // In a real app, you would also trigger a notification for the admin here.
    return { uniqueId };
  } catch (error) {
    console.error("Error generating verification ID:", error);
    return { error: "A server error occurred. Please try again." };
  }
}