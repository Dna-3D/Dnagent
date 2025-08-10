// Admin panel functionality
import { 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

import { db, storage } from './firebase-config.js';

// Admin state
let isAdminAuthenticated = false;
let currentProducts = [];
let currentCarousels = [];
let currentTickets = [];
let currentCandidates = [];
let currentEditingProduct = null;
let currentEditingCarousel = null;
let currentEditingTicket = null;
let currentEditingCandidate = null;

// Admin password
const ADMIN_PASSWORD = 'Ilovemybusiness3';

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

function initializeAdmin() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Initialize admin navigation
    initializeAdminNavigation();
    
    // Initialize forms
    initializeProductForm();
    initializeCarouselForm();
    
    // Check if already authenticated
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (isAuthenticated) {
        showAdminPanel();
    }
}

function initializeAdminNavigation() {
    const navBtns = document.querySelectorAll('.admin-nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            switchAdminSection(section);
        });
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutAdmin);
    }
}

function initializeProductForm() {
    const addProductBtn = document.getElementById('addProductBtn');
    const productForm = document.getElementById('productFormElement');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    const productImageInput = document.getElementById('productImage');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', showAddProductForm);
    }
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', hideProductForm);
    }
    if (productImageInput) {
        productImageInput.addEventListener('input', function() {
            const preview = document.getElementById('imagePreview');
            if (preview) {
                preview.innerHTML = '';
                if (productImageInput.value) {
                    const img = document.createElement('img');
                    img.src = productImageInput.value;
                    img.alt = 'Product Image Preview';
                    img.style.maxWidth = '100px';
                    img.style.maxHeight = '100px';
                    preview.appendChild(img);
                }
            }
        });
    }
}

function initializeCarouselForm() {
    const addCarouselBtn = document.getElementById('addCarouselBtn');
    const carouselForm = document.getElementById('carouselFormElement');
    const cancelCarouselBtn = document.getElementById('cancelCarouselBtn');
    const carouselImageInput = document.getElementById('carouselImage');
    if (addCarouselBtn) {
        addCarouselBtn.addEventListener('click', showAddCarouselForm);
    }
    if (carouselForm) {
        carouselForm.addEventListener('submit', handleCarouselSubmit);
    }
    if (cancelCarouselBtn) {
        cancelCarouselBtn.addEventListener('click', hideCarouselForm);
    }
    if (carouselImageInput) {
        carouselImageInput.addEventListener('input', function() {
            const preview = document.getElementById('carouselImagePreview');
            if (preview) {
                preview.innerHTML = '';
                if (carouselImageInput.value) {
                    const img = document.createElement('img');
                    img.src = carouselImageInput.value;
                    img.alt = 'Carousel Image Preview';
                    img.style.maxWidth = '100px';
                    img.style.maxHeight = '100px';
                    preview.appendChild(img);
                }
                
                // Initialize ticket form
                initializeTicketForm();
                
                // Initialize candidate form
                initializeCandidateForm();
            }
        });
    }
}

function handleAdminLogin(e) {
    e.preventDefault();

    const password = document.getElementById('adminPassword').value;
    const errorElement = document.getElementById('loginError');

    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminAuthenticated', 'true');
        setTimeout(() => {
            showAdminPanel();
        }, 100); // Ensure DOM updates before showing panel
    } else {
        if (errorElement) {
            errorElement.textContent = 'Invalid password. Please try again.';
            errorElement.style.display = 'block';
        }
    }
}

function showAdminPanel() {
    const adminLogin = document.getElementById('adminLogin');
    const adminPanel = document.getElementById('adminPanel');
    
    if (adminLogin) adminLogin.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    
    isAdminAuthenticated = true;
    
    // Load initial data
    loadProducts();
    loadCarousels();
    loadOrders();
}

function logoutAdmin() {
    sessionStorage.removeItem('adminAuthenticated');
    isAdminAuthenticated = false;
    
    const adminLogin = document.getElementById('adminLogin');
    const adminPanel = document.getElementById('adminPanel');
    
    if (adminLogin) adminLogin.style.display = 'block';
    if (adminPanel) adminPanel.style.display = 'none';
    
    // Clear forms
    const adminPassword = document.getElementById('adminPassword');
    if (adminPassword) adminPassword.value = '';
    
    const errorElement = document.getElementById('loginError');
    if (errorElement) errorElement.style.display = 'none';
}

