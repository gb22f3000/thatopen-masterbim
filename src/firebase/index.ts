/**
 * Optional Firebase helpers.
 * The app uses localStorage by default so it runs fully offline.
 * Wire these helpers back in when you have a Firebase project configured.
 */
import * as Firestore from 'firebase/firestore'
import { initializeApp, FirebaseApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !String(firebaseConfig.apiKey).includes('wieuy')
)

let app: FirebaseApp | null = null
let firestoreDB: Firestore.Firestore | null = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  firestoreDB = Firestore.getFirestore(app)
}

export { firestoreDB }

export function getCollection<T>(path: string) {
  if (!firestoreDB) {
    throw new Error('Firebase is not configured. Using localStorage instead.')
  }
  return Firestore.collection(
    firestoreDB,
    path
  ) as Firestore.CollectionReference<T>
}

export async function deleteDocument(path: string, id: string) {
  if (!firestoreDB) return
  const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
  await Firestore.deleteDoc(doc)
}

export async function updateDocument<T extends Record<string, any>>(
  path: string,
  id: string,
  data: T
) {
  if (!firestoreDB) return
  const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
  await Firestore.updateDoc(doc, data)
}
