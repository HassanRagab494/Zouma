import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBiypWAyKNuD-ND2D6RmeHp_UUV0VTbxRM",
  authDomain: "test-avc-6b9c5.firebaseapp.com",
  projectId: "test-avc-6b9c5",
  storageBucket: "test-avc-6b9c5.firebasestorage.app",
  messagingSenderId: "790981327074",
  appId: "1:790981327074:web:e7e7a9fccd6b7fc34fc6bb",
  measurementId: "G-KLJTDTQ4F7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
