// Shopping cart functionality
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    arrayUnion,
    arrayRemove 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { db } from './firebase-config.js';

// Global cart state
let cart = [];
let isCartLoaded = false;

// Initialize cart
document.addEventListener('DOMContentLoaded', function() {
    initializeCart();
});

async function initializeCart() {
    await loadCart();
    updateCartDisplay();
    updateCartCount();
    
    // Listen for auth state changes to sync cart
    if (window.firebaseAuth) {
        window.firebaseAuth.onAuthStateChanged(syncCartOnAuthChange);
    }
}

async function loadCart() {
    try {
        const user = getCurrentUser();
        
        if (user) {
            // Load cart from Firestore for authenticated users
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                cart = userData.cart || [];
            }
        } else {
            // Load cart from localStorage for anonymous users
            cart = getFromLocalStorage('cart', []);
        }
        
        isCartLoaded = true;
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = getFromLocalStorage('cart', []);
        isCartLoaded = true;
    }
}

async function saveCart() {
    try {
        const user = getCurrentUser();
        
        if (user) {
            // Save to Firestore for authenticated users
            await updateDoc(doc(db, 'users', user.uid), {
                cart: cart
            });
        } else {
            // Save to localStorage for anonymous users
            saveToLocalStorage('cart', cart);
        }
    } catch (error) {
        console.error('Error saving cart:', error);
        // Fallback to localStorage
        saveToLocalStorage('cart', cart);
    }
}

async function syncCartOnAuthChange(user) {
    if (!isCartLoaded) return;
    
    if (user) {
        // User just signed in - merge local cart with Firestore cart
        const localCart = getFromLocalStorage('cart', []);
        
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            let firestoreCart = [];
            
            if (userDoc.exists()) {
                firestoreCart = userDoc.data().cart || [];
            }
            
            // Merge carts (local cart takes precedence for conflicts)
            const mergedCart = mergeCartItems(localCart, firestoreCart);
            cart = mergedCart;
            
            // Save merged cart to Firestore
            await updateDoc(doc(db, 'users', user.uid), {
                cart: cart
            });
            
            // Clear local storage
            localStorage.removeItem('cart');
            
            updateCartDisplay();
            updateCartCount();
            
        } catch (error) {
            console.error('Error syncing cart:', error);
        }
    } else {
        // User signed out - save current cart to localStorage
        saveToLocalStorage('cart', cart);
    }
}

function mergeCartItems(localCart, firestoreCart) {
    const merged = [...localCart];
    
    firestoreCart.forEach(firestoreItem => {
        const existingIndex = merged.findIndex(item => item.id === firestoreItem.id);
        
        if (existingIndex === -1) {
            // Item doesn't exist in local cart, add it
            merged.push(firestoreItem);
        }
        // If item exists in local cart, keep local version (user preference)
    });
    
    return merged;
}

async function addToCart(product, quantity = 1) {
    try {
        const existingIndex = cart.findIndex(item => item.id === product.id);
        
        if (existingIndex !== -1) {
            // Update quantity if item already exists
            cart[existingIndex].quantity += quantity;
        } else {
            // Add new item to cart
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: quantity
            });
        }
        
        await saveCart();
        updateCartDisplay();
        updateCartCount();
        
        showMessage(`${product.name} added to cart!`);
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Error adding item to cart', 'error');
    }
}

async function removeFromCart(productId) {
    try {
        cart = cart.filter(item => item.id !== productId);
        
        await saveCart();
        updateCartDisplay();
        updateCartCount();
        
        showMessage('Item removed from cart');
        
    } catch (error) {
        console.error('Error removing from cart:', error);
        showMessage('Error removing item from cart', 'error');
    }
}

async function updateCartItemQuantity(productId, quantity) {
    try {
        if (quantity <= 0) {
            await removeFromCart(productId);
            return;
        }
        
        const itemIndex = cart.findIndex(item => item.id === productId);
        if (itemIndex !== -1) {
            cart[itemIndex].quantity = quantity;
            
            await saveCart();
            updateCartDisplay();
            updateCartCount();
        }
        
    } catch (error) {
        console.error('Error updating cart item quantity:', error);
        showMessage('Error updating item quantity', 'error');
    }
}

async function clearCart() {
    try {
        cart = [];
        
        await saveCart();
        updateCartDisplay();
        updateCartCount();
        
        showMessage('Cart cleared');
        
    } catch (error) {
        console.error('Error clearing cart:', error);
        showMessage('Error clearing cart', 'error');
    }
}

