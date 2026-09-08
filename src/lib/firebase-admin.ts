import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export const adminApp =
  getApps().length === 0
    ? initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "libreria-itineranteymas",
      })
    : getApps()[0];

export const adminAuth = getAuth(adminApp);
