import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDFtXvgaVv5vDKlrtEluuAopXjUtRgTuqE",
  authDomain: "tiger-fitness-pro-2f047.firebaseapp.com",
  projectId: "tiger-fitness-pro-2f047",
  storageBucket: "tiger-fitness-pro-2f047.firebasestorage.app",
  messagingSenderId: "1018363378380",
  appId: "1:1018363378380:web:0d25be6fb035948a9de069",
  measurementId: "G-N0ZPLT3JXY",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics only in browser (not SSR/tests)
isSupported().then((yes) => { if (yes) getAnalytics(app); });

export default app;
