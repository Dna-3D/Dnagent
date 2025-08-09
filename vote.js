// Vote page functionality
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy,
    limit,
    doc,
    updateDoc,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { db } from './firebase-config.js';

// Global state
let allCandidates = [];
let filteredCandidates = [];
let currentFilters = {
    category: '',
    searchTerm: ''
};
let hasVoted = false;

// Initialize vote page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('vote.html')) {
        initializeVotePage();
    }
});

async function initializeVotePage() {
    // Initialize filter controls
    initializeFilters();
    
    // Check if user has already voted
    checkVotingStatus();
    
    // Load candidates
    await loadCandidates();
    
    // Apply initial filters and render
    applyFilters();
    renderCandidates();
}

function initializeFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentFilters.category = this.value;
            applyFilters();
            renderCandidates();
        });
    }
    
    if (searchInput) {
        // Use debounce to avoid too many search requests
        const debouncedSearch = debounce(function(searchTerm) {
            currentFilters.searchTerm = searchTerm.toLowerCase();
            applyFilters();
            renderCandidates();
        }, 300);
        
        searchInput.addEventListener('input', function() {
            debouncedSearch(this.value);
        });
    }
}

function checkVotingStatus() {
    // Check if user has already voted (using localStorage for demo)
    const userVote = getFromLocalStorage('userVote');
    if (userVote) {
        hasVoted = true;
        showMessage('You have already voted. Thank you for participating!', 'success');
    }
}

async function loadCandidates() {
    const loading = document.getElementById('candidatesLoading');
    
    if (loading) loading.style.display = 'block';
    
    try {
        // Query candidates from Firestore
        const q = query(
            collection(db, 'candidates'), 
            orderBy('votes', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        allCandidates = [];
        querySnapshot.forEach((doc) => {
            const candidateData = doc.data();
            allCandidates.push({
                id: doc.id,
                ...candidateData
            });
        });
        
        console.log(`Loaded ${allCandidates.length} candidates`);
        
    } catch (error) {
        console.error('Error loading candidates:', error);
        
        // Fallback to sample candidates for demonstration
        allCandidates = getSampleCandidates();
        
        if (error.message && !error.message.includes('Firebase not configured')) {
            showMessage('Error loading candidates from database. Showing sample candidates.', 'error');
        }
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function getSampleCandidates() {
    // Sample candidates for when Firebase is not configured
    return [
        {
            id: 'sample-1',
            name: 'Michael Johnson',
            category: 'music',
            description: 'Award-winning Afrobeat artist with over 10 years of experience.',
            image: 'https://via.placeholder.com/300x200/007bff/ffffff?text=Musician',
            votes: 1250
        },
        {
            id: 'sample-2',
            name: 'Sarah Williams',
            category: 'sports',
            description: 'Olympic gold medalist in track and field.',
            image: 'https://via.placeholder.com/300x200/28a745/ffffff?text=Athlete',
            votes: 980
        },
        {
            id: 'sample-3',
            name: 'David Chen',
            category: 'entertainment',
            description: 'Popular comedian known for his hilarious stand-up performances.',
            image: 'https://via.placeholder.com/300x200/dc3545/ffffff?text=Comedian',
            votes: 750
        },
        {
            id: 'sample-4',
            name: 'Amina Mohammed',
            category: 'leadership',
            description: 'Community leader advocating for education and women empowerment.',
            image: 'https://via.placeholder.com/300x200/6f42c1/ffffff?text=Leader',
            votes: 1520
        }
    ];
}

function applyFilters() {
    filteredCandidates = allCandidates.filter(candidate => {
        // Category filter
        if (currentFilters.category && candidate.category !== currentFilters.category) {
            return false;
        }
        
        // Search filter
        if (currentFilters.searchTerm) {
            const searchTerm = currentFilters.searchTerm;
            const candidateText = `${candidate.name} ${candidate.description} ${candidate.category}`.toLowerCase();
            if (!candidateText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log(`Filtered to ${filteredCandidates.length} candidates`);
}

function renderCandidates() {
    const grid = document.getElementById('candidatesGrid');
    const noCandidates = document.getElementById('noCandidates');
    
    if (!grid) return;
    
    if (filteredCandidates.length === 0) {
        grid.style.display = 'none';
        if (noCandidates) noCandidates.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    if (noCandidates) noCandidates.style.display = 'none';
    
    grid.innerHTML = filteredCandidates.map(candidate => createCandidateCard(candidate)).join('');
    
    // Add animation to candidate cards
    const candidateCards = grid.querySelectorAll('.product-card');
    candidateCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        animateElement(card, 'fadeInUp');
    });
}

function createCandidateCard(candidate) {
    return `
        <div class="product-card" data-id="${candidate.id}">
            <img src="${candidate.image}" alt="${candidate.name}" class="product-image" loading="lazy">
            <div class="product-info">
                <div class="product-category">${formatCategory(candidate.category)}</div>
                <h3 class="product-title">${candidate.name}</h3>
                <p class="product-description">${candidate.description}</p>
                <div class="vote-count">
                    <i class="fas fa-vote-yea"></i>
                    <span>${candidate.votes} votes</span>
                </div>
                <div class="product-actions">
                    <button class="btn-primary" onclick="voteForCandidate('${candidate.id}')" ${hasVoted ? 'disabled' : ''}>
                        <i class="fas fa-vote-yea"></i>
                        ${hasVoted ? 'Already Voted' : 'Vote'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function formatCategory(category) {
    const categoryMap = {
        'music': 'Music',
        'sports': 'Sports',
        'entertainment': 'Entertainment',
        'leadership': 'Leadership'
    };
    
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

async function voteForCandidate(candidateId) {
    if (hasVoted) {
        showMessage('You have already voted!', 'error');
        return;
    }
    
    const candidate = findCandidateById(candidateId);
    if (!candidate) {
        showMessage('Candidate not found', 'error');
        return;
    }
    
    try {
        // Check if user is authenticated
        const user = getCurrentUser();
        if (!user) {
            showMessage('Please sign in to vote', 'error');
            setTimeout(() => {
                window.location.href = 'auth.html?redirect=vote.html';
            }, 1000);
            return;
        }
        
        // Update vote count in Firestore
        const candidateRef = doc(db, 'candidates', candidateId);
        await updateDoc(candidateRef, {
            votes: increment(1)
        });
        
        // Update local data
        candidate.votes += 1;
        
        // Mark user as having voted
        hasVoted = true;
        saveToLocalStorage('userVote', { candidateId, timestamp: new Date().toISOString() });
        
        // Update UI
        renderCandidates();
        showMessage(`Thank you for voting for ${candidate.name}!`, 'success');
        
    } catch (error) {
        console.error('Error voting:', error);
        showMessage('Error recording your vote. Please try again.', 'error');
    }
}

function findCandidateById(candidateId) {
    return allCandidates.find(candidate => candidate.id === candidateId);
}

// Global functions
window.voteForCandidate = voteForCandidate;

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