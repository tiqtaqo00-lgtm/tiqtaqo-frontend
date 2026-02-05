/**
 * Opening Offers Countdown Timer - Centralized Firebase Sync Integration
 * Uses the centralized FirebaseSync module for countdown management
 */

// Global variables
let countdownInterval = null;
let countdownInitialized = false;

/**
 * Initialize the opening offers countdown timer
 * Uses FirebaseSync module for countdown management
 */
async function initOpeningOffersCountdown() {
    if (countdownInitialized) return;

    const section = document.getElementById('openingOffersSection');
    if (!section) {
        console.log('[OpeningOffers] Section not found, skipping initialization');
        return;
    }

    try {
        // Initialize Firebase using centralized module
        if (window.FirebaseSync && window.FirebaseSync.init) {
            await window.FirebaseSync.init();
            console.log('[OpeningOffers] Firebase initialized via FirebaseSync');
        }

        // Load countdown using centralized module
        let countdownData = null;
        if (window.FirebaseSync && window.FirebaseSync.loadCountdown) {
            countdownData = await window.FirebaseSync.loadCountdown();
            console.log('[OpeningOffers] Countdown loaded:', countdownData);
        }

        // If no countdown data, hide section
        if (!countdownData || !countdownData.endTime) {
            console.log('[OpeningOffers] No countdown data found, hiding section');
            section.style.display = 'none';
            return;
        }

        // If countdown is inactive, hide section
        if (!countdownData.isActive) {
            console.log('[OpeningOffers] Countdown inactive, hiding section');
            section.style.display = 'none';
            return;
        }

        // Start the countdown
        startCountdown(countdownData.endTime);
        countdownInitialized = true;

        // Set up real-time listener for changes
        if (window.FirebaseSync && window.FirebaseSync.subscribeToCountdown) {
            window.FirebaseSync.subscribeToCountdown(function(newData) {
                console.log('[OpeningOffers] Real-time countdown update:', newData);
                
                if (newData && newData.endTime && newData.isActive) {
                    startCountdown(newData.endTime);
                } else {
                    // Countdown was reset or deactivated
                    expireSection();
                }
            });
        }

        // Set up localStorage listener for cross-tab updates
        setupLocalStorageListener();

    } catch (error) {
        console.error('[OpeningOffers] Error initializing countdown:', error);
        
        // Fallback to localStorage
        const storedEndTime = localStorage.getItem('openingOffers_endTime');
        const isActive = localStorage.getItem('openingOffers_isActive') === 'true';
        
        if (storedEndTime && isActive) {
            startCountdown(parseInt(storedEndTime));
            countdownInitialized = true;
            setupLocalStorageListener();
        } else {
            // No data at all, hide section
            section.style.display = 'none';
        }
    }
}

/**
 * Set up localStorage listener for cross-tab updates
 */
function setupLocalStorageListener() {
    window.addEventListener('storage', (event) => {
        if (event.key === 'openingOffers_endTime' || event.key === 'openingOffers_isActive') {
            // Reload page to apply changes from other tabs
            console.log('[OpeningOffers] Storage changed, reloading page...');
            location.reload();
        }
    });

    // Also listen for custom events from same tab
    window.addEventListener('countdownUpdated', () => {
        console.log('[OpeningOffers] Countdown updated via custom event');
        location.reload();
    });
}

/**
 * Start the countdown timer
 * @param {number} endTime - The end time in milliseconds
 */
function startCountdown(endTime) {
    const section = document.getElementById('openingOffersSection');
    if (!section) return;

    // Get countdown elements
    const daysEl = document.getElementById('countDays');
    const hoursEl = document.getElementById('countHours');
    const minutesEl = document.getElementById('countMinutes');
    const secondsEl = document.getElementById('countSeconds');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
        console.log('[OpeningOffers] Countdown elements not found');
        return;
    }

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
        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    // Update immediately
    updateCountdown();

    // Start interval
    countdownInterval = setInterval(updateCountdown, 1000);

    // Make sure section is visible
    section.style.display = 'block';
    section.style.visibility = 'visible';
    section.style.opacity = '1';
    
    console.log('[OpeningOffers] Countdown started with end time:', new Date(endTime));
}

/**
 * Expire the section (hide it when timer ends)
 */
function expireSection() {
    const section = document.getElementById('openingOffersSection');
    if (!section) return;

    // Mark as expired
    section.dataset.expired = 'true';

    // Store in localStorage
    localStorage.setItem('openingOffers_expired', 'true');
    localStorage.setItem('openingOffers_expiredTime', Date.now().toString());
    localStorage.setItem('openingOffers_isActive', 'false');
    localStorage.removeItem('openingOffers_endTime');

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
window.setOffersCountdown = async function(days) {
    const endTime = Date.now() + (days * 24 * 60 * 60 * 1000);
    
    // Save to Firebase and localStorage
    if (window.FirebaseSync && window.FirebaseSync.saveCountdown) {
        await window.FirebaseSync.saveCountdown(endTime, true);
    } else {
        localStorage.setItem('openingOffers_endTime', endTime.toString());
        localStorage.setItem('openingOffers_isActive', 'true');
        localStorage.removeItem('openingOffers_expired');
        localStorage.removeItem('openingOffers_expiredTime');
    }
    
    location.reload();
};

/**
 * Admin function to set a specific end date/time
 * @param {string} dateTime - ISO date string or timestamp
 */
window.setOffersEndTime = async function(dateTime) {
    const endTime = new Date(dateTime).getTime();
    if (isNaN(endTime)) {
        console.error('Invalid date format');
        return;
    }

    // Save to Firebase and localStorage
    if (window.FirebaseSync && window.FirebaseSync.saveCountdown) {
        await window.FirebaseSync.saveCountdown(endTime, true);
    } else {
        localStorage.setItem('openingOffers_endTime', endTime.toString());
        localStorage.setItem('openingOffers_isActive', 'true');
        localStorage.removeItem('openingOffers_expired');
        localStorage.removeItem('openingOffers_expiredTime');
    }
    
    location.reload();
};

/**
 * Admin function to reset/clear the countdown
 */
window.resetOffersCountdown = async function() {
    if (window.FirebaseSync && window.FirebaseSync.resetCountdown) {
        await window.FirebaseSync.resetCountdown();
    } else {
        localStorage.removeItem('openingOffers_endTime');
        localStorage.setItem('openingOffers_isActive', 'false');
        localStorage.setItem('openingOffers_expired', 'true');
        localStorage.setItem('openingOffers_expiredTime', Date.now().toString());
    }
    
    location.reload();
};

/**
 * Initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', initOpeningOffersCountdown);

// Export for use in other modules
export { initOpeningOffersCountdown, startCountdown, expireSection };
