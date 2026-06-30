import { initializeApp } from './firebase-bundle.js'
import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from './firebase-bundle.js'
import { getFirestore } from './firebase-bundle.js'

const firebaseConfig = {
  apiKey: "AIzaSyCvMs-5LX9Ivk3OkzUR3iz9Kk1E5b9_7Vk",
  authDomain: "delta-rugby-app.firebaseapp.com",
  projectId: "delta-rugby-app",
  storageBucket: "delta-rugby-app.firebasestorage.app",
  messagingSenderId: "61187079762",
  appId: "1:61187079762:web:56cd1eaa8beb9e1a2ee98b"
}

const fbApp = initializeApp(firebaseConfig)
const auth = getAuth(fbApp)
const db = getFirestore(fbApp)

// Auth persistant pour fonctionner hors connexion
try { setPersistence(auth, browserLocalPersistence).catch(() => {}) } catch(e) {}

// Redirection si non authentifié
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'login.html'
  }
})

window.logout = async function() {
  try { await signOut(auth) } catch(e) {}
  window.location.href = 'login.html'
}

export { auth, db }
