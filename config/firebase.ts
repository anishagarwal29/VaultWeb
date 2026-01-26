import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// REPLACE THIS OBJECT WITH YOUR ACTUAL KEYS FROM FIREBASE CONSOLE
// Go to Project Settings -> General -> "Your apps" section -> "SDK setup and configuration" -> Config
const firebaseConfig = {
    apiKey: "AIzaSyDl_a6heAUfNp_mBp4LdLgp5Cu2ApCe4Ng",
    authDomain: "vaultweb-c6752.firebaseapp.com",
    projectId: "vaultweb-c6752",
    storageBucket: "vaultweb-c6752.firebasestorage.app",
    messagingSenderId: "553471579587",
    appId: "1:553471579587:web:910bcad9da400bdac9d976",
    measurementId: "G-ZDWS9XXF6X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
