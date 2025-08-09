// Authentication module
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { auth, db } from './firebase-config.js';

// Global auth state
let currentUser = null;

// Initialize authentication
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        updateAuthUI(user);
        updateNavigationAuth(user);
        
        if (user) {
            console.log('User signed in:', user.email);
            // Update user data in Firestore
            updateUserData(user);
        } else {
            console.log('User signed out');
        }
    });
    
    // Initialize auth page if we're on it
    if (window.location.pathname.includes('auth.html')) {
        initAuthPage();
    }
}

function updateAuthUI(user) {
    const authLinks = document.getElementById('authLinks');
    if (!authLinks) return;
    
    if (user) {
        // User is signed in
        authLinks.innerHTML = `
            <div class="user-menu">
                <span class="user-name">${user.displayName || user.email}</span>
                <button class="btn-secondary" onclick="signOutUser()">
                    <i class="fas fa-sign-out-alt"></i>
                    Sign Out
                </button>
            </div>
        `;
    } else {
        // User is signed out
        authLinks.innerHTML = `
            <a href="auth.html" class="nav-link">Login</a>
        `;
    }
}

function updateNavigationAuth(user) {
    // Update cart link behavior based on auth state
    const cartLink = document.querySelector('.cart-link');
    if (cartLink && !user) {
        cartLink.addEventListener('click', function(e) {
            e.preventDefault();
            showMessage('Please sign in to view your cart', 'error');
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 1000);
        });
    }
}

function initAuthPage() {
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const googleSignInBtn = document.getElementById('googleSignIn');
    const googleSignUpBtn = document.getElementById('googleSignUp');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Form switching
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showRegisterForm();
        });
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    // Form submissions
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Google sign in
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    if (googleSignUpBtn) {
        googleSignUpBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOutUser);
    }
    
    // Show appropriate form based on auth state
    updateAuthPageUI();
}

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
}

function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
}

function updateAuthPageUI() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const userProfile = document.getElementById('userProfile');
    
    if (currentUser) {
        // Show user profile
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'block';
            updateUserProfile(currentUser);
        }
    } else {
        // Show login form
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (userProfile) userProfile.style.display = 'none';
    }
}

function updateUserProfile(user) {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const profileEmail = document.getElementById('profileEmail');
    const memberSince = document.getElementById('memberSince');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userName) userName.textContent = user.displayName || 'User';
    if (userEmail) userEmail.textContent = user.email;
    if (profileEmail) profileEmail.textContent = user.email;
    if (memberSince) memberSince.textContent = formatDate(user.metadata.creationTime);
    if (userAvatar && user.photoURL) userAvatar.src = user.photoURL;
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (!validatePassword(password)) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage('Welcome back! Successfully signed in.');
        
        // Redirect to intended page or home
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (!firstName || !lastName) {
        showMessage('Please enter your first and last name', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (!validatePassword(password)) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showMessage('Please agree to the terms of service', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user profile
        await updateProfile(user, {
            displayName: `${firstName} ${lastName}`
        });
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            firstName,
            lastName,
            email,
            createdAt: serverTimestamp(),
            cart: []
        });
        
        showMessage('Account created successfully! Welcome to our store.');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Registration error:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

async function handleGoogleSignIn() {
    showLoading(true);
    
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Create or update user document
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                firstName: user.displayName?.split(' ')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                email: user.email,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                cart: []
            });
        }
        
        showMessage('Successfully signed in with Google!');
        
        // Redirect to intended page or home
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1000);
        
    } catch (error) {
        console.error('Google sign in error:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

async function signOutUser() {
    showLoading(true);
    
    try {
        await signOut(auth);
        showMessage('Successfully signed out');
        
        // Clear local cart data
        localStorage.removeItem('cart');
        updateCartCount();
        
        // Redirect to home
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Sign out error:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

async function updateUserData(user) {
    if (!user) return;
    
    try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            // Create user document if it doesn't exist
            await setDoc(userRef, {
                firstName: user.displayName?.split(' ')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                email: user.email,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                cart: []
            });
        } else {
            // Update last login time
            await setDoc(userRef, {
                lastLogin: serverTimestamp()
            }, { merge: true });
        }
    } catch (error) {
        console.error('Error updating user data:', error);
    }
}

function handleAuthError(error) {
    let message = 'An error occurred. Please try again.';
    
    switch (error.code) {
        case 'auth/user-not-found':
            message = 'No account found with this email address.';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password. Please try again.';
            break;
        case 'auth/email-already-in-use':
            message = 'An account with this email address already exists.';
            break;
        case 'auth/weak-password':
            message = 'Password is too weak. Please choose a stronger password.';
            break;
        case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
        case 'auth/too-many-requests':
            message = 'Too many failed attempts. Please try again later.';
            break;
        case 'auth/popup-closed-by-user':
            message = 'Sign in was cancelled.';
            break;
        default:
            console.error('Auth error:', error);
    }
    
    showMessage(message, 'error');
}

// Check if user is authenticated
function requireAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                reject(new Error('Authentication required'));
            }
        });
    });
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Export functions for global use
window.signOutUser = signOutUser;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;

// Make auth functions available globally
window.authUtils = {
    getCurrentUser,
    requireAuth,
    signOutUser
};
