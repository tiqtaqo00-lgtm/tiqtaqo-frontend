/**
 * Opening Offers Countdown Timer - Firebase Integration
 * Manages countdown timer for opening offers section with real-time updates
 */

// Global variables
let offersConfig = null;
let countdownInterval = null;
let countdownInitialized = false;
let currentEndTime = null;

/**
 * Initialize the opening offers countdown timer
 * Uses Firebase to get the end time, with fallback to localStorage
 * Includes real-time listener for automatic updates
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

    // Check if expired in localStorage BEFORE loading config
    const isExpiredInStorage = localStorage.getItem('openingOffers_expired') === 'true';
    if (isExpiredInStorage) {
        // Section was expired by admin or timer, keep it hidden
        section.dataset.expired = 'true';
        section.style.display = 'none';
        console.log('Countdown expired - section hidden until admin resets');
        return;
    }

    try {
        // Try to load config from Firebase with real-time listener
        offersConfig = await loadOffersConfigFromFirebase();

        // If Firebase fails or no config, try localStorage
        if (!offersConfig || !offersConfig.endTime) {
            offersConfig = loadOffersConfigFromLocalStorage();
        }

        // If still no config AND not expired, use default (7 days from now)
        // BUT only if isActive is true
        if (!offersConfig || !offersConfig.endTime) {
            if (offersConfig && offersConfig.isActive === false) {
                // Admin disabled offers, keep section hidden
                section.dataset.expired = 'true';
                section.style.display = 'none';
                return;
            }

            offersConfig = {
                endTime: Date.now() + (7 * 24 * 60 * 60 * 1000),
                isActive: true
            };
            // Save to localStorage for backup
            localStorage.setItem('openingOffers_endTime', offersConfig.endTime.toString());
            localStorage.setItem('openingOffers_isActive', 'true');
        }

        // If isActive is false, hide section
        if (offersConfig.isActive === false) {
            section.dataset.expired = 'true';
            section.style.display = 'none';
            return;
        }

        // Start the countdown with real-time monitoring
        startCountdown(offersConfig.endTime);
        countdownInitialized = true;

        // Set up real-time listener for changes
        setupRealtimeListener();

        // Set up localStorage listener for cross-tab communication
        setupLocalStorageListener();

    } catch (error) {
        console.error('Error initializing countdown:', error);
        // Fallback to localStorage
        const fallbackConfig = loadOffersConfigFromLocalStorage();

        // Check if expired
        if (fallbackConfig && (fallbackConfig.endTime === null || fallbackConfig.isActive === false)) {
            section.dataset.expired = 'true';
            section.style.display = 'none';
            return;
        }

        if (fallbackConfig && fallbackConfig.endTime) {
            startCountdown(fallbackConfig.endTime);
        } else {
            // No config at all, check if we should auto-create or stay hidden
            // Default: auto-create for new installations
            const defaultEndTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
            startCountdown(defaultEndTime);
        }
        countdownInitialized = true;

        // Still set up listeners even if there's an error
        setupLocalStorageListener();
    }
}

/**
 * Set up Firebase real-time listener for countdown changes
 */
async function setupRealtimeListener() {
    try {
        // Wait for Firebase to be ready
        if (typeof initFirebaseFn === 'function') {
            await initFirebaseFn();
        }

        // Check if db is available
        if (!window.getDb) {
            console.log('Firebase not available, skipping real-time listener');
            return;
        }

        const db = window.getDb();
        if (!db) {
            console.log('Firebase db not initialized, skipping real-time listener');
            return;
        }

        // Import Firebase functions
        const { doc, onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        // Set up real-time listener
        const configRef = doc(db, 'config', 'openingOffers');
        onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const newEndTime = data.endTime ? data.endTime.toDate().getTime() : null;
                const isActive = data.isActive === true;

                // Check if end time has changed or section was reactivated
                if (newEndTime && newEndTime !== currentEndTime) {
                    console.log('Countdown updated via Firebase:', new Date(newEndTime));
                    currentEndTime = newEndTime;

                    // Show the section if it was hidden
                    const section = document.getElementById('openingOffersSection');
                    if (section && section.dataset.expired === 'true') {
                        section.dataset.expired = 'false';
                        section.style.display = '';
                        section.style.opacity = '1';
                        section.style.transform = '';
                    }

                    // Update localStorage for backup
                    localStorage.setItem('openingOffers_endTime', newEndTime.toString());
                    localStorage.setItem('openingOffers_isActive', 'true');
                    localStorage.removeItem('openingOffers_expired');
                    localStorage.removeItem('openingOffers_expiredTime');

                    // Restart countdown with new time
                    startCountdown(newEndTime);
                    showCountdownUpdateNotification();
                } else if (isActive && currentEndTime === null && newEndTime) {
                    // Section was reactivated
                    console.log('Countdown reactivated via Firebase');
                    currentEndTime = newEndTime;

                    const section = document.getElementById('openingOffersSection');
                    if (section && section.dataset.expired === 'true') {
                        section.dataset.expired = 'false';
                        section.style.display = '';
                        section.style.opacity = '1';
                        section.style.transform = '';
                    }

                    localStorage.setItem('openingOffers_endTime', newEndTime.toString());
                    localStorage.setItem('openingOffers_isActive', 'true');
                    localStorage.removeItem('openingOffers_expired');
                    localStorage.removeItem('openingOffers_expiredTime');

                    startCountdown(newEndTime);
                    showCountdownUpdateNotification();
                }
            }
        }, (error) => {
            console.log('Firebase listener error (using localStorage fallback):', error.message);
        });

    } catch (error) {
        console.log('Could not set up Firebase listener:', error.message);
    }
}

