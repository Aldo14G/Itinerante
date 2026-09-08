import { initializeApp, getApps, getApp } from "firebase/app";
import dataConnect from "@/config/data-connect";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { firebaseConfig } from "@/config/firebaseConfig";

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const dc = dataConnect(app);
export const auth = getAuth(app);

export const signInWithGoogle = () => {
  return signInWithPopup(auth, new GoogleAuthProvider());
};

export const signOut = () => {
  return firebaseSignOut(auth);
};
