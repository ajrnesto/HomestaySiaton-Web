// imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { getStorage } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";

export const app = initializeApp({
  apiKey: "AIzaSyDYvkV_430JUR8GQ9PlrLZOCEIJbBAGqvk",
  authDomain: "homestay-siaton.firebaseapp.com",
  projectId: "homestay-siaton",
  storageBucket: "homestay-siaton.appspot.com",
  messagingSenderId: "926599309505",
  appId: "1:926599309505:web:2cc61f813ea646c4a54c40",
  measurementId: "G-QHLRMNQWEZ"
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);