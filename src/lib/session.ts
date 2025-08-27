// src/lib/session.ts

import { cookies } from "next/headers";
import { auth } from "./firebase-admin";
import { UserProfile } from "@/hooks/use-auth";

// This function securely gets the user's session from the cookie.
export async function getUserSession(): Promise<UserProfile | null> {
  const sessionCookie = cookies().get("__session")?.value;
  if (!sessionCookie) {
    return null;
  }
  
  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    // You can add more profile data here if needed in server actions
    return { uid: decodedToken.uid }; 
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}