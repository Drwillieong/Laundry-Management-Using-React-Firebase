  // Import the functions you need from the SDKs you need
  import { initializeApp } from "firebase/app";
  import { getAnalytics } from "firebase/analytics";
  import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
  import { getFirestore } from "firebase/firestore";

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCxePsJ8QTF4Oe1pYsFK411Wj-0GHL3_dM",
    authDomain: "wash-it-7b11f.firebaseapp.com",
    projectId: "wash-it-7b11f",
    storageBucket: "wash-it-7b11f.appspot.com",
    messagingSenderId: "173336527138",
    appId: "1:173336527138:web:d071370eb9e3169b79257b",
    measurementId: "G-2MLJVSDBRX",
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Export everything you need
  export {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
  };