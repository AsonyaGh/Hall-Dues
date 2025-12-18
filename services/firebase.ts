import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { getFirestore } from "firebase/firestore";

// TODO: REPLACE WITH YOUR FIREBASE PROJECT CONFIG
// 1. Go to console.firebase.google.com
// 2. Create a project
// 3. Register a web app
// 4. Copy the config object below
const firebaseConfig = {
  apiKey: "AIzaSyDw_UwsRfVNScgdMedMTgaq22cyae70BCw",
    authDomain: "hall-dues.firebaseapp.com",
    projectId: "hall-dues",
    storageBucket: "hall-dues.firebasestorage.app",
    messagingSenderId: "478226123260",
    appId: "1:478226123260:web:535c4ee92a4fc7c1aa4a79",
    measurementId: "G-LS3YXR62D2"
};

const app = firebase.initializeApp(firebaseConfig);
export const auth = app.auth();
export const db = getFirestore(app);