function updateCartDisplay() {
    const cartItemsList = document.getElementById('cartItemsList');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTax = document.getElementById('cartTax');
    const cartTotal = document.getElementById('cartTotal');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    
    if (!cartItemsList) return;
    
    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartContent) cartContent.style.display = 'block';
    
    // Render cart items
    cartItemsList.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h3 class="cart-item-title">${item.name}</h3>
                <p class="cart-item-price">${formatPrice(item.price)}</p>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" value="${item.quantity}" min="1" class="quantity-input" 
                               onchange="updateQuantity('${item.id}', parseInt(this.value))">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="remove-btn" onclick="removeCartItem('${item.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;
    
    // Update totals display
    if (cartSubtotal) cartSubtotal.textContent = formatPrice(subtotal);
    if (cartTax) cartTax.textContent = formatPrice(tax);
    if (cartTotal) cartTotal.textContent = formatPrice(total);
    
    // Update shipping display
    const cartShipping = document.getElementById('cartShipping');
    if (cartShipping) {
        cartShipping.textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
    }
}

function loadCartPage() {
    const cartLoading = document.getElementById('cartLoading');
    const authRequired = document.getElementById('authRequired');
    
    // Show loading initially
    if (cartLoading) cartLoading.style.display = 'block';
    
    // Check authentication status
    const user = getCurrentUser();
    
    if (!user) {
        // Show auth required message for guest users
        setTimeout(() => {
            if (cartLoading) cartLoading.style.display = 'none';
            if (authRequired) authRequired.style.display = 'block';
        }, 500);
        return;
    }
    
    // Load cart for authenticated users
    setTimeout(async () => {
        await initializeCart();
        if (cartLoading) cartLoading.style.display = 'none';
        updateCartDisplay();
    }, 500);
    
    // Initialize checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkoutViaWhatsApp);
    }
    
    // Initialize clear cart button
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your cart?')) {
                clearCart();
            }
        });
    }
}

function checkoutViaWhatsApp() {
    if (cart.length === 0) {
        showMessage('Your cart is empty', 'error');
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        showMessage('Please sign in to checkout', 'error');
        window.location.href = 'auth.html?redirect=cart.html';
        return;
    }
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;
    
    // Create WhatsApp message
    let message = `🛒 *New Order from ${user.displayName || user.email}*\n\n`;
    message += `📧 Email: ${user.email}\n\n`;
    message += `*Order Details:*\n`;
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n`;
        message += `   Qty: ${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}\n\n`;
    });
    
    message += `*Order Summary:*\n`;
    message += `Subtotal: ${formatPrice(subtotal)}\n`;
    message += `Shipping: ${shipping === 0 ? 'Free' : formatPrice(shipping)}\n`;
    message += `Tax: ${formatPrice(tax)}\n`;
    message += `*Total: ${formatPrice(total)}*\n\n`;
    message += `Please confirm this order and provide delivery details.`;
    
    // WhatsApp business number (replace with actual number)
    const whatsappNumber = '+1234567890'; // Replace with actual WhatsApp business number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Optionally clear cart after checkout
    setTimeout(() => {
        if (confirm('Order sent via WhatsApp! Would you like to clear your cart?')) {
            clearCart();
        }
    }, 2000);
}

// Global functions for cart management
window.updateQuantity = updateCartItemQuantity;
window.removeCartItem = removeFromCart;
window.addToCart = addToCart;
window.clearCart = clearCart;
window.loadCartPage = loadCartPage;

// Utility functions
function getCurrentUser() {
    return window.firebaseAuth?.currentUser || null;
}

function showMessage(message, type = 'success') {
    if (window.mainUtils && window.mainUtils.showMessage) {
        window.mainUtils.showMessage(message, type);
    } else {
        console.log(message);
    }
}

function formatPrice(price) {
    if (window.mainUtils && window.mainUtils.formatPrice) {
        return window.mainUtils.formatPrice(price);
    }
    return `$${price.toFixed(2)}`;
}

function saveToLocalStorage(key, data) {
    if (window.mainUtils && window.mainUtils.saveToLocalStorage) {
        return window.mainUtils.saveToLocalStorage(key, data);
    }
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    if (window.mainUtils && window.mainUtils.getFromLocalStorage) {
        return window.mainUtils.getFromLocalStorage(key, defaultValue);
    }
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

function updateCartCount() {
    if (window.mainUtils && window.mainUtils.updateCartCount) {
        window.mainUtils.updateCartCount();
    } else {
        const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
        const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        
        cartCountElements.forEach(element => {
            if (element) {
                element.textContent = count;
                element.style.display = count > 0 ? 'flex' : 'none';
            }
        });
    }
}

// Export cart functions
export { addToCart, removeFromCart, updateCartItemQuantity, clearCart, loadCartPage };
