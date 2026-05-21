import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBY8c-h5A3SK_YAOjAerxB6yDTIQ0wy8_0",
  authDomain: "lume-8e60f.firebaseapp.com",
  databaseURL: "https://lume-8e60f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lume-8e60f",
  storageBucket: "lume-8e60f.firebasestorage.app",
  messagingSenderId: "275960822754",
  appId: "1:275960822754:web:8bb29800d87a5fa56f57bb",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
