// Configuration script to make environment variables available globally
(function() {
    // Use injected environment variables from server
    if (window.firebaseEnv) {
        window.firebaseConfig = window.firebaseEnv;
    } else {
        // Fallback config for development
        window.firebaseConfig = {
            VITE_FIREBASE_API_KEY: '',
            VITE_FIREBASE_APP_ID: '',
            VITE_FIREBASE_PROJECT_ID: '',
            VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789'
        };
    }
    
    console.log('Firebase config loaded:', {
        hasApiKey: !!window.firebaseConfig.VITE_FIREBASE_API_KEY,
        hasAppId: !!window.firebaseConfig.VITE_FIREBASE_APP_ID,
        hasProjectId: !!window.firebaseConfig.VITE_FIREBASE_PROJECT_ID
    });
})();