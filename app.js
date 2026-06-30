import { initializeApp } from './firebase-bundle.js'
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from './firebase-bundle.js'

const firebaseConfig = {
  apiKey: "AIzaSyCvMs-5LX9Ivk3OkzUR3iz9Kk1E5b9_7Vk",
  authDomain: "delta-rugby-app.firebaseapp.com",
  projectId: "delta-rugby-app",
  storageBucket: "delta-rugby-app.firebasestorage.app",
  messagingSenderId: "61187079762",
  appId: "1:61187079762:web:56cd1eaa8beb9e1a2ee98b"
}

const firebaseApp = initializeApp(firebaseConfig)
const auth = getAuth(firebaseApp)

// Forcer localStorage pour que Firebase Auth soit instantané et disponible hors-ligne
try { setPersistence(auth, browserLocalPersistence).catch(() => {}) } catch(e) {}

export async function handleLogin() {
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  const btn = document.getElementById('login-btn')
  const errorMsg = document.getElementById('error-msg')

  if (!email || !password) {
    errorMsg.textContent = 'Remplis tous les champs.'
    return
  }

  btn.disabled = true
  btn.textContent = 'Connexion...'
  errorMsg.textContent = ''

  try {
    await signInWithEmailAndPassword(auth, email, password)
    window.location.href = 'index.html'
  } catch (err) {
    btn.disabled = false
    btn.textContent = 'Se connecter'
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      errorMsg.textContent = 'Email ou mot de passe incorrect.'
    } else if (err.code === 'auth/too-many-requests') {
      errorMsg.textContent = 'Trop de tentatives, réessaie plus tard.'
    } else if (err.code === 'auth/invalid-email') {
      errorMsg.textContent = 'Adresse email invalide.'
    } else {
      errorMsg.textContent = 'Erreur : ' + err.message
    }
  }
}

export { auth }
