// Carousel functionality
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { db } from './firebase-config.js';

// Global carousel state
const carousels = new Map();
const carouselIntervals = new Map();

// Initialize carousels
document.addEventListener('DOMContentLoaded', function() {
    initializeCarousels();
});

async function initializeCarousels() {
    // Find all carousel containers
    const carouselElements = document.querySelectorAll('.carousel');
    
    for (const carouselElement of carouselElements) {
        const carouselId = carouselElement.id;
        if (carouselId) {
            await initializeCarousel(carouselId);
        }
    }
    
    // Initialize touch/swipe support
    initializeTouchSupport();
}

async function initializeCarousel(carouselId) {
    const carouselElement = document.getElementById(carouselId);
    if (!carouselElement) return;
    
    const container = carouselElement.querySelector('.carousel-container');
    if (!container) return;
    
    // Load carousel data if it's admin-managed
    await loadCarouselData(carouselId);
    
    // Initialize carousel state
    carousels.set(carouselId, {
        currentSlide: 0,
        totalSlides: container.children.length,
        isAutoPlaying: true,
        autoPlayDelay: 5000
    });
    
    // Start auto-play
    startAutoPlay(carouselId);
    
    // Initialize navigation buttons
    initializeCarouselButtons(carouselId);
    
    // Initialize indicators if they exist
    initializeCarouselIndicators(carouselId);
    
    console.log(`Initialized carousel: ${carouselId} with ${carousels.get(carouselId).totalSlides} slides`);
}

async function loadCarouselData(carouselId) {
    try {
        // Determine carousel type based on ID
        let carouselType = '';
        if (carouselId.includes('featured')) {
            carouselType = 'featured';
        } else if (carouselId.includes('latest')) {
            carouselType = 'latest';
        }
        
        if (!carouselType) return; // Skip if not an admin-managed carousel
        
        // Query carousel items from Firestore
        const q = query(
            collection(db, 'carousels'),
            where('type', '==', carouselType),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) return; // No custom carousel items
        
        // Build carousel slides from Firestore data
        const carouselElement = document.getElementById(carouselId);
        const container = carouselElement.querySelector('.carousel-container');
        
        if (container) {
            container.innerHTML = ''; // Clear existing slides
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const slide = createCarouselSlide(data);
                container.appendChild(slide);
            });
        }
        
    } catch (error) {
        console.error(`Error loading carousel data for ${carouselId}:`, error);
        // Keep default slides if loading fails
    }
}

function createCarouselSlide(data) {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    
    slide.innerHTML = `
        <img src="${data.image}" alt="${data.title}" loading="lazy">
        <div class="slide-content">
            <h3>${data.title}</h3>
            <p>${data.description}</p>
        </div>
    `;
    
    return slide;
}

function initializeCarouselButtons(carouselId) {
    const carouselElement = document.getElementById(carouselId);
    if (!carouselElement) return;
    
    const prevBtn = carouselElement.querySelector('.carousel-btn.prev');
    const nextBtn = carouselElement.querySelector('.carousel-btn.next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            moveCarousel(carouselId, -1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            moveCarousel(carouselId, 1);
        });
    }
}

function initializeCarouselIndicators(carouselId) {
    const carouselElement = document.getElementById(carouselId);
    if (!carouselElement) return;
    
    const carousel = carousels.get(carouselId);
    if (!carousel) return;
    
    // Create indicators if they don't exist
    let indicators = carouselElement.querySelector('.carousel-indicators');
    if (!indicators && carousel.totalSlides > 1) {
        indicators = document.createElement('div');
        indicators.className = 'carousel-indicators';
        
        for (let i = 0; i < carousel.totalSlides; i++) {
            const indicator = document.createElement('button');
            indicator.className = `carousel-indicator ${i === 0 ? 'active' : ''}`;
            indicator.setAttribute('data-slide', i);
            indicator.addEventListener('click', () => {
                goToSlide(carouselId, i);
            });
            indicators.appendChild(indicator);
        }
        
        carouselElement.appendChild(indicators);
    }
}

function moveCarousel(carouselId, direction) {
    const carousel = carousels.get(carouselId);
    if (!carousel) return;
    
    const newSlide = carousel.currentSlide + direction;
    
    // Handle wrapping
    let targetSlide;
    if (newSlide >= carousel.totalSlides) {
        targetSlide = 0; // Go to first slide
    } else if (newSlide < 0) {
        targetSlide = carousel.totalSlides - 1; // Go to last slide
    } else {
        targetSlide = newSlide;
    }
    
    goToSlide(carouselId, targetSlide);
    
    // Restart auto-play
    restartAutoPlay(carouselId);
}

function goToSlide(carouselId, slideIndex) {
    const carousel = carousels.get(carouselId);
    if (!carousel || slideIndex < 0 || slideIndex >= carousel.totalSlides) return;
    
    const carouselElement = document.getElementById(carouselId);
    const container = carouselElement.querySelector('.carousel-container');
    
    if (!container) return;
    
    // Update current slide
    carousel.currentSlide = slideIndex;
    
    // Apply transform
    const translateX = -slideIndex * 100;
    container.style.transform = `translateX(${translateX}%)`;
    
    // Update indicators
    updateCarouselIndicators(carouselId);
    
    // Update carousel state
    carousels.set(carouselId, carousel);
}

