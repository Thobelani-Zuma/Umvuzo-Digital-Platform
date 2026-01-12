import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqWgoyaclFLim9axao2WnpHTtf7kOEDxk",
  authDomain: "umvuzo-digital-platform-d90b3.firebaseapp.com",
  projectId: "umvuzo-digital-platform-d90b3",
  storageBucket: "umvuzo-digital-platform-d90b3.firebasestorage.app",
  messagingSenderId: "591256689377",
  appId: "1:591256689377:web:3c849444367b6c36f1f5a0",
  measurementId: "G-L65WG53GC6"
};

// Initialize Firebase for SSG and client side
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };