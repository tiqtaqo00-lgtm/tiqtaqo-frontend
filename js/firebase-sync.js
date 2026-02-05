/**
 * Firebase Sync Module - Centralized Firebase Management
 * Handles initialization, countdown sync, and product loading
 */

// Firebase Configuration
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAmJp754L3V_AAUl6lV4LzE_dUCEFaX_nA",
    authDomain: "tiqtaqo-store.firebaseapp.com",
    projectId: "tiqtaqo-store",
    storageBucket: "tiqtaqo-store.firebasestorage.app",
    messagingSenderId: "747111253966",
    appId: "1:747111253966:web:84c265ac397b644fe28d9f"
};

// Firebase State
let firebaseApp = null;
let firebaseDb = null;
let firebaseInitialized = false;
let syncListeners = [];

/**
 * Initialize Firebase - Singleton Pattern
 * Prevents "App already exists" error
 */
async function initFirebase() {
    if (firebaseInitialized && firebaseDb) {
        console.log('[Firebase] Already initialized, returning existing instance');
        return { app: firebaseApp, db: firebaseDb };
    }

    try {
        // Dynamic imports
        const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
        const { getFirestore, enableIndexedDbPersistence, onSnapshot, doc, setDoc, getDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        // Check if app already exists - singleton pattern
        if (getApps().length > 0) {
            console.log('[Firebase] App already exists, using existing instance');
            firebaseApp = getApp();
        } else {
            console.log('[Firebase] Creating new app instance');
            firebaseApp = initializeApp(FIREBASE_CONFIG);
        }

        // Get Firestore instance
        firebaseDb = getFirestore(firebaseApp);

        // Enable offline persistence
        enableIndexedDbPersistence(firebaseDb).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.log('[Firebase] Multiple tabs open, persistence enabled in one tab only');
            } else if (err.code === 'unimplemented') {
                console.log('[Firebase] Browser does not support persistence');
            }
        });

        firebaseInitialized = true;
        console.log('[Firebase] Initialized successfully');
        
        return { app: firebaseApp, db: firebaseDb };

    } catch (error) {
        console.error('[Firebase] Initialization error:', error);
        firebaseInitialized = false;
        return null;
    }
}

/**
 * Get Firestore instance
 */
async function getFirestoreDb() {
    if (!firebaseInitialized || !firebaseDb) {
        return await initFirebase();
    }
    return firebaseDb;
}

/**
 * Save countdown to Firebase
 * @param {number} endTime - Unix timestamp in milliseconds
 * @param {boolean} isActive - Whether countdown is active
 */
async function saveCountdown(endTime, isActive = true) {
    try {
        const db = await getFirestoreDb();
        if (!db) {
            console.error('[Countdown] Firebase not available');
            return { success: false, error: 'Firebase not initialized' };
        }

        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        const countdownData = {
            endTime: endTime,
            endTimeISO: new Date(endTime).toISOString(),
            isActive: isActive,
            updatedAt: new Date().toISOString(),
            // Also save server timestamp
            serverUpdatedAt: { serverValue: 'TIMESTAMP' }
        };

        await setDoc(doc(db, 'config', 'openingOffers'), countdownData);
        
        console.log('[Countdown] Saved to Firebase:', countdownData);
        
        // Also save to localStorage as backup
        localStorage.setItem('openingOffers_endTime', endTime.toString());
        localStorage.setItem('openingOffers_isActive', isActive.toString());
        localStorage.removeItem('openingOffers_expired');
        
        return { success: true };

    } catch (error) {
        console.error('[Countdown] Save error:', error);
        
        // Fallback to localStorage
        localStorage.setItem('openingOffers_endTime', endTime.toString());
        localStorage.setItem('openingOffers_isActive', isActive.toString());
        
        return { success: false, error: error.message, localOnly: true };
    }
}

/**
 * Load countdown from Firebase
 */
async function loadCountdown() {
    try {
        const db = await getFirestoreDb();
        if (!db) {
            console.log('[Countdown] Firebase not available, using localStorage');
            return loadCountdownFromLocalStorage();
        }

        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        
        const docRef = doc(db, 'config', 'openingOffers');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('[Countdown] Loaded from Firebase:', data);
            
            // Save to localStorage for offline access
            if (data.endTime) {
                localStorage.setItem('openingOffers_endTime', data.endTime.toString());
                localStorage.setItem('openingOffers_isActive', data.isActive?.toString() || 'true');
            }
            
            return {
                endTime: data.endTime,
                isActive: data.isActive !== false,
                source: 'firebase'
            };
        } else {
            console.log('[Countdown] No data in Firebase, checking localStorage');
            return loadCountdownFromLocalStorage();
        }

    } catch (error) {
        console.error('[Countdown] Load error:', error);
        return loadCountdownFromLocalStorage();
    }
}