function updateCarouselIndicators(carouselId) {
    const carouselElement = document.getElementById(carouselId);
    if (!carouselElement) return;
    
    const indicators = carouselElement.querySelectorAll('.carousel-indicator');
    const carousel = carousels.get(carouselId);
    
    indicators.forEach((indicator, index) => {
        if (index === carousel.currentSlide) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

function startAutoPlay(carouselId) {
    const carousel = carousels.get(carouselId);
    if (!carousel || !carousel.isAutoPlaying || carousel.totalSlides <= 1) return;
    
    // Clear existing interval
    if (carouselIntervals.has(carouselId)) {
        clearInterval(carouselIntervals.get(carouselId));
    }
    
    // Start new interval
    const interval = setInterval(() => {
        moveCarousel(carouselId, 1);
    }, carousel.autoPlayDelay);
    
    carouselIntervals.set(carouselId, interval);
}

function stopAutoPlay(carouselId) {
    if (carouselIntervals.has(carouselId)) {
        clearInterval(carouselIntervals.get(carouselId));
        carouselIntervals.delete(carouselId);
    }
}

function restartAutoPlay(carouselId) {
    stopAutoPlay(carouselId);
    
    // Restart after a delay to give user time to interact
    setTimeout(() => {
        startAutoPlay(carouselId);
    }, 2000);
}

function pauseAutoPlay(carouselId) {
    const carousel = carousels.get(carouselId);
    if (carousel) {
        carousel.isAutoPlaying = false;
        stopAutoPlay(carouselId);
    }
}

function resumeAutoPlay(carouselId) {
    const carousel = carousels.get(carouselId);
    if (carousel) {
        carousel.isAutoPlaying = true;
        startAutoPlay(carouselId);
    }
}

function initializeTouchSupport() {
    const carouselElements = document.querySelectorAll('.carousel');
    
    carouselElements.forEach(carouselElement => {
        const carouselId = carouselElement.id;
        if (!carouselId) return;
        
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        
        carouselElement.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
            
            // Pause auto-play during interaction
            pauseAutoPlay(carouselId);
        }, { passive: true });
        
        carouselElement.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            
            // Prevent scrolling if swiping horizontally
            const deltaX = Math.abs(e.touches[0].clientX - startX);
            const deltaY = Math.abs(e.touches[0].clientY - startY);
            
            if (deltaX > deltaY) {
                e.preventDefault();
            }
        }, { passive: false });
        
        carouselElement.addEventListener('touchend', function(e) {
            if (!isDragging) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Check if it's a horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    // Swipe right - go to previous slide
                    moveCarousel(carouselId, -1);
                } else {
                    // Swipe left - go to next slide
                    moveCarousel(carouselId, 1);
                }
            }
            
            isDragging = false;
            
            // Resume auto-play after interaction
            setTimeout(() => {
                resumeAutoPlay(carouselId);
            }, 1000);
        }, { passive: true });
        
        // Mouse support for desktop
        let isMouseDown = false;
        let mouseStartX = 0;
        
        carouselElement.addEventListener('mousedown', function(e) {
            mouseStartX = e.clientX;
            isMouseDown = true;
            pauseAutoPlay(carouselId);
            e.preventDefault();
        });
        
        carouselElement.addEventListener('mousemove', function(e) {
            if (!isMouseDown) return;
            e.preventDefault();
        });
        
        carouselElement.addEventListener('mouseup', function(e) {
            if (!isMouseDown) return;
            
            const deltaX = e.clientX - mouseStartX;
            
            if (Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    moveCarousel(carouselId, -1);
                } else {
                    moveCarousel(carouselId, 1);
                }
            }
            
            isMouseDown = false;
            setTimeout(() => {
                resumeAutoPlay(carouselId);
            }, 1000);
        });
        
        // Pause on hover
        carouselElement.addEventListener('mouseenter', () => {
            pauseAutoPlay(carouselId);
        });
        
        carouselElement.addEventListener('mouseleave', () => {
            resumeAutoPlay(carouselId);
        });
    });
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Find the currently visible carousel (simple implementation)
        const visibleCarousels = Array.from(document.querySelectorAll('.carousel')).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        });
        
        if (visibleCarousels.length > 0) {
            const carouselId = visibleCarousels[0].id;
            if (carouselId) {
                const direction = e.key === 'ArrowLeft' ? -1 : 1;
                moveCarousel(carouselId, direction);
                e.preventDefault();
            }
        }
    }
});

// Intersection Observer for performance
function initializeCarouselObserver() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const carouselId = entry.target.id;
                if (!carouselId) return;
                
                if (entry.isIntersecting) {
                    // Resume auto-play when carousel comes into view
                    resumeAutoPlay(carouselId);
                } else {
                    // Pause auto-play when carousel is out of view
                    pauseAutoPlay(carouselId);
                }
            });
        }, {
            threshold: 0.5
        });
        
        document.querySelectorAll('.carousel').forEach(carousel => {
            observer.observe(carousel);
        });
    }
}

// Initialize observer when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCarouselObserver);

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    // Clear all intervals
    carouselIntervals.forEach((interval, carouselId) => {
        clearInterval(interval);
    });
    carouselIntervals.clear();
});

// Global function for external use
window.moveCarousel = moveCarousel;
window.goToSlide = goToSlide;

// Export functions for module use
export { 
    initializeCarousel, 
    moveCarousel, 
    goToSlide, 
    startAutoPlay, 
    stopAutoPlay,
    pauseAutoPlay,
    resumeAutoPlay
};
