
import { initializeApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore
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
const { getAuth } = firebaseAuth as any;

export const auth = getAuth(app);

// Initialize Firestore with fallback
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (err) {
  console.warn("Firestore persistence failed (likely incognito or restricted environment). Falling back to default memory cache.", err);
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
