// Import the functions you need from the SDKs you need
// FIX: Updated imports to use the Firebase v9 compatibility library (compat)
// to support the v8 namespaced API syntax used throughout the application.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqWgoyaclFLim9axao2WnpHTtf7kOEDxk",
  authDomain: "umvuzo-digital-platform-d90b3.firebaseapp.com",
  projectId: "umvuzo-digital-platform-d90b3",
  storageBucket: "umvuzo-digital-platform-d90b3.firebasestorage.app",
  messagingSenderId: "591256689377",
  appId: "1:591256689377:web:3c849444367b6c36f1f5a0",
  measurementId: "G-L65WG53GC6"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
