// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, onSnapshot, query, where, orderBy, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJebb66L02PmHwzoKvafjBn_r7OLrLhBI",
  authDomain: "monday-pnsa.firebaseapp.com",
  projectId: "monday-pnsa",
  storageBucket: "monday-pnsa.firebasestorage.app",
  messagingSenderId: "109040516883",
  appId: "1:109040516883:web:a79ca1810666e8454964e6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize DB and Storage
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Expose globally to the rest of the Vanilla JS application
window.firebaseDb = db;
window.firebaseStorage = storage;
window.firebaseAuth = auth;
window.googleProvider = provider;
window.signInWithPopup = signInWithPopup;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;

window.doc = doc;
window.getDoc = getDoc;
window.setDoc = setDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.collection = collection;
window.getDocs = getDocs;
window.onSnapshot = onSnapshot;
window.query = query;
window.where = where;
window.orderBy = orderBy;
window.ref = ref;
window.uploadBytes = uploadBytes;
window.getDownloadURL = getDownloadURL;
window.runTransaction = runTransaction;

console.log("✅ Firebase Inicializado e Conectado com Sucesso!");
window.dispatchEvent(new Event('firebaseLoaded'));
