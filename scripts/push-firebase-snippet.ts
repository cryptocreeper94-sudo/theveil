const HUB_URL = 'https://orbitstaffing.io';
const API_KEY = process.env.DARKWAVE_CHAIN_HUB_API_KEY || '';
const API_SECRET = process.env.DARKWAVE_CHAIN_HUB_API_SECRET || '';

const firebaseSnippet = {
  name: "Firebase Auth Configuration",
  description: "Shared Firebase authentication setup for all DarkWave ecosystem apps. Includes Google and GitHub sign-in with unified user accounts.",
  language: "typescript",
  category: "authentication",
  tags: ["firebase", "auth", "shared", "google", "github"],
  isPublic: true,
  version: "1.0.0",
  code: `// DarkWave Ecosystem - Firebase Authentication
// All DarkWave apps share this Firebase project for unified user accounts
// INSTALLATION: npm install firebase

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyByHm_Zwo9NGZ3DyHtZ5_wCtHlLXcat23Q",
  authDomain: "darkwave-auth.firebaseapp.com",
  projectId: "darkwave-auth",
  storageBucket: "darkwave-auth.firebasestorage.app",
  messagingSenderId: "413074061912",
  appId: "1:413074061912:web:b70884d2e91d9a922a55a5",
  measurementId: "G-EL9LT61B28"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Google Sign-In
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// GitHub Sign-In
export async function signInWithGitHub() {
  const result = await signInWithPopup(auth, githubProvider);
  return result.user;
}

// Auth State Listener
export function onAuthChange(callback: (user: any) => void) {
  return onAuthStateChanged(auth, callback);
}

// Sign Out
export async function handleSignOut() {
  await signOut(auth);
}

// IMPORTANT:
// - Add your app domain to Firebase Console > Authentication > Authorized domains
// - This config is safe to expose in client code (Firebase security model)
// - All apps using this config share the same user accounts
`
};

async function main() {
  console.log('Pushing Firebase snippet to DarkWave Team Hub...');
  
  if (!API_KEY || !API_SECRET) {
    console.log('Missing: DARKWAVE_CHAIN_HUB_API_KEY or DARKWAVE_CHAIN_HUB_API_SECRET');
    return;
  }

  const response = await fetch(`${HUB_URL}/api/ecosystem/snippets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'x-api-secret': API_SECRET
    },
    body: JSON.stringify(firebaseSnippet)
  });

  const result = await response.json();
  console.log('Response:', response.status, JSON.stringify(result, null, 2));
}

main().catch(console.error);
