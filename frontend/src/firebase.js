import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBW9MfH6vmhTTl2fUmKvY-nEhR_0ZNSuUY",
  authDomain: "rechat-project-d01da.firebaseapp.com",
  projectId: "rechat-project-d01da",
  storageBucket: "rechat-project-d01da.firebasestorage.app",
  messagingSenderId: "740017054258",
  appId: "1:740017054258:web:cc33f7424e79fc9d29922b",
  measurementId: "G-ZEMHFENX12"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();