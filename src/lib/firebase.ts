import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBqz1_0_jWBmtHr5o3cw77G9swzaV31hVk",
  authDomain: "modulerpazar.firebaseapp.com",
  projectId: "modulerpazar",
  storageBucket: "modulerpazar.firebasestorage.app",
  messagingSenderId: "1066643691849",
  appId: "1:1066643691849:web:73230c8713b4360aa9a298",
  measurementId: "G-KK8YBNMNL7",
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

export default app;