/**
 * Load countdown from localStorage (fallback)
 */
function loadCountdownFromLocalStorage() {
    const storedEndTime = localStorage.getItem('openingOffers_endTime');
    const isActive = localStorage.getItem('openingOffers_isActive') === 'true';
    const isExpired = localStorage.getItem('openingOffers_expired') === 'true';
    
    if (storedEndTime && !isNaN(parseInt(storedEndTime))) {
        return {
            endTime: parseInt(storedEndTime),
            isActive: isActive,
            isExpired: isExpired,
            source: 'localStorage'
        };
    }
    
    return null;
}

/**
 * Subscribe to real-time countdown updates
 * @param {function} callback - Function to call when countdown changes
 */
async function subscribeToCountdown(callback) {
    try {
        const db = await getFirestoreDb();
        if (!db) {
            console.log('[Countdown] Firebase not available, cannot subscribe');
            return null;
        }

        const { doc, onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        
        const docRef = doc(db, 'config', 'openingOffers');
        
        // Real-time listener
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('[Countdown] Real-time update:', data);
                
                // Save to localStorage
                if (data.endTime) {
                    localStorage.setItem('openingOffers_endTime', data.endTime.toString());
                    localStorage.setItem('openingOffers_isActive', data.isActive?.toString() || 'true');
                }
                
                callback({
                    endTime: data.endTime,
                    isActive: data.isActive !== false,
                    source: 'firebase-realtime'
                });
            }
        }, (error) => {
            console.error('[Countdown] Real-time error:', error);
        });

        syncListeners.push(unsubscribe);
        return unsubscribe;

    } catch (error) {
        console.error('[Countdown] Subscribe error:', error);
        return null;
    }
}

/**
 * Load products from Firebase with caching
 */
async function loadProducts() {
    try {
        const db = await getFirestoreDb();
        if (!db) {
            console.log('[Products] Firebase not available, using cache');
            return loadProductsFromCache();
        }

        const { collection, getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        
        // Get only products with openingOffer = true
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('openingOffer', '==', true));
        const snapshot = await getDocs(q);
        
        const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('[Products] Loaded from Firebase:', products.length);
        
        // Save to cache
        saveProductsToCache(products);
        
        return products;

    } catch (error) {
        console.error('[Products] Load error:', error);
        return loadProductsFromCache();
    }
}

/**
 * Save products to localStorage cache
 */
function saveProductsToCache(products) {
    const data = {
        products: products,
        timestamp: new Date().getTime()
    };
    try {
        localStorage.setItem('openingOffers_products', JSON.stringify(data));
    } catch (e) {
        console.log('[Products] Cache save error:', e);
    }
}

/**
 * Load products from localStorage cache
 */
function loadProductsFromCache() {
    const cachedProducts = localStorage.getItem('openingOffers_products');
    if (cachedProducts) {
        try {
            const data = JSON.parse(cachedProducts);
            const now = new Date().getTime();
            // Cache valid for 24 hours
            if (data && data.products && data.timestamp && (now - data.timestamp < 86400000)) {
                console.log('[Products] Loaded from cache:', data.products.length);
                return data.products;
            }
        } catch (e) {
            console.log('[Products] Cache parse error:', e);
        }
    }
    return [];
}

/**
 * Reset countdown
 */
async function resetCountdown() {
    try {
        const db = await getFirestoreDb();
        if (!db) {
            localStorage.removeItem('openingOffers_endTime');
            localStorage.setItem('openingOffers_isActive', 'false');
            return { success: false, error: 'Firebase not available' };
        }

        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        
        await setDoc(doc(db, 'config', 'openingOffers'), {
            endTime: null,
            endTimeISO: null,
            isActive: false,
            updatedAt: new Date().toISOString()
        });
        
        localStorage.removeItem('openingOffers_endTime');
        localStorage.setItem('openingOffers_isActive', 'false');
        
        return { success: true };
        
    } catch (error) {
        console.error('[Countdown] Reset error:', error);
        localStorage.removeItem('openingOffers_endTime');
        localStorage.setItem('openingOffers_isActive', 'false');
        return { success: false, error: error.message };
    }
}

/**
 * Clean up all listeners
 */
function cleanupListeners() {
    syncListeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
    syncListeners = [];
}

// Export functions to window for global access
window.FirebaseSync = {
    init: initFirebase,
    getDb: getFirestoreDb,
    saveCountdown: saveCountdown,
    loadCountdown: loadCountdown,
    subscribeToCountdown: subscribeToCountdown,
    loadProducts: loadProducts,
    resetCountdown: resetCountdown,
    cleanup: cleanupListeners
};
