// src/lib/firebase-admin.ts

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// IMPORTANT: You need to generate a private key file for your service account
// in the Firebase console and set it as an environment variable.

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = getFirestore();
const auth = getAuth();

export { db, auth };