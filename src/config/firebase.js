// config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAaSUQ1PNfeYl99SFK_TmNBbndD8sz-u_s",
  authDomain: "filadireta.firebaseapp.com",
  projectId: "filadireta",
  storageBucket: "filadireta.appspot.com",
  messagingSenderId: "128273240752",
  appId: "1:128273240752:web:f8945e72d4bff23cb6e175"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };