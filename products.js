// Products page functionality
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy,
    limit
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { db } from './firebase-config.js';

// Global state
let allProducts = [];
let filteredProducts = [];
let currentFilters = {
    category: '',
    priceRange: '',
    searchTerm: ''
};

// Initialize products page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('products.html')) {
        initializeProductsPage();
    }
});

async function initializeProductsPage() {
    // Initialize filter controls
    initializeFilters();
    
    // Load products
    await loadProducts();
    
    // Apply initial filters and render
    applyFilters();
    renderProducts();
}

function initializeFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentFilters.category = this.value;
            applyFilters();
            renderProducts();
        });
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', function() {
            currentFilters.priceRange = this.value;
            applyFilters();
            renderProducts();
        });
    }
    
    if (searchInput) {
        // Use debounce to avoid too many search requests
        const debouncedSearch = debounce(function(searchTerm) {
            currentFilters.searchTerm = searchTerm.toLowerCase();
            applyFilters();
            renderProducts();
        }, 300);
        
        searchInput.addEventListener('input', function() {
            debouncedSearch(this.value);
        });
    }
}

async function loadProducts() {
    const loading = document.getElementById('productsLoading');
    
    if (loading) loading.style.display = 'block';
    
    try {
        // Query products from Firestore
        const q = query(
            collection(db, 'products'), 
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        allProducts = [];
        querySnapshot.forEach((doc) => {
            const productData = doc.data();
            allProducts.push({
                id: doc.id,
                ...productData
            });
        });
        
        console.log(`Loaded ${allProducts.length} products`);
        
    } catch (error) {
        console.error('Error loading products:', error);
        
        // Fallback to sample products for demonstration
        allProducts = getSampleProducts();
        
        if (error.message && !error.message.includes('Firebase not configured')) {
            showMessage('Error loading products from database. Showing sample products.', 'error');
        }
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function getSampleProducts() {
    // Sample products for when Firebase is not configured
    return [
        {
            id: 'sample-1',
            name: 'Wireless Bluetooth Headphones',
            price: 79.99,
            category: 'electronics',
            description: 'High-quality wireless headphones with noise cancellation and 20-hour battery life.',
            image: 'https://via.placeholder.com/300x200/007bff/ffffff?text=Headphones',
            stock: 15
        },
        {
            id: 'sample-2',
            name: 'Premium Cotton T-Shirt',
            price: 24.99,
            category: 'clothing',
            description: 'Comfortable 100% cotton t-shirt available in multiple colors and sizes.',
            image: 'https://via.placeholder.com/300x200/28a745/ffffff?text=T-Shirt',
            stock: 50
        },
        {
            id: 'sample-3',
            name: 'Smart Fitness Watch',
            price: 199.99,
            category: 'electronics',
            description: 'Track your fitness goals with GPS, heart rate monitor, and sleep tracking.',
            image: 'https://via.placeholder.com/300x200/dc3545/ffffff?text=Smart+Watch',
            stock: 8
        },
        {
            id: 'sample-4',
            name: 'Organic Plant Fertilizer',
            price: 15.99,
            category: 'home',
            description: 'All-natural plant fertilizer to keep your garden thriving year-round.',
            image: 'https://via.placeholder.com/300x200/6f42c1/ffffff?text=Fertilizer',
            stock: 30
        },
        {
            id: 'sample-5',
            name: 'Running Shoes',
            price: 89.99,
            category: 'sports',
            description: 'Lightweight running shoes with advanced cushioning and breathable mesh.',
            image: 'https://via.placeholder.com/300x200/fd7e14/ffffff?text=Running+Shoes',
            stock: 25
        },
        {
            id: 'sample-6',
            name: 'Wireless Phone Charger',
            price: 29.99,
            category: 'electronics',
            description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
            image: 'https://via.placeholder.com/300x200/20c997/ffffff?text=Wireless+Charger',
            stock: 40
        },
        {
            id: 'sample-7',
            name: 'Designer Jeans',
            price: 69.99,
            category: 'clothing',
            description: 'Premium denim jeans with a perfect fit and durable construction.',
            image: 'https://via.placeholder.com/300x200/6c757d/ffffff?text=Jeans',
            stock: 20
        },
        {
            id: 'sample-8',
            name: 'Coffee Maker',
            price: 149.99,
            category: 'home',
            description: 'Programmable coffee maker with thermal carafe and auto-brew feature.',
            image: 'https://via.placeholder.com/300x200/495057/ffffff?text=Coffee+Maker',
            stock: 12
        }
    ];
}

function applyFilters() {
    filteredProducts = allProducts.filter(product => {
        // Category filter
        if (currentFilters.category && product.category !== currentFilters.category) {
            return false;
        }
        
        // Price range filter
        if (currentFilters.priceRange) {
            const price = product.price;
            switch (currentFilters.priceRange) {
                case '0-50':
                    if (price > 50) return false;
                    break;
                case '50-100':
                    if (price <= 50 || price > 100) return false;
                    break;
                case '100-200':
                    if (price <= 100 || price > 200) return false;
                    break;
                case '200+':
                    if (price <= 200) return false;
                    break;
            }
        }
        
        // Search filter
        if (currentFilters.searchTerm) {
            const searchTerm = currentFilters.searchTerm;
            const productText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
            if (!productText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log(`Filtered to ${filteredProducts.length} products`);
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    
    if (!grid) return;
    
    if (filteredProducts.length === 0) {
        grid.style.display = 'none';
        if (noProducts) noProducts.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    if (noProducts) noProducts.style.display = 'none';
    
    grid.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
    
    // Add animation to product cards
    const productCards = grid.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        animateElement(card, 'fadeInUp');
    });
}

function createProductCard(product) {
    const isOutOfStock = product.stock === 0;
    const stockClass = isOutOfStock ? 'out-of-stock' : '';
    const stockText = isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`;
    
    return `
        <div class="product-card ${stockClass}" data-id="${product.id}">
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            <div class="product-info">
                <div class="product-category">${formatCategory(product.category)}</div>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-stock ${isOutOfStock ? 'out-of-stock' : ''}">${stockText}</div>
                <div class="product-actions">
                    <button class="btn-whatsapp" onclick="orderViaWhatsApp('${product.id}')" ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fab fa-whatsapp"></i>
                        Order Now
                    </button>
                    <button class="btn-cart" onclick="addProductToCart('${product.id}')" ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function formatCategory(category) {
    const categoryMap = {
        'electronics': 'Electronics',
        'clothing': 'Clothing',
        'home': 'Home & Garden',
        'sports': 'Sports'
    };
    
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

function orderViaWhatsApp(productId) {
    const product = findProductById(productId);
    if (!product) {
        showMessage('Product not found', 'error');
        return;
    }
    
    if (product.stock === 0) {
        showMessage('This product is out of stock', 'error');
        return;
    }
    
    // Create WhatsApp message
    const message = `Hi! I'm interested in ordering:\n\n` +
                   `📦 *${product.name}*\n` +
                   `💰 Price: ${formatPrice(product.price)}\n` +
                   `📝 Description: ${product.description}\n\n` +
                   `Please let me know about availability and delivery options.`;
    
    // WhatsApp business number (replace with actual number)
    const whatsappNumber = '+1234567890'; // Replace with actual WhatsApp business number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    showMessage('Opening WhatsApp to place your order!');
}

async function addProductToCart(productId) {
    const product = findProductById(productId);
    if (!product) {
        showMessage('Product not found', 'error');
        return;
    }
    
    if (product.stock === 0) {
        showMessage('This product is out of stock', 'error');
        return;
    }
    
    try {
        // Check if user is authenticated
        const user = getCurrentUser();
        if (!user) {
            showMessage('Please sign in to add items to cart', 'error');
            setTimeout(() => {
                window.location.href = 'auth.html?redirect=products.html';
            }, 1000);
            return;
        }
        
        // Add to cart using the cart module
        if (window.addToCart) {
            await window.addToCart(product, 1);
        } else {
            // Fallback if cart module isn't loaded
            addToLocalCart(product);
        }
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Error adding item to cart', 'error');
    }
}

function addToLocalCart(product) {
    // Fallback cart functionality
    let cart = getFromLocalStorage('cart', []);
    
    const existingIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity: 1
        });
    }
    
    saveToLocalStorage('cart', cart);
    updateCartCount();
    showMessage(`${product.name} added to cart!`);
}

function findProductById(productId) {
    return allProducts.find(product => product.id === productId);
}

// Global functions
window.orderViaWhatsApp = orderViaWhatsApp;
window.addProductToCart = addProductToCart;

// Load recommended products for other pages
async function loadRecommendedProducts(limit = 4) {
    if (allProducts.length === 0) {
        await loadProducts();
    }
    
    // Return random products for recommendations
    const shuffled = allProducts.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
}

// Export functions for use in other modules
window.loadRecommendedProducts = loadRecommendedProducts;

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

function animateElement(element, animation = 'fadeInUp') {
    if (window.mainUtils && window.mainUtils.animateElement) {
        return window.mainUtils.animateElement(element, animation);
    }
    
    if (!element) return;
    element.style.animation = `${animation} 0.5s ease`;
}

function debounce(func, wait) {
    if (window.mainUtils && window.mainUtils.debounce) {
        return window.mainUtils.debounce(func, wait);
    }
    
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
    }
}
