// src/app/actions.ts

"use server";

import { auth, db } from "@/lib/firebase-admin"; // We'll create this admin file next
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";

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