
import { initializeApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

// TODO: REPLACE WITH YOUR FIREBASE PROJECT CONFIG
export const firebaseConfig = {
  apiKey: "AIzaSyDw_UwsRfVNScgdMedMTgaq22cyae70BCw",
    authDomain: "hall-dues.firebaseapp.com",
    projectId: "hall-dues",
    storageBucket: "hall-dues.firebasestorage.app",
    messagingSenderId: "478226123260",
    appId: "1:478226123260:web:535c4ee92a4fc7c1aa4a79",
    measurementId: "G-LS3YXR62D2"
};

const app = initializeApp(firebaseConfig);
export const auth = firebaseAuth.getAuth(app);

// Initialize Firestore with offline persistence enabled
// This prevents "Backend didn't respond within 10 seconds" errors by serving local data immediately
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});