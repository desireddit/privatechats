// src/app/actions.ts

"use server";

import { auth, db } from "@/lib/firebase-admin";
import { collection, doc, getDocs, query, setDoc, where, FieldValue } from "firebase-admin/firestore";
import { getUserSession } from "@/lib/session"; // ✅ Import our new secure helper

// --- USER CREATION & ADMIN LOGIN ---
// (The createUser and signInAdmin functions remain the same)

export async function createUser(params: { name: string; redditUsername: string; password: string; }) {
  const { name, redditUsername, password } = params;

  if (!name || !redditUsername || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("redditUsername", "==", redditUsername));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { error: "This Reddit username is already taken." };
    }

    const userRecord = await auth.createUser({
      email: `${redditUsername}@privatechats.local`,
      password: password,
      displayName: name,
    });

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
    const message = error.code === 'auth/email-already-exists' 
      ? "This Reddit username is already taken."
      : "Failed to create account. Please try again.";
    return { error: message };
  }
}

export async function signInAdmin(params: { username?: string; password?: string; }) {
  const { username, password } = params;

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "desireddit4us";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Venky@1322Private";

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return { error: "Invalid username or password." };
  }

  try {
    const adminUID = "admin_user_main";
    const customToken = await auth.createCustomToken(adminUID, { admin: true });
    return { token: customToken };
  } catch (error: any) {
    console.error("Error creating admin custom token:", error);
    return { error: "Server error during authentication." };
  }
}

// --- USER MANAGEMENT ---

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
        createdAt: data.createdAt,
      };
    });
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// --- VERIFICATION ---

// ✅ This function is now fully SECURE
export async function generateVerificationId() {
  const session = await getUserSession();
  
  if (!session) {
    return { error: "You must be logged in to perform this action." };
  }

  try {
    const uniqueId = `ID-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const userDocRef = doc(db, "users", session.uid);
    await setDoc(userDocRef, { 
      uniqueId: uniqueId,
      uniqueIdCreatedAt: FieldValue.serverTimestamp(),
     }, { merge: true });

    return { uniqueId };
  } catch (error) {
    console.error("Error generating verification ID:", error);
    return { error: "A server error occurred. Please try again." };
  }
}