/**
 * Set up localStorage listener for cross-tab updates
 */
function setupLocalStorageListener() {
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (event) => {
        if (event.key === 'openingOffers_endTime') {
            const newEndTime = event.newValue ? parseInt(event.newValue) : null;

            if (newEndTime && newEndTime !== currentEndTime) {
                console.log('Countdown updated from another tab:', new Date(newEndTime));
                currentEndTime = newEndTime;

                // Show the section if it was hidden
                const section = document.getElementById('openingOffersSection');
                if (section && section.dataset.expired === 'true') {
                    section.dataset.expired = 'false';
                    section.style.display = '';
                    section.style.opacity = '1';
                    section.style.transform = '';
                }

                // Clear expired flags
                localStorage.removeItem('openingOffers_expired');
                localStorage.removeItem('openingOffers_expiredTime');
                localStorage.setItem('openingOffers_isActive', 'true');

                startCountdown(newEndTime);
                showCountdownUpdateNotification();
            } else if (!event.newValue && currentEndTime) {
                // Timer was cleared
                console.log('Countdown cleared from another tab');
                currentEndTime = null;
                expireSection();
            }
        }

        // Also check if expired flag was cleared
        if (event.key === 'openingOffers_expired' && !event.newValue) {
            const section = document.getElementById('openingOffersSection');
            if (section && section.dataset.expired === 'true') {
                // Expired flag was cleared, try to reload countdown from storage
                console.log('Expired flag cleared, reloading countdown...');
                location.reload();
            }
        }
    });

    // Also listen for custom events from same tab
    window.addEventListener('countdownUpdated', (event) => {
        const { endTime } = event.detail;

        if (endTime && endTime !== currentEndTime) {
            console.log('Countdown updated via custom event:', new Date(endTime));
            currentEndTime = endTime;

            // Show the section if it was hidden
            const section = document.getElementById('openingOffersSection');
            if (section && section.dataset.expired === 'true') {
                section.dataset.expired = 'false';
                section.style.display = '';
                section.style.opacity = '1';
                section.style.transform = '';
            }

            // Clear expired flags in localStorage
            localStorage.removeItem('openingOffers_expired');
            localStorage.removeItem('openingOffers_expiredTime');
            localStorage.setItem('openingOffers_isActive', 'true');

            startCountdown(endTime);
            showCountdownUpdateNotification();
        }
    });
}

/**
 * Show notification when countdown is updated
 */
function showCountdownUpdateNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #d4af37, #aa8a2e);
        color: #1a1a1a;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = '<i class="fas fa-clock"></i> Countdown mis à jour!';

    // Add animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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
 * Uses same keys as admin.js for compatibility
 */
function loadOffersConfigFromLocalStorage() {
    // Use same keys as admin.js
    const endTime = localStorage.getItem('openingOffers_endTime');
    const isActive = localStorage.getItem('openingOffers_isActive') === 'true';
    const expired = localStorage.getItem('openingOffers_expired') === 'true';

    if (expired) {
        // Section is expired - keep it hidden until admin manually resets
        // Remove the 1-day auto-reset since admin controls when to show again
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
 * When timer ends, section stays hidden until admin manually resets
 */
function expireSection() {
    const section = document.getElementById('openingOffersSection');
    if (!section) return;

    // Mark as expired
    section.dataset.expired = 'true';

    // Store in localStorage to prevent showing on reload
    // Set isActive to false so it won't auto-reset
    localStorage.setItem('openingOffers_expired', 'true');
    localStorage.setItem('openingOffers_expiredTime', Date.now().toString());
    localStorage.setItem('openingOffers_isActive', 'false');

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
    localStorage.setItem('openingOffers_endTime', endTime.toString());
    localStorage.setItem('openingOffers_isActive', 'true');
    localStorage.removeItem('openingOffers_expired');
    localStorage.removeItem('openingOffers_expiredTime');
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

    localStorage.setItem('openingOffers_endTime', endTime.toString());
    localStorage.setItem('openingOffers_isActive', 'true');
    localStorage.removeItem('openingOffers_expired');
    localStorage.removeItem('openingOffers_expiredTime');
    location.reload();
};

/**
 * Admin function to reset/clear the countdown
 */
window.resetOffersCountdown = function() {
    localStorage.removeItem('openingOffers_endTime');
    localStorage.removeItem('openingOffers_isActive');
    localStorage.setItem('openingOffers_expired', 'true');
    localStorage.setItem('openingOffers_expiredTime', Date.now().toString());
    location.reload();
};

/**
 * Initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', initOpeningOffersCountdown);

// Export for use in other modules
export { initOpeningOffersCountdown, startCountdown, expireSection };
