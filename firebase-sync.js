import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  collection,
  doc,
  setDoc,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// Firebase's web config is meant to be public — access is controlled by the
// Firestore security rules (see setup guide), not by hiding these values.
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// persistentLocalCache gives offline reads/writes for free: writes made
// offline queue in IndexedDB and flush automatically once back online.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
});

let readyResolve;
let readyReject;
const ready = new Promise((resolve, reject) => {
  readyResolve = resolve;
  readyReject = reject;
});
onAuthStateChanged(auth, (user) => {
  if (user) readyResolve(user);
});
signInAnonymously(auth).catch((err) => readyReject(err));

export async function logEntryRemote(spaceId, entry) {
  await ready;
  await setDoc(doc(db, 'spaces', spaceId, 'entries', entry.id), entry);
}

export async function setWorkoutRemote(spaceId, date, workout) {
  await ready;
  await setDoc(doc(db, 'spaces', spaceId, 'days', date), { workout });
}

// Anonymous auth gives every device its own identity, so two devices share
// data by both pointing at the same spaceId rather than by shared login.
export function subscribeToSpace(spaceId, onChange) {
  const unsubEntries = onSnapshot(
    collection(db, 'spaces', spaceId, 'entries'),
    (snap) => onChange('entries', snap.docs.map((d) => d.data())),
    (err) => console.error('Entries subscription failed', err)
  );
  const unsubDays = onSnapshot(
    collection(db, 'spaces', spaceId, 'days'),
    (snap) => onChange('days', snap.docs.map((d) => ({ date: d.id, ...d.data() }))),
    (err) => console.error('Days subscription failed', err)
  );
  return () => {
    unsubEntries();
    unsubDays();
  };
}
