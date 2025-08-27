// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "desireddit",
  "appId": "1:734271889213:web:699026f034fcfaab98af54",
  "storageBucket": "desireddit.firebasestorage.app",
  "apiKey": "AIzaSyAe56pGTQf0kJK81FVG-XBeCA9o-W2dLGA",
  "authDomain": "desireddit.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "734271889213"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };