/**
 * Opening Offers Countdown Timer - Firebase Integration
 * Manages countdown timer for opening offers section
 */

// Global variables
let offersConfig = null;
let countdownInterval = null;
let countdownInitialized = false;

/**
 * Initialize the opening offers countdown timer
 * Uses Firebase to get the end time, with fallback to localStorage
 */
async function initOpeningOffersCountdown() {
    if (countdownInitialized) return;
    
    const section = document.getElementById('openingOffersSection');
    if (!section) return;

    // Check if already expired in this session
    if (section.dataset.expired === 'true') {
        section.style.display = 'none';
        return;
    }

    try {
        // Try to load config from Firebase
        offersConfig = await loadOffersConfigFromFirebase();
        
        // If Firebase fails or no config, try localStorage
        if (!offersConfig || !offersConfig.endTime) {
            offersConfig = loadOffersConfigFromLocalStorage();
        }

        // If still no config, use default (7 days from now)
        if (!offersConfig || !offersConfig.endTime) {
            offersConfig = {
                endTime: Date.now() + (7 * 24 * 60 * 60 * 1000),
                isActive: true
            };
            // Save to localStorage for backup
            localStorage.setItem('offersEndTime', offersConfig.endTime);
            localStorage.setItem('offersActive', 'true');
        }

        // Start the countdown
        startCountdown(offersConfig.endTime);
        countdownInitialized = true;

    } catch (error) {
        console.error('Error initializing countdown:', error);
        // Fallback to localStorage
        const fallbackConfig = loadOffersConfigFromLocalStorage();
        if (fallbackConfig && fallbackConfig.endTime) {
            startCountdown(fallbackConfig.endTime);
        } else {
            const defaultEndTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
            startCountdown(defaultEndTime);
        }
        countdownInitialized = true;
    }
}

/**
 * Load offers configuration from Firebase
 */
async function loadOffersConfigFromFirebase() {
    try {
        // Wait for Firebase to be ready
        if (typeof initFirebaseFn === 'function') {
            await initFirebaseFn();
        }

        // Check if db is available
        if (!window.getDb) {
            console.log('Firebase not available, using localStorage');
            return null;
        }

        const db = window.getDb();
        if (!db) {
            console.log('Firebase db not initialized, using localStorage');
            return null;
        }

        // Get the config document
        const configRef = doc(db, 'config', 'openingOffers');
        const configSnap = await getDoc(configRef);

        if (configSnap.exists()) {
            const data = configSnap.data();
            console.log('Firebase offers config loaded:', data);
            return {
                endTime: data.endTime ? data.endTime.toDate().getTime() : null,
                isActive: data.isActive || false
            };
        }

        console.log('No Firebase config found, using localStorage');
        return null;

    } catch (error) {
        console.log('Firebase config load failed, using localStorage:', error.message);
        return null;
    }
}

/**
 * Load offers configuration from localStorage
 */
function loadOffersConfigFromLocalStorage() {
    const endTime = localStorage.getItem('offersEndTime');
    const isActive = localStorage.getItem('offersActive') === 'true';
    const expired = localStorage.getItem('offersExpired') === 'true';

    if (expired) {
        // Check if we should still show the section (e.g., admin reset it)
        const expiredTime = parseInt(localStorage.getItem('offersExpiredTime') || '0');
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // If expired more than 1 day ago, allow showing again (in case of new offer period)
        if (Date.now() - expiredTime > oneDayMs) {
            localStorage.removeItem('offersExpired');
            localStorage.removeItem('offersExpiredTime');
            return { endTime: null, isActive: true };
        }
        
        return { endTime: null, isActive: false };
    }

    return {
        endTime: endTime ? parseInt(endTime) : null,
        isActive: isActive
    };
}

/**
 * Start the countdown timer
 * @param {number} endTime - The end time in milliseconds
 */
function startCountdown(endTime) {
    const section = document.getElementById('openingOffersSection');
    if (!section) return;

    function updateCountdown() {
        const now = Date.now();
        const remaining = endTime - now;

        if (remaining <= 0) {
            // Time expired
            clearInterval(countdownInterval);
            expireSection();
            return;
        }

        // Calculate time units
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        // Update DOM elements
        const daysEl = document.getElementById('countDays');
        const hoursEl = document.getElementById('countHours');
        const minutesEl = document.getElementById('countMinutes');
        const secondsEl = document.getElementById('countSeconds');

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    // Update immediately
    updateCountdown();

    // Start interval
    countdownInterval = setInterval(updateCountdown, 1000);
}

/**
 * Expire the section (hide it with animation)
 */
function expireSection() {
    const section = document.getElementById('openingOffersSection');
    if (!section) return;

    // Mark as expired
    section.dataset.expired = 'true';
    
    // Store in localStorage to prevent showing on reload
    localStorage.setItem('offersExpired', 'true');
    localStorage.setItem('offersExpiredTime', Date.now().toString());

    // Add fade-out effect
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'all 1s ease';

    // Hide after animation
    setTimeout(() => {
        section.style.display = 'none';
    }, 1000);
}

/**
 * Admin function to set the countdown end time
 * @param {number} days - Number of days from now
 */
window.setOffersCountdown = function(days) {
    const endTime = Date.now() + (days * 24 * 60 * 60 * 1000);
    localStorage.setItem('offersEndTime', endTime.toString());
    localStorage.setItem('offersActive', 'true');
    localStorage.removeItem('offersExpired');
    localStorage.removeItem('offersExpiredTime');
    location.reload();
};

/**
 * Admin function to set a specific end date/time
 * @param {string} dateTime - ISO date string or timestamp
 */
window.setOffersEndTime = function(dateTime) {
    const endTime = new Date(dateTime).getTime();
    if (isNaN(endTime)) {
        console.error('Invalid date format');
        return;
    }
    
    localStorage.setItem('offersEndTime', endTime.toString());
    localStorage.setItem('offersActive', 'true');
    localStorage.removeItem('offersExpired');
    localStorage.removeItem('offersExpiredTime');
    location.reload();
};

/**
 * Admin function to reset/clear the countdown
 */
window.resetOffersCountdown = function() {
    localStorage.removeItem('offersEndTime');
    localStorage.removeItem('offersActive');
    localStorage.setItem('offersExpired', 'true');
    localStorage.setItem('offersExpiredTime', Date.now().toString());
    location.reload();
};

/**
 * Initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', initOpeningOffersCountdown);

// Export for use in other modules
export { initOpeningOffersCountdown, startCountdown, expireSection };
