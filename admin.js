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
let currentEditingProduct = null;
let currentEditingCarousel = null;

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
        productImageInput.addEventListener('change', handleProductImagePreview);
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
        carouselImageInput.addEventListener('change', handleCarouselImagePreview);
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
        `;
        return;
    }
    
    grid.innerHTML = currentProducts.map(product => `
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
        // Handle image upload
        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) {
            const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(imageRef, imageFile);
            productData.image = await getDownloadURL(snapshot.ref);
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
    
    // Show image preview
    const preview = document.getElementById('imagePreview');
    if (preview && product.image) {
        createImagePreview(product.image, preview);
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
        // Handle image upload
        const imageFile = document.getElementById('carouselImage').files[0];
        if (imageFile) {
            const imageRef = ref(storage, `carousels/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(imageRef, imageFile);
            carouselData.image = await getDownloadURL(snapshot.ref);
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
    
    // Show image preview
    const preview = document.getElementById('carouselImagePreview');
    if (preview && carousel.image) {
        createImagePreview(carousel.image, preview);
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
