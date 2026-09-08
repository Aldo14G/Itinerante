// La configuracion web de Firebase no es un secreto, pero debe corresponder al
// mismo proyecto definido en .firebaserc. Los valores demo solo sirven con los
// emuladores; produccion debe definir las variables NEXT_PUBLIC_FIREBASE_*.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-itinerante",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "libreria-itineranteymas.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "libreria-itineranteymas",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "libreria-itineranteymas.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:local-emulator",
};
