// Firebase client config — these NEXT_PUBLIC_ keys are safe to ship in client code.
// If env vars are set (e.g. on Vercel), they take precedence; otherwise fall back to
// the hardcoded values so the app works on any deployment without extra setup.
export const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "AIzaSyCdkF0moTUiUCVrYJCDl1qmRFKU2gr7hCk",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "balatasan-1.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "balatasan-1",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "balatasan-1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "970323798751",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? "1:970323798751:web:a6df5f317c961dcafd576a",
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     ?? "G-LE5QYZMXMC",
};
