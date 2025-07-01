// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Helper function to get environment variables with fallback
function getEnvVar(name, fallback) {
    // Try from global config object injected by server (if you set window.firebaseEnv in your HTML)
    if (typeof window !== 'undefined' && window.firebaseEnv && window.firebaseEnv[name]) {
        return window.firebaseEnv[name];
    }
    // Try from process if available (for Node.js environments)
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
        return process.env[name];
    }
    console.warn(`Environment variable ${name} not found, using fallback`);
    return fallback;
}

// Firebase configuration
const firebaseConfig = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'default-api-key'),
    authDomain: `${getEnvVar('VITE_FIREBASE_PROJECT_ID', 'default-project')}.firebaseapp.com`,
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'default-project'),
    storageBucket: `${getEnvVar('VITE_FIREBASE_PROJECT_ID', 'default-project')}.firebasestorage.app`,
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789'),
    appId: getEnvVar('VITE_FIREBASE_APP_ID', 'default-app-id')
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
    
    // Create mock objects for development
    auth = {
        currentUser: null,
        onAuthStateChanged: () => {},
        signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
        createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
        signOut: () => Promise.reject(new Error('Firebase not configured'))
    };
    
    db = {
        collection: () => ({
            doc: () => ({
                get: () => Promise.reject(new Error('Firebase not configured')),
                set: () => Promise.reject(new Error('Firebase not configured')),
                update: () => Promise.reject(new Error('Firebase not configured')),
                delete: () => Promise.reject(new Error('Firebase not configured'))
            }),
            add: () => Promise.reject(new Error('Firebase not configured')),
            where: () => ({
                get: () => Promise.reject(new Error('Firebase not configured'))
            }),
            orderBy: () => ({
                get: () => Promise.reject(new Error('Firebase not configured'))
            }),
            get: () => Promise.reject(new Error('Firebase not configured'))
        })
    };
    
    storage = {
        ref: () => ({
            put: () => Promise.reject(new Error('Firebase not configured')),
            getDownloadURL: () => Promise.reject(new Error('Firebase not configured'))
        })
    };
}

// Export Firebase instances
export { app, auth, db, storage };

// Global error handler for Firebase
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('Firebase not configured')) {
        console.warn('Firebase operation failed - please configure Firebase environment variables');
        event.preventDefault(); // Prevent the error from being logged to console
    }
});

// Make auth available globally for other scripts
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;
