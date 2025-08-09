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
    apiKey: 'AIzaSyAeeW3JmVdK0SD9QfDZxEl3-LnTqysubbM',
    authDomain: 'dnagent-e1ac4.firebaseapp.com',
    projectId: 'dnagent-e1ac4',
    storageBucket: 'dnagent-e1ac4.appspot.com',
    messagingSenderId: '776575401271',
    appId: '1:776575401271:web:0311aa75ed6b035e5caeb2'
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
