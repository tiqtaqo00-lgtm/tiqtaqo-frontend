/**
 * Tiqtaqo E-commerce - Enhanced Firebase Status Checker & LocalStorage Manager
 * Checks Firebase health and provides seamless localStorage fallback
 */

const FirebaseHealthCheck = {
    // Check Firebase connection status
    async checkStatus() {
        try {
            // Try to access Firestore
            const testUrl = 'https://firestore.googleapis.com/v1/projects/tiqtaqo-store/databases/(default)/documents';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(testUrl, {
                signal: controller.signal,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok || response.status === 200) {
                return { status: 'connected', type: 'firestore' };
            }
            
            return { status: 'unavailable', type: 'firestore' };
        } catch (error) {
            console.log('Firebase Firestore unavailable:', error.message);
            return { status: 'unavailable', type: 'firestore', error: error.message };
        }
    },
    
    // Check Auth status
    async checkAuth() {
        try {
            const authUrl = 'https://www.googleapis.com/identitytoolkit/v3/relyingproject/getOpenIdConfiguration';
            const response = await fetch(authUrl + '?key=AIzaSyAmJp754L3V_AAUl6lV4LzE_dUCEFaX_nA');
            
            if (response.ok) {
                return { status: 'connected' };
            }
            return { status: 'unavailable' };
        } catch (error) {
            return { status: 'unavailable', error: error.message };
        }
    },
    
    // Full health check
    async fullCheck() {
        const [firestore, auth] = await Promise.all([
            this.checkStatus(),
            this.checkAuth()
        ]);
        
        return {
            connected: firestore.status === 'connected' && auth.status === 'connected',
            firestore,
            auth,
            timestamp: new Date().toISOString()
        };
    }
};

// Enhanced LocalStorage Manager with Firebase Fallback
const LocalStorageManager = {
    STORAGE_KEY: 'tiqtaqo_products',
    ORDERS_KEY: 'tiqtaqo_orders',
    
    // Save products to localStorage
    saveProducts(products) {
        try {
            const data = {
                products: products,
                timestamp: Date.now(),
                source: 'localStorage'
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            console.log(`✅ Saved ${products.length} products to localStorage`);
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },
    
    // Load products from localStorage
    loadProducts() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                console.log(`📦 Loaded ${parsed.products?.length || 0} products from localStorage`);
                return parsed.products || [];
            }
            return [];
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return [];
        }
    },
    
    // Check if localStorage data is fresh (less than 24 hours old)
    isDataFresh() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return false;
            
            const parsed = JSON.parse(data);
            const age = Date.now() - (parsed.timestamp || 0);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            return age < maxAge;
        } catch (error) {
            return false;
        }
    },
    
    // Get data source info
    getDataInfo() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return { source: 'empty', age: null };
            
            const parsed = JSON.parse(data);
            const age = Date.now() - (parsed.timestamp || 0);
            
            return {
                source: parsed.source || 'unknown',
                timestamp: parsed.timestamp,
                age: age,
                ageMinutes: Math.floor(age / 60000),
                productCount: parsed.products?.length || 0
            };
        } catch (error) {
            return { source: 'error', age: null };
        }
    },
    
    // Clear all data
    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.ORDERS_KEY);
        console.log('🗑️ LocalStorage cleared');
    }
};

// Auto-check Firebase status on page load
window.addEventListener('load', async function() {
    // Wait a bit for Firebase to initialize
    setTimeout(async () => {
        const status = await FirebaseHealthCheck.fullCheck();
        
        if (!status.connected) {
            console.log('⚠️ Firebase unavailable - using localStorage');
            LocalStorageManager.getDataInfo();
        } else {
            console.log('✅ Firebase connected');
        }
    }, 2000);
});

// Export for global use
window.FirebaseHealthCheck = FirebaseHealthCheck;
window.LocalStorageManager = LocalStorageManager;
