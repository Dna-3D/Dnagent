// Ticket page functionality
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
let allTickets = [];
let filteredTickets = [];
let currentFilters = {
    category: '',
    priceRange: '',
    searchTerm: ''
};

// Initialize ticket page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('ticket.html')) {
        initializeTicketPage();
    }
});

async function initializeTicketPage() {
    // Initialize filter controls
    initializeFilters();
    
    // Load tickets
    await loadTickets();
    
    // Apply initial filters and render
    applyFilters();
    renderTickets();
}

function initializeFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentFilters.category = this.value;
            applyFilters();
            renderTickets();
        });
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', function() {
            currentFilters.priceRange = this.value;
            applyFilters();
            renderTickets();
        });
    }
    
    if (searchInput) {
        // Use debounce to avoid too many search requests
        const debouncedSearch = debounce(function(searchTerm) {
            currentFilters.searchTerm = searchTerm.toLowerCase();
            applyFilters();
            renderTickets();
        }, 300);
        
        searchInput.addEventListener('input', function() {
            debouncedSearch(this.value);
        });
    }
}

async function loadTickets() {
    const loading = document.getElementById('ticketsLoading');
    
    if (loading) loading.style.display = 'block';
    
    try {
        // Query tickets from Firestore
        const q = query(
            collection(db, 'tickets'), 
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        allTickets = [];
        querySnapshot.forEach((doc) => {
            const ticketData = doc.data();
            allTickets.push({
                id: doc.id,
                ...ticketData
            });
        });
        
        console.log(`Loaded ${allTickets.length} tickets`);
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        
        // Fallback to sample tickets for demonstration
        allTickets = getSampleTickets();
        
        if (error.message && !error.message.includes('Firebase not configured')) {
            showMessage('Error loading tickets from database. Showing sample tickets.', 'error');
        }
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function getSampleTickets() {
    // Sample tickets for when Firebase is not configured
    return [
        {
            id: 'sample-1',
            name: 'Concert: Afrobeat Festival',
            price: 5000,
            category: 'concert',
            description: 'Experience the best of Afrobeat music with top artists from across Africa.',
            image: 'https://via.placeholder.com/300x200/007bff/ffffff?text=Concert',
            date: '2025-09-15',
            location: 'Lagos Main Stadium',
            stock: 100
        },
        {
            id: 'sample-2',
            name: 'Football: Premier League Match',
            price: 3000,
            category: 'sports',
            description: 'Watch your favorite teams compete in this exciting Premier League match.',
            image: 'https://via.placeholder.com/300x200/28a745/ffffff?text=Football',
            date: '2025-08-22',
            location: 'National Stadium',
            stock: 50
        },
        {
            id: 'sample-3',
            name: 'Theater: Classic Drama Play',
            price: 2500,
            category: 'theater',
            description: 'A timeless classic brought to life by talented actors in a captivating performance.',
            image: 'https://via.placeholder.com/300x200/dc3545/ffffff?text=Theater',
            date: '2025-09-05',
            location: 'City Theater',
            stock: 75
        },
        {
            id: 'sample-4',
            name: 'Tech Conference 2025',
            price: 15000,
            category: 'conference',
            description: 'Join industry leaders and innovators at this premier technology conference.',
            image: 'https://via.placeholder.com/300x200/6f42c1/ffffff?text=Conference',
            date: '2025-10-10',
            location: 'Convention Center',
            stock: 200
        }
    ];
}

function applyFilters() {
    filteredTickets = allTickets.filter(ticket => {
        // Category filter
        if (currentFilters.category && ticket.category !== currentFilters.category) {
            return false;
        }
        
        // Price range filter
        if (currentFilters.priceRange) {
            const price = ticket.price;
            switch (currentFilters.priceRange) {
                case '0-1000':
                    if (price > 1000) return false;
                    break;
                case '1000-5000':
                    if (price <= 1000 || price > 5000) return false;
                    break;
                case '5000-10000':
                    if (price <= 5000 || price > 10000) return false;
                    break;
                case '10000+':
                    if (price <= 10000) return false;
                    break;
            }
        }
        
        // Search filter
        if (currentFilters.searchTerm) {
            const searchTerm = currentFilters.searchTerm;
            const ticketText = `${ticket.name} ${ticket.description} ${ticket.category}`.toLowerCase();
            if (!ticketText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log(`Filtered to ${filteredTickets.length} tickets`);
}

function renderTickets() {
    const grid = document.getElementById('ticketsGrid');
    const noTickets = document.getElementById('noTickets');
    
    if (!grid) return;
    
    if (filteredTickets.length === 0) {
        grid.style.display = 'none';
        if (noTickets) noTickets.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    if (noTickets) noTickets.style.display = 'none';
    
    grid.innerHTML = filteredTickets.map(ticket => createTicketCard(ticket)).join('');
    
    // Add animation to ticket cards
    const ticketCards = grid.querySelectorAll('.product-card');
    ticketCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        animateElement(card, 'fadeInUp');
    });
}

function createTicketCard(ticket) {
    const isOutOfStock = ticket.stock === 0;
    const stockClass = isOutOfStock ? 'out-of-stock' : '';
    const stockText = isOutOfStock ? 'Sold Out' : `${ticket.stock} tickets left`;
    
    return `
        <div class="product-card ${stockClass}" data-id="${ticket.id}">
            <img src="${ticket.image}" alt="${ticket.name}" class="product-image" loading="lazy">
            <div class="product-info">
                <div class="product-category">${formatCategory(ticket.category)}</div>
                <h3 class="product-title">${ticket.name}</h3>
                <p class="product-description">${ticket.description}</p>
                <div class="product-price">${formatPrice(ticket.price)}</div>
                <div class="ticket-details">
                    <p><i class="fas fa-calendar"></i> ${formatDate(ticket.date)}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${ticket.location}</p>
                </div>
                <div class="product-stock ${isOutOfStock ? 'out-of-stock' : ''}">${stockText}</div>
                <div class="product-actions">
                    <button class="btn-whatsapp" onclick="orderViaWhatsApp('${ticket.id}')" ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fab fa-whatsapp"></i>
                        Buy Ticket
                    </button>
                    <button class="btn-cart" onclick="addTicketToCart('${ticket.id}')" ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function formatCategory(category) {
    const categoryMap = {
        'concert': 'Concert',
        'sports': 'Sports',
        'theater': 'Theater',
        'conference': 'Conference'
    };
    
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

function orderViaWhatsApp(ticketId) {
    const ticket = findTicketById(ticketId);
    if (!ticket) {
        showMessage('Ticket not found', 'error');
        return;
    }
    
    if (ticket.stock === 0) {
        showMessage('This ticket is sold out', 'error');
        return;
    }
    
    // Create WhatsApp message
    const message = `Hi! I'm interested in buying a ticket:\n\n` +
                   `🎟️ *${ticket.name}*\n` +
                   `💰 Price: ${formatPrice(ticket.price)}\n` +
                   `📅 Date: ${formatDate(ticket.date)}\n` +
                   `📍 Location: ${ticket.location}\n` +
                   `📝 Description: ${ticket.description}\n\n` +
                   `Please let me know about availability and payment options.`;
    
    // WhatsApp business number (replace with actual number)
    const whatsappNumber = '+1234567890'; // Replace with actual WhatsApp business number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    showMessage('Opening WhatsApp to place your ticket order!');
}

async function addTicketToCart(ticketId) {
    const ticket = findTicketById(ticketId);
    if (!ticket) {
        showMessage('Ticket not found', 'error');
        return;
    }
    
    if (ticket.stock === 0) {
        showMessage('This ticket is sold out', 'error');
        return;
    }
    
    try {
        // Check if user is authenticated
        const user = getCurrentUser();
        if (!user) {
            showMessage('Please sign in to add tickets to cart', 'error');
            setTimeout(() => {
                window.location.href = 'auth.html?redirect=ticket.html';
            }, 1000);
            return;
        }
        
        // Add to cart using the cart module
        if (window.addToCart) {
            await window.addToCart(ticket, 1);
        } else {
            // Fallback if cart module isn't loaded
            addToLocalCart(ticket);
        }
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Error adding ticket to cart', 'error');
    }
}

function addToLocalCart(ticket) {
    // Fallback cart functionality
    let cart = getFromLocalStorage('cart', []);
    
    const existingIndex = cart.findIndex(item => item.id === ticket.id);
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: ticket.id,
            name: ticket.name,
            price: ticket.price,
            image: ticket.image,
            category: ticket.category,
            quantity: 1
        });
    }
    
    saveToLocalStorage('cart', cart);
    updateCartCount();
    showMessage(`${ticket.name} added to cart!`);
}

function findTicketById(ticketId) {
    return allTickets.find(ticket => ticket.id === ticketId);
}

// Global functions
window.orderViaWhatsApp = orderViaWhatsApp;
window.addTicketToCart = addTicketToCart;

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
    return `₦${price.toFixed(2)}`;
}

function formatDate(dateString) {
    if (window.mainUtils && window.mainUtils.formatDate) {
        return window.mainUtils.formatDate(dateString);
    }
    return new Date(dateString).toLocaleDateString();
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