function switchAdminSection(sectionName) {
    // Update navigation
    const navBtns = document.querySelectorAll('.admin-nav-btn');
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionName) {
            btn.classList.add('active');
        }
    });
    
    // Update sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `${sectionName}-section`) {
            section.classList.add('active');
        }
    });
    
    // Load section-specific data
    switch (sectionName) {
        case 'products':
            loadProducts();
            break;
        case 'carousels':
            loadCarousels();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'tickets':
            loadTickets();
            break;
        case 'candidates':
            loadCandidates();
            break;
    }
}

// Product Management
async function loadProducts() {
    const loading = document.getElementById('productsLoading');
    const grid = document.getElementById('adminProductsGrid');
    
    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';
    
    try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        currentProducts = [];
        querySnapshot.forEach((doc) => {
            currentProducts.push({ id: doc.id, ...doc.data() });
        });
        
        renderProducts();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage('Error loading products', 'error');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function renderProducts() {
    const grid = document.getElementById('adminProductsGrid');
    if (!grid) return;
    
    if (currentProducts.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>No Products Found</h3>
                <p>Start by adding your first product.</p>
            </div>
// Initialize Ticket Form
function initializeTicketForm() {
    const addTicketBtn = document.getElementById('addTicketBtn');
    const ticketForm = document.getElementById('ticketFormElement');
    const cancelTicketBtn = document.getElementById('cancelTicketBtn');
    const ticketImageInput = document.getElementById('ticketImage');
    if (addTicketBtn) {
        addTicketBtn.addEventListener('click', showAddTicketForm);
    }
    if (ticketForm) {
        ticketForm.addEventListener('submit', handleTicketSubmit);
    }
    if (cancelTicketBtn) {
        cancelTicketBtn.addEventListener('click', hideTicketForm);
    }
    if (ticketImageInput) {
        ticketImageInput.addEventListener('input', function() {
            const preview = document.getElementById('ticketImagePreview');
            if (preview) {
                preview.innerHTML = '';
                if (ticketImageInput.value) {
                    const img = document.createElement('img');
                    img.src = ticketImageInput.value;
                    img.alt = 'Ticket Image Preview';
                    img.style.maxWidth = '100px';
                    img.style.maxHeight = '100px';
                    preview.appendChild(img);
                }
            }
        });
    }
}

// Initialize Candidate Form
function initializeCandidateForm() {
    const addCandidateBtn = document.getElementById('addCandidateBtn');
    const candidateForm = document.getElementById('candidateFormElement');
    const cancelCandidateBtn = document.getElementById('cancelCandidateBtn');
    const candidateImageInput = document.getElementById('candidateImage');
    if (addCandidateBtn) {
        addCandidateBtn.addEventListener('click', showAddCandidateForm);
    }
    if (candidateForm) {
        candidateForm.addEventListener('submit', handleCandidateSubmit);
    }
    if (cancelCandidateBtn) {
        cancelCandidateBtn.addEventListener('click', hideCandidateForm);
    }
    if (candidateImageInput) {
        candidateImageInput.addEventListener('input', function() {
            const preview = document.getElementById('candidateImagePreview');
            if (preview) {
                preview.innerHTML = '';
                if (candidateImageInput.value) {
                    const img = document.createElement('img');
                    img.src = candidateImageInput.value;
                    img.alt = 'Candidate Image Preview';
                    img.style.maxWidth = '100px';
                    img.style.maxHeight = '100px';
                    preview.appendChild(img);
                }
            }
        });
    }
}
        `;
        return;
    }
    
    grid.innerHTML = currentProducts.map(product => `
    initializeTicketForm();
    initializeCandidateForm();
        <div class="admin-product-card">
            <img src="${product.image}" alt="${product.name}" class="admin-product-image">
            <div class="admin-card-content">
                <h3 class="admin-card-title">${product.name}</h3>
                <p class="product-category">${product.category}</p>
                <p class="product-price">${formatPrice(product.price)}</p>
                <p class="product-stock">Stock: ${product.stock}</p>
                <div class="admin-card-actions">
                    <button class="btn-edit" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddProductForm() {
    const form = document.getElementById('productForm');
    const title = document.getElementById('formTitle');
    
    if (form) form.style.display = 'block';
    if (title) title.textContent = 'Add New Product';
    
    currentEditingProduct = null;
    clearProductForm();
}

function hideProductForm() {
    const form = document.getElementById('productForm');
    if (form) form.style.display = 'none';
    
    currentEditingProduct = null;
    clearProductForm();
}

function clearProductForm() {
    const form = document.getElementById('productFormElement');
    if (form) form.reset();
    
    const preview = document.getElementById('imagePreview');
    if (preview) preview.innerHTML = '';
    
    const productId = document.getElementById('productId');
    if (productId) productId.value = '';
}

function handleProductImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file && preview) {
        handleImageUpload(file, (dataUrl) => {
            createImagePreview(dataUrl, preview);
        });
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    if (!isAdminAuthenticated) {
        showMessage('Admin authentication required', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const productData = {
        name: formData.get('productName') || document.getElementById('productName').value,
        price: parseFloat(formData.get('productPrice') || document.getElementById('productPrice').value),
        category: formData.get('productCategory') || document.getElementById('productCategory').value,
        stock: parseInt(formData.get('productStock') || document.getElementById('productStock').value),
        description: formData.get('productDescription') || document.getElementById('productDescription').value
    };
    
    // Validation
    if (!productData.name || !productData.price || !productData.category || 
        !productData.description || productData.stock === undefined) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (productData.price <= 0) {
        showMessage('Price must be greater than 0', 'error');
        return;
    }
    
    if (productData.stock < 0) {
        showMessage('Stock cannot be negative', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Use image URL from input
        const imageUrl = document.getElementById('productImage').value.trim();
        if (imageUrl) {
            productData.image = imageUrl;
        } else if (currentEditingProduct) {
            productData.image = currentEditingProduct.image;
        } else {
            productData.image = 'https://via.placeholder.com/300x200/6c757d/ffffff?text=No+Image';
        }

        if (currentEditingProduct) {
            // Update existing product
            productData.updatedAt = serverTimestamp();
            await updateDoc(doc(db, 'products', currentEditingProduct.id), productData);
            showMessage('Product updated successfully!');
        } else {
            // Add new product
            productData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'products'), productData);
            showMessage('Product added successfully!');
        }

        hideProductForm();
        loadProducts();

    } catch (error) {
        console.error('Error saving product:', error);
        showMessage('Error saving product', 'error');
    } finally {
        showLoading(false);
    }
}

async function editProduct(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;
    
    currentEditingProduct = product;
    
    // Fill form with product data
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productImage').value = product.image || '';
    // Show image preview
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.innerHTML = '';
        if (product.image) {
            const img = document.createElement('img');
            img.src = product.image;
            img.alt = 'Product Image Preview';
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            preview.appendChild(img);
        }
    }
    
    // Show form
    const form = document.getElementById('productForm');
    const title = document.getElementById('formTitle');
    
    if (form) form.style.display = 'block';
    if (title) title.textContent = 'Edit Product';
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    showLoading(true);
    
    try {
        await deleteDoc(doc(db, 'products', productId));
        showMessage('Product deleted successfully!');
        loadProducts();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showMessage('Error deleting product', 'error');
    } finally {
        showLoading(false);
    }
}

// Carousel Management
async function loadCarousels() {
    const loading = document.getElementById('carouselsLoading');
    const grid = document.getElementById('adminCarouselsGrid');
    
    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';
    
    try {
        const q = query(collection(db, 'carousels'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        currentCarousels = [];
        querySnapshot.forEach((doc) => {
            currentCarousels.push({ id: doc.id, ...doc.data() });
        });
        
        renderCarousels();
        
    } catch (error) {
        console.error('Error loading carousels:', error);
        showMessage('Error loading carousel items', 'error');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function renderCarousels() {
    const grid = document.getElementById('adminCarouselsGrid');
    if (!grid) return;
    
    if (currentCarousels.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-images"></i>
                <h3>No Carousel Items Found</h3>
                <p>Start by adding your first carousel item.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = currentCarousels.map(carousel => `
        <div class="admin-carousel-card">
            <img src="${carousel.image}" alt="${carousel.title}" class="admin-carousel-image">
            <div class="admin-card-content">
                <h3 class="admin-card-title">${carousel.title}</h3>
                <p class="carousel-type">${carousel.type}</p>
                <p class="carousel-description">${carousel.description}</p>
                <div class="admin-card-actions">
                    <button class="btn-edit" onclick="editCarousel('${carousel.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteCarousel('${carousel.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddCarouselForm() {
    const form = document.getElementById('carouselForm');
    const title = document.getElementById('carouselFormTitle');
    
    if (form) form.style.display = 'block';
    if (title) title.textContent = 'Add New Carousel Item';
    
    currentEditingCarousel = null;
    clearCarouselForm();
}

function hideCarouselForm() {
    const form = document.getElementById('carouselForm');
    if (form) form.style.display = 'none';
    
    currentEditingCarousel = null;
    clearCarouselForm();
}

function clearCarouselForm() {
    const form = document.getElementById('carouselFormElement');
    if (form) form.reset();
    
    const preview = document.getElementById('carouselImagePreview');
    if (preview) preview.innerHTML = '';
    
    const carouselId = document.getElementById('carouselId');
    if (carouselId) carouselId.value = '';
}

function handleCarouselImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('carouselImagePreview');
    
    if (file && preview) {
        handleImageUpload(file, (dataUrl) => {
            createImagePreview(dataUrl, preview);
        });
    }
}

async function handleCarouselSubmit(e) {
    e.preventDefault();
    
    if (!isAdminAuthenticated) {
        showMessage('Admin authentication required', 'error');
        return;
    }
    
    const carouselData = {
        title: document.getElementById('carouselTitle').value,
        type: document.getElementById('carouselType').value,
        description: document.getElementById('carouselDescription').value
    };
    
    // Validation
    if (!carouselData.title || !carouselData.type || !carouselData.description) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Use image URL from input
        const imageUrl = document.getElementById('carouselImage').value.trim();
        if (imageUrl) {
            carouselData.image = imageUrl;
        } else if (currentEditingCarousel) {
            carouselData.image = currentEditingCarousel.image;
        } else {
            carouselData.image = 'https://via.placeholder.com/400x300/6c757d/ffffff?text=Carousel+Item';
        }

        if (currentEditingCarousel) {
            // Update existing carousel
            carouselData.updatedAt = serverTimestamp();
            await updateDoc(doc(db, 'carousels', currentEditingCarousel.id), carouselData);
            showMessage('Carousel item updated successfully!');
        } else {
            // Add new carousel
            carouselData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'carousels'), carouselData);
            showMessage('Carousel item added successfully!');
        }

        hideCarouselForm();
        loadCarousels();

    } catch (error) {
        console.error('Error saving carousel:', error);
        showMessage('Error saving carousel item', 'error');
    } finally {
        showLoading(false);
    }
}

async function editCarousel(carouselId) {
    const carousel = currentCarousels.find(c => c.id === carouselId);
    if (!carousel) return;
    
    currentEditingCarousel = carousel;
    
    // Fill form with carousel data
    document.getElementById('carouselId').value = carousel.id;
    document.getElementById('carouselTitle').value = carousel.title;
    document.getElementById('carouselType').value = carousel.type;
    document.getElementById('carouselDescription').value = carousel.description;
    document.getElementById('carouselImage').value = carousel.image || '';
    // Show image preview
    const preview = document.getElementById('carouselImagePreview');
    if (preview) {
        preview.innerHTML = '';
        if (carousel.image) {
            const img = document.createElement('img');
            img.src = carousel.image;
            img.alt = 'Carousel Image Preview';
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            preview.appendChild(img);
        }
    }
    
    // Show form
    const form = document.getElementById('carouselForm');
    const title = document.getElementById('carouselFormTitle');
    
    if (form) form.style.display = 'block';
    if (title) title.textContent = 'Edit Carousel Item';
}

async function deleteCarousel(carouselId) {
    if (!confirm('Are you sure you want to delete this carousel item?')) return;
    
    showLoading(true);
    
    try {
        await deleteDoc(doc(db, 'carousels', carouselId));
        showMessage('Carousel item deleted successfully!');
        loadCarousels();
        
    } catch (error) {
        console.error('Error deleting carousel:', error);
        showMessage('Error deleting carousel item', 'error');
    } finally {
        showLoading(false);
    }
}

// Tickets Management
async function loadTickets() {
    const loading = document.getElementById('ticketsLoading');
    const grid = document.getElementById('adminTicketsGrid');
    
    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';
    
    try {
        const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        currentTickets = [];
        querySnapshot.forEach((doc) => {
            currentTickets.push({ id: doc.id, ...doc.data() });
        });
        
        renderTickets();
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        showMessage('Error loading tickets', 'error');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function renderTickets() {
    const grid = document.getElementById('adminTicketsGrid');
    if (!grid) return;
    
    if (currentTickets.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-ticket-alt"></i>
                <h3>No Tickets Found</h3>
                <p>Start by adding your first ticket.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = currentTickets.map(ticket => `
        <div class="admin-product-card">
            <img src="${ticket.image}" alt="${ticket.name}" class="admin-product-image">
            <div class="admin-card-content">
                <h3 class="admin-card-title">${ticket.name}</h3>
                <p class="product-category">${ticket.category}</p>
                <p class="product-price">${formatPrice(ticket.price)}</p>
                <p class="product-stock">Stock: ${ticket.stock}</p>
                <p class="ticket-date">Date: ${ticket.date}</p>
                <p class="ticket-location">Location: ${ticket.location}</p>
                <div class="admin-card-actions">
                    <button class="btn-edit" onclick="editTicket('${ticket.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteTicket('${ticket.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddTicketForm() {
    const form = document.getElementById('ticketForm');
    const title = document.getElementById('ticketFormTitle');
    
    if (form) form.style.display = 'block';
    if (title) title.textContent = 'Add New Ticket';
    
    currentEditingTicket = null;
    clearTicketForm();
}

function hideTicketForm() {
    const form = document.getElementById('ticketForm');
    if (form) form.style.display = 'none';
    
    currentEditingTicket = null;
    clearTicketForm();
}

function clearTicketForm() {
    const form = document.getElementById('ticketFormElement');
    if (form) form.reset();
    
    const preview = document.getElementById('ticketImagePreview');
    if (preview) preview.innerHTML = '';
    
    const ticketId = document.getElementById('ticketId');
    if (ticketId) ticketId.value = '';
}

async function handleTicketSubmit(e) {
    e.preventDefault();
    
    if (!isAdminAuthenticated) {
        showMessage('Admin authentication required', 'error');
        return;
    }
    
    const ticketData = {
        name: document.getElementById('ticketName').value,
        price: parseFloat(document.getElementById('ticketPrice').value),
        category: document.getElementById('ticketCategory').value,
        stock: parseInt(document.getElementById('ticketStock').value),
        date: document.getElementById('ticketDate').value,
        location: document.getElementById('ticketLocation').value,
        description: document.getElementById('ticketDescription').value
    };
    
    // Validation
    if (!ticketData.name || !ticketData.price || !ticketData.category ||
        !ticketData.description || ticketData.stock === undefined ||
        !ticketData.date || !ticketData.location) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (ticketData.price <= 0) {
        showMessage('Price must be greater than 0', 'error');
        return;
    }
    
    if (ticketData.stock < 0) {
        showMessage('Stock cannot be negative', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Use image URL from input
        const imageUrl = document.getElementById('ticketImage').value.trim();
        if (imageUrl) {
            ticketData.image = imageUrl;
        } else if (currentEditingTicket) {
            ticketData.image = currentEditingTicket.image;
        } else {
            ticketData.image = 'https://via.placeholder.com/300x200/6c757d/ffffff?text=No+Image';
        }

        if (currentEditingTicket) {
            // Update existing ticket
            ticketData.updatedAt = serverTimestamp();
            await updateDoc(doc(db, 'tickets', currentEditingTicket.id), ticketData);
            showMessage('Ticket updated successfully!');
        } else {
            // Add new ticket
            ticketData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'tickets'), ticketData);
            showMessage('Ticket added successfully!');
        }

        hideTicketForm();
        loadTickets();
        
    } catch (error) {
        console.error('Error saving ticket:', error);
        showMessage('Error saving ticket', 'error');
    } finally {
        showLoading(false);
    }
}

async function editTicket(ticketId) {
    const ticket = currentTickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    currentEditingTicket = ticket;
    
    // Fill form with ticket data
    document.getElementById('ticketId').value = ticket.id;
    document.getElementById('ticketName').value = ticket.name;
    document.getElementById('ticketPrice').value = ticket.price;
    document.getElementById('ticketCategory').value = ticket.category;
    document.getElementById('ticketStock').value = ticket.stock;
    document.getElementById('ticketDate').value = ticket.date;
    document.getElementById('ticketLocation').value = ticket.location;
    document.getElementById('ticketDescription').value = ticket.description;
    document.getElementById('ticketImage').value = ticket.image || '';
    // Show image preview
    const preview = document.getElementById('ticketImagePreview');
    if (preview) {
        preview.innerHTML = '';
        if (ticket.image) {
            const img = document.createElement('img');
            img.src = ticket.image;
            img.alt = 'Ticket Image Preview';
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            preview.appendChild(img);
        }
    }
    
    // Show form
    const form = document.getElementById('ticketForm');
    const title = document.getElementById('ticketFormTitle');
    
    if (form) form.style.display = 'block';
    if (title) title.textContent = 'Edit Ticket';
}

async function deleteTicket(ticketId) {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    showLoading(true);
    
    try {
        await deleteDoc(doc(db, 'tickets', ticketId));
        showMessage('Ticket deleted successfully!');
        loadTickets();
        
    } catch (error) {
        console.error('Error deleting ticket:', error);
        showMessage('Error deleting ticket', 'error');
    } finally {
        showLoading(false);
    }
}

// Candidates Management
async function loadCandidates() {
    const loading = document.getElementById('candidatesLoading');
    const grid = document.getElementById('adminCandidatesGrid');
    
    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';
    
    try {
        const q = query(collection(db, 'candidates'), orderBy('votes', 'desc'));
        const querySnapshot = await getDocs(q);
        
        currentCandidates = [];
        querySnapshot.forEach((doc) => {
            currentCandidates.push({ id: doc.id, ...doc.data() });
        });
        
        renderCandidates();
        
    } catch (error) {
        console.error('Error loading candidates:', error);
        showMessage('Error loading candidates', 'error');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function renderCandidates() {
    const grid = document.getElementById('adminCandidatesGrid');
    if (!grid) return;
    
    if (currentCandidates.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-user"></i>
                <h3>No Candidates Found</h3>
                <p>Start by adding your first candidate.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = currentCandidates.map(candidate => `
        <div class="admin-product-card">
            <img src="${candidate.image}" alt="${candidate.name}" class="admin-product-image">
            <div class="admin-card-content">
                <h3 class="admin-card-title">${candidate.name}</h3>
                <p class="product-category">${candidate.category}</p>
                <p class="candidate-description">${candidate.description}</p>
                <p class="candidate-votes">Votes: ${candidate.votes}</p>
                <div class="admin-card-actions">
                    <button class="btn-edit" onclick="editCandidate('${candidate.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteCandidate('${candidate.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddCandidateForm() {
    const form = document.getElementById('candidateForm');
    const title = document.getElementById('candidateFormTitle');
    
    if (form) form.style.display = 'block';
    if (title) title.textContent = 'Add New Candidate';
    
    currentEditingCandidate = null;
    clearCandidateForm();
}

function hideCandidateForm() {
    const form = document.getElementById('candidateForm');
    if (form) form.style.display = 'none';
    
    currentEditingCandidate = null;
    clearCandidateForm();
}

function clearCandidateForm() {
    const form = document.getElementById('candidateFormElement');
    if (form) form.reset();
    
    const preview = document.getElementById('candidateImagePreview');
    if (preview) preview.innerHTML = '';
    
    const candidateId = document.getElementById('candidateId');
    if (candidateId) candidateId.value = '';
}

async function handleCandidateSubmit(e) {
    e.preventDefault();
    
    if (!isAdminAuthenticated) {
        showMessage('Admin authentication required', 'error');
        return;
    }
    
    const candidateData = {
        name: document.getElementById('candidateName').value,
        category: document.getElementById('candidateCategory').value,
        description: document.getElementById('candidateDescription').value
    };
    
    // Validation
    if (!candidateData.name || !candidateData.category || !candidateData.description) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    // Initialize votes to 0 for new candidates
    if (!currentEditingCandidate) {
        candidateData.votes = 0;
    }
    
    showLoading(true);
    
    try {
        // Use image URL from input
        const imageUrl = document.getElementById('candidateImage').value.trim();
        if (imageUrl) {
            candidateData.image = imageUrl;
        } else if (currentEditingCandidate) {
            candidateData.image = currentEditingCandidate.image;
        } else {
            candidateData.image = 'https://via.placeholder.com/300x200/6c757d/ffffff?text=No+Image';
        }

        if (currentEditingCandidate) {
            // Update existing candidate
            candidateData.updatedAt = serverTimestamp();
            await updateDoc(doc(db, 'candidates', currentEditingCandidate.id), candidateData);
            showMessage('Candidate updated successfully!');
        } else {
            // Add new candidate
            candidateData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'candidates'), candidateData);
            showMessage('Candidate added successfully!');
        }

        hideCandidateForm();
        loadCandidates();
        
    } catch (error) {
        console.error('Error saving candidate:', error);
        showMessage('Error saving candidate', 'error');
    } finally {
        showLoading(false);
    }
}

async function editCandidate(candidateId) {
    const candidate = currentCandidates.find(c => c.id === candidateId);
    if (!candidate) return;
    
    currentEditingCandidate = candidate;
    
    // Fill form with candidate data
    document.getElementById('candidateId').value = candidate.id;
    document.getElementById('candidateName').value = candidate.name;
    document.getElementById('candidateCategory').value = candidate.category;
    document.getElementById('candidateDescription').value = candidate.description;
    document.getElementById('candidateImage').value = candidate.image || '';
    // Show image preview
    const preview = document.getElementById('candidateImagePreview');
    if (preview) {
        preview.innerHTML = '';
        if (candidate.image) {
            const img = document.createElement('img');
            img.src = candidate.image;
            img.alt = 'Candidate Image Preview';
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            preview.appendChild(img);
        }
    }
    
    // Show form
    const form = document.getElementById('candidateForm');
    const title = document.getElementById('candidateFormTitle');
    
    if (form) form.style.display = 'block';
    if (title) title.textContent = 'Edit Candidate';
}

async function deleteCandidate(candidateId) {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    
    showLoading(true);
    
    try {
        await deleteDoc(doc(db, 'candidates', candidateId));
        showMessage('Candidate deleted successfully!');
        loadCandidates();
        
    } catch (error) {
        console.error('Error deleting candidate:', error);
        showMessage('Error deleting candidate', 'error');
    } finally {
        showLoading(false);
    }
}

// Orders Management
async function loadOrders() {
    const loading = document.getElementById('ordersLoading');
    const list = document.getElementById('adminOrdersList');
    
    if (loading) loading.style.display = 'block';
    if (list) list.innerHTML = '';
    
    try {
        // For now, show a placeholder since we don't have actual orders in Firestore
        // In a real implementation, you'd query orders from Firestore
        setTimeout(() => {
            if (loading) loading.style.display = 'none';
            if (list) {
                list.innerHTML = `
                    <div class="no-products">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>No Orders Found</h3>
                        <p>Orders will appear here when customers checkout via WhatsApp.</p>
                    </div>
                `;
            }
        }, 500);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showMessage('Error loading orders', 'error');
        if (loading) loading.style.display = 'none';
    }
}

// Global functions for admin actions
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editCarousel = editCarousel;
window.deleteCarousel = deleteCarousel;
window.editTicket = editTicket;
window.deleteTicket = deleteTicket;
window.editCandidate = editCandidate;
window.deleteCandidate = deleteCandidate;

// Utility functions
function showMessage(message, type = 'success') {
    if (window.mainUtils && window.mainUtils.showMessage) {
        window.mainUtils.showMessage(message, type);
    } else {
        console.log(message);
    }
}

function showLoading(show = true) {
    if (window.mainUtils && window.mainUtils.showLoading) {
        window.mainUtils.showLoading(show);
    }
}

function formatPrice(price) {
    if (window.mainUtils && window.mainUtils.formatPrice) {
        return window.mainUtils.formatPrice(price);
    }
    return `$${price.toFixed(2)}`;
}

function handleImageUpload(file, callback) {
    if (window.mainUtils && window.mainUtils.handleImageUpload) {
        return window.mainUtils.handleImageUpload(file, callback);
    }
    
    if (!file) {
        callback(null);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.readAsDataURL(file);
}

function createImagePreview(src, container) {
    if (window.mainUtils && window.mainUtils.createImagePreview) {
        return window.mainUtils.createImagePreview(src, container);
    }
    
    if (!container) return;
    
    container.innerHTML = '';
    if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.style.maxWidth = '200px';
        img.style.borderRadius = '0.5rem';
        container.appendChild(img);
    }
}
