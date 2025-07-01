// Main JavaScript file for common functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeNavigation();
    updateCartCount();
});

// Theme Management
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    // Theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// Navigation Management
function initializeNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', toggleMobileMenu);

        // Ensure Admin and Login buttons are present in navMenu (for mobile)
        let adminBtn = document.getElementById('adminNavBtn');
        if (!adminBtn) {
            adminBtn = document.createElement('a');
            adminBtn.href = 'admin.html';
            adminBtn.className = 'nav-link';
            adminBtn.id = 'adminNavBtn';
            adminBtn.textContent = 'Admin';
            navMenu.insertBefore(adminBtn, navMenu.querySelector('.auth-links'));
        }

        // Ensure Login button is present
        let authLinks = document.getElementById('authLinks');
        if (!authLinks) {
            authLinks = document.createElement('div');
            authLinks.className = 'auth-links';
            authLinks.id = 'authLinks';
            const loginLink = document.createElement('a');
            loginLink.href = 'auth.html';
            loginLink.className = 'nav-link';
            loginLink.textContent = 'Login';
            authLinks.appendChild(loginLink);
            navMenu.appendChild(authLinks);
        } else if (!authLinks.querySelector('a.nav-link[href="auth.html"]')) {
            const loginLink = document.createElement('a');
            loginLink.href = 'auth.html';
            loginLink.className = 'nav-link';
            loginLink.textContent = 'Login';
            authLinks.appendChild(loginLink);
        }

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
                closeMobileMenu();
            }
        });
    }
}

function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

function closeMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}

// Cart Count Management
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
    const count = getCartItemCount();
    
    cartCountElements.forEach(element => {
        if (element) {
            element.textContent = count;
            element.style.display = count > 0 ? 'flex' : 'none';
        }
    });
}

function getCartItemCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        return cart.reduce((total, item) => total + (item.quantity || 1), 0);
    } catch (error) {
        console.error('Error getting cart count:', error);
        return 0;
    }
}

// Utility Functions
function showMessage(message, type = 'success') {
    const messageToast = document.getElementById('messageToast');
    if (!messageToast) return;
    
    const messageText = document.getElementById('messageText');
    const icon = messageToast.querySelector('i');
    
    if (messageText) messageText.textContent = message;
    
    // Update icon and class based on type
    messageToast.className = `message-toast ${type}`;
    if (icon) {
        icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    }
    
    messageToast.style.display = 'flex';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        messageToast.style.display = 'none';
    }, 5000);
}

function showLoading(show = true) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2
    }).format(price);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

// Form validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Image handling
function handleImageUpload(file, callback) {
    if (!file) {
        callback(null);
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('Image file size should be less than 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.readAsDataURL(file);
}

function createImagePreview(src, container) {
    if (!container) return;
    
    container.innerHTML = '';
    if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.style.maxWidth = '200px';
        img.style.borderRadius = '0.5rem';
        img.style.boxShadow = 'var(--shadow-sm)';
        container.appendChild(img);
    }
}

// Local Storage helpers
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

// Error handling
function handleError(error, userMessage = 'An error occurred') {
    console.error('Error:', error);
    showMessage(userMessage, 'error');
}

// Animation helpers
function animateElement(element, animation = 'fadeInUp') {
    if (!element) return;
    
    element.style.animation = `${animation} 0.5s ease`;
    element.addEventListener('animationend', () => {
        element.style.animation = '';
    }, { once: true });
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add scroll to top button
function addScrollToTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.className = 'scroll-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: var(--shadow);
        display: none;
        z-index: 1000;
        transition: var(--transition);
    `;
    
    button.addEventListener('click', scrollToTop);
    document.body.appendChild(button);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
        } else {
            button.style.display = 'none';
        }
    });
}

// Initialize scroll to top button
document.addEventListener('DOMContentLoaded', addScrollToTopButton);

// Export functions for use in other modules
window.mainUtils = {
    showMessage,
    showLoading,
    formatPrice,
    formatDate,
    validateEmail,
    validatePassword,
    handleImageUpload,
    createImagePreview,
    saveToLocalStorage,
    getFromLocalStorage,
    removeFromLocalStorage,
    handleError,
    animateElement,
    debounce,
    updateCartCount
};
