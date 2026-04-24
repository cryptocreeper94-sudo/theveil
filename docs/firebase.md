# DarkWave Ecosystem - Firebase Authentication

This document contains the shared Firebase configuration and integration instructions for all DarkWave ecosystem applications.

## Firebase Project Details

- **Project Name**: DarkWave Auth
- **Project ID**: darkwave-auth
- **Auth Domain**: darkwave-auth.firebaseapp.com

## Firebase Configuration

Use this configuration in all DarkWave ecosystem apps:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyByHm_Zwo9NGZ3DyHtZ5_wCtHlLXcat23Q",
  authDomain: "darkwave-auth.firebaseapp.com",
  projectId: "darkwave-auth",
  storageBucket: "darkwave-auth.firebasestorage.app",
  messagingSenderId: "413074061912",
  appId: "1:413074061912:web:b70884d2e91d9a922a55a5",
  measurementId: "G-EL9LT61B28"
};
```

## Installation

### Web (React/Next.js/Vue)

```bash
npm install firebase
```

### React Native

```bash
npm install @react-native-firebase/app @react-native-firebase/auth
```

### Flutter

```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^latest
  firebase_auth: ^latest
```

## Integration Instructions

### Step 1: Initialize Firebase

```javascript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

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
```

### Step 2: Google Sign-In

```javascript
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log("Signed in:", user.displayName, user.email);
    return user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}
```

### Step 3: GitHub Sign-In

```javascript
import { signInWithPopup } from "firebase/auth";
import { auth, githubProvider } from "./firebase";

async function signInWithGitHub() {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;
    console.log("Signed in:", user.displayName, user.email);
    return user;
  } catch (error) {
    console.error("GitHub sign-in error:", error);
    throw error;
  }
}
```

### Step 4: Auth State Listener

```javascript
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User:", user.uid, user.email);
  } else {
    // User is signed out
    console.log("No user signed in");
  }
});
```

### Step 5: Sign Out

```javascript
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

async function handleSignOut() {
  await signOut(auth);
}
```

## React Native Specifics

For React Native, use `@react-native-firebase` packages:

```javascript
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '413074061912-xxxxx.apps.googleusercontent.com', // Get from Firebase Console
});

async function signInWithGoogle() {
  const { idToken } = await GoogleSignin.signIn();
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  return auth().signInWithCredential(googleCredential);
}
```

## Authorized Domains

The following domains are authorized in Firebase Console:

- darkwavechain.io
- localhost
- darkwave-auth.firebaseapp.com

Add any new app domains to Firebase Console → Authentication → Settings → Authorized domains.

## User Data Structure

Firebase Auth provides the following user properties:

```typescript
interface FirebaseUser {
  uid: string;           // Unique user ID (use this as primary key)
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerId: string;    // "google.com" or "github.com"
}
```

## Syncing with Backend

After Firebase authentication, sync the user with your backend:

```javascript
async function syncUserWithBackend(user) {
  const idToken = await user.getIdToken();
  
  await fetch('/api/auth/firebase-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      firebaseUid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      provider: user.providerData[0]?.providerId
    })
  });
}
```

## Security Notes

- The Firebase client config (apiKey, appId, etc.) is **safe to expose** in client-side code
- Firebase security is managed through Firebase Security Rules, not by hiding the config
- Always validate user tokens on your backend using Firebase Admin SDK
- Never expose Firebase Admin credentials in client code

## Support

For issues with Firebase authentication across DarkWave ecosystem apps, contact DarkWave Studios.
