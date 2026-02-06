// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC8mTc2ZECs9ZfGlAoHHUCjV_wHT2jz7xY",
  authDomain: "bssm-meal-alerter.firebaseapp.com",
  projectId: "bssm-meal-alerter",
  storageBucket: "bssm-meal-alerter.firebasestorage.app",
  messagingSenderId: "392151699714",
  appId: "1:392151699714:web:f8084fd2f21a94b725721b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);