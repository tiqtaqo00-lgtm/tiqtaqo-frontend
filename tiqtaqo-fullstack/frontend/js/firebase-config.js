/**
 * Firebase Configuration for Tiqtaqo E-commerce
 * Supports 100,000+ products with offline persistence
 */

// Firebase configuration - Tiqtaqo Store Project
const firebaseConfig = {
    apiKey: "AIzaSyAmJp754L3V_AAUl6lV4LzE_dUCEFaX_nA",
    authDomain: "tiqtaqo-store.firebaseapp.com",
    projectId: "tiqtaqo-store",
    storageBucket: "tiqtaqo-store.firebasestorage.app",
    messagingSenderId: "747111253966",
    appId: "1:747111253966:web:84c265ac397b644fe28d9f"
};

// Initialize Firebase
let app;
let db;
let auth;
let firebaseInitialized = false;
let firebaseModulesLoaded = false;

// Load Firebase modules dynamically
async function loadFirebaseModules() {
    if (firebaseModulesLoaded) return true;
    
    try {
        // Load Firebase SDKs
        const [{ initializeApp: firebaseInit }, 
                { getFirestore, enableIndexedDbPersistence, collection, doc, getDoc, getDocs, getDocsFromServer, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, serverTimestamp, increment, writeBatch },
                { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"),
            import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js")
        ]);
        
        // Store functions globally for use
        window.firebaseInit = firebaseInit;
        window.firestoreFunctions = { getFirestore, enableIndexedDbPersistence, collection, doc, getDoc, getDocs, getDocsFromServer, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, serverTimestamp, increment, writeBatch };
        window.authFunctions = { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged };
        
        firebaseModulesLoaded = true;
        return true;
    } catch (error) {
        console.error('Error loading Firebase modules:', error);
        return false;
    }
}

// Check if we have valid config
const isValidConfig = () => {
    return firebaseConfig.apiKey !== "YOUR_API_KEY" && 
           firebaseConfig.apiKey !== undefined;
};

const initFirebase = async () => {
    if (firebaseInitialized) return { db, auth };
    
    // Load Firebase modules first
    const loaded = await loadFirebaseModules();
    if (!loaded) {
        console.error('Failed to load Firebase modules');
        return null;
    }
    
    // Update diagnostic panel
    if (typeof updateDiagnostic === 'function') {
        updateDiagnostic('firebase-config.js: Starting Firebase initialization...');
    }
    
    try {
        app = window.firebaseInit(firebaseConfig);
        db = window.firestoreFunctions.getFirestore(app);
        auth = window.authFunctions.getAuth(app);
        
        // Enable offline persistence (Critical for reducing reads)
        window.firestoreFunctions.enableIndexedDbPersistence(db).catch((err) => {
            if (err.code === 'failed-precondition') {
                if (typeof updateDiagnostic === 'function') {
                    updateDiagnostic('firebase-config: Multiple tabs - persistence in one tab only', 'warning');
                }
            } else if (err.code === 'unimplemented') {
                if (typeof updateDiagnostic === 'function') {
                    updateDiagnostic('firebase-config: Browser does not support persistence', 'warning');
                }
            }
        });
        
        firebaseInitialized = true;
        
        if (typeof updateDiagnostic === 'function') {
            updateDiagnostic('firebase-config.js: Firebase initialized SUCCESSFULLY!', 'success');
            updateDiagnostic('ProductAPI is now available on window', 'success');
        }
        
        console.log('Firebase initialized successfully');
        return { db, auth };
    } catch (error) {
        if (typeof updateDiagnostic === 'function') {
            updateDiagnostic('firebase-config.js: Firebase ERROR: ' + error.message, 'error');
        }
        console.error('Firebase initialization error:', error);
        return null;
    }
};

// Export functions for use in other files
window.initFirebase = initFirebase;
window.isFirebaseReady = () => firebaseInitialized;
window.getDb = () => db;
window.getAuth = () => auth;
window.loadFirebaseModules = loadFirebaseModules;

// Product API functions
window.ProductAPI = {
    // Get products with pagination - simplified version
    async getProducts({ 
        category = null, 
        gender = null,
        minPrice = 0, 
        maxPrice = 100000,
        searchTerm = '',
        pageSize = 50,
        lastDoc = null,
        sortBy = 'created_at',
        forceRefresh = false
    }) {
        if (!db) return { products: [], hasMore: false };
        
        try {
            const productsRef = collection(db, 'products');
            let allProducts = [];
            
            // Try simple query first (without orderBy to avoid index issues)
            try {
                // Use cache behavior based on forceRefresh
                let snapshot;
                if (forceRefresh) {
                    // Force server read to get freshest data (bypass cache)
                    snapshot = await getDocsFromServer(productsRef);
                    const msg = 'ProductAPI: Fetching from SERVER (forceRefresh=true)';
                    console.log(msg);
                    if (typeof updateDiagnostic === 'function') {
                        updateDiagnostic(msg, 'success');
                    }
                } else {
                    // Use cache
                    snapshot = await getDocs(productsRef);
                    console.log('Fetching products from CACHE (forceRefresh=false)');
                }
                
                allProducts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const msg = 'ProductAPI: Loaded ' + allProducts.length + ' products from database';
                console.log(msg);
                if (typeof updateDiagnostic === 'function') {
                    updateDiagnostic(msg, allProducts.length > 0 ? 'success' : 'warning');
                }
            } catch (queryError) {
                console.log('Simple query failed, trying with limit:', queryError);
                // Fallback: just get first 50 products
                const simpleQuery = query(productsRef, limit(50));
                const snapshot = await getDocs(simpleQuery);
                allProducts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const msg = 'ProductAPI: Loaded ' + allProducts.length + ' products from database';
                console.log(msg);
                if (typeof updateDiagnostic === 'function') {
                    updateDiagnostic(msg, allProducts.length > 0 ? 'success' : 'warning');
                }
            }
            
            // Filter products
            let filteredProducts = allProducts.filter(product => {
                // Price filter
                const price = product.price || 0;
                if (price < minPrice || price > maxPrice) return false;
                
                // Category filter - use trim() to handle trailing spaces
                if (category && (product.category || '').trim() !== category) return false;
                
                // Gender filter - use trim() to handle trailing spaces
                if (gender) {
                    const genderCategories = ['packs', 'wallets', 'glasses', 'accessoires', 'belts'];
                    if (genderCategories.includes(category)) {
                        if ((product.gender || '').trim() !== gender) return false;
                    }
                }
                
                return true;
            });
            
            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                filteredProducts = filteredProducts.filter(p => 
                    p.name?.toLowerCase().includes(searchLower) ||
                    p.description?.toLowerCase().includes(searchLower) ||
                    p.category?.toLowerCase().includes(searchLower)
                );
            }
            
            // Sort by created_at (newest first)
            filteredProducts.sort((a, b) => {
                const dateA = a.created_at || a.createdAt || '';
                const dateB = b.created_at || b.createdAt || '';
                return dateB.localeCompare(dateA);
            });
            
            return {
                products: filteredProducts.slice(0, pageSize),
                lastDoc: null,
                hasMore: filteredProducts.length > pageSize
            };
            
        } catch (error) {
            console.error('Error fetching products:', error);
            return { products: [], hasMore: false };
        }
    },
    
    // Get single product by ID
    async getProduct(productId) {
        if (!db) return null;
        
        try {
            const docRef = doc(db, 'products', productId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('Error fetching product:', error);
            return null;
        }
    },
    
    // Add new product
    async addProduct(productData) {
        if (!db) return null;
        
        try {
            // Generate search keywords
            const keywords = [
                productData.name?.toLowerCase() || '',
                productData.category || '',
                ...(productData.colors?.map(c => c.name?.toLowerCase()) || []),
                ...(productData.name?.split(' ').map(w => w.toLowerCase()) || [])
            ].filter(w => w.length > 2);
            
            const docRef = await addDoc(collection(db, 'products'), {
                ...productData,
                keywords: [...new Set(keywords)],
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                view_count: 0,
                sold_count: 0,
                visible: true
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Error adding product:', error);
            return null;
        }
    },
    
    // Update product
    async updateProduct(productId, updates) {
        if (!db) return false;
        
        try {
            const docRef = doc(db, 'products', productId);
            await updateDoc(docRef, {
                ...updates,
                updated_at: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error updating product:', error);
            return false;
        }
    },
    
    // Delete product
    async deleteProduct(productId) {
        if (!db) return false;
        
        try {
            await deleteDoc(doc(db, 'products', productId));
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            return false;
        }
    },
    
    // Get best sellers
    async getBestSellers(count = 10) {
        if (!db) return [];
        
        try {
            const q = query(
                collection(db, 'products'),
                where('visible', '==', true),
                where('bestSeller', '==', true),
                limit(count)
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching best sellers:', error);
            return [];
        }
    },
    
    // Increment view count
    async incrementViewCount(productId) {
        if (!db) return;
        
        try {
            const docRef = doc(db, 'products', productId);
            await updateDoc(docRef, {
                view_count: increment(1)
            });
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    }
};

// Order API functions
window.OrderAPI = {
    async createOrder(orderData) {
        if (!db) return null;
        
        try {
            const docRef = await addDoc(collection(db, 'orders'), {
                ...orderData,
                status: 'pending',
                created_at: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating order:', error);
            return null;
        }
    },
    
    async getOrders() {
        if (!db) return [];
        
        try {
            const q = query(
                collection(db, 'orders'),
                orderBy('created_at', 'desc')
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    },
    
    async updateOrderStatus(orderId, status) {
        if (!db) return false;
        
        try {
            await updateDoc(doc(db, 'orders', orderId), { status });
            return true;
        } catch (error) {
            console.error('Error updating order:', error);
            return false;
        }
    }
};

// Review API functions
window.ReviewAPI = {
    async addReview(productId, reviewData) {
        if (!db) return null;
        
        try {
            const docRef = await addDoc(
                collection(db, 'products', productId, 'reviews'), 
                {
                    ...reviewData,
                    created_at: serverTimestamp()
                }
            );
            
            // Update product average rating
            await this.updateProductRating(productId);
            
            return docRef.id;
        } catch (error) {
            console.error('Error adding review:', error);
            return null;
        }
    },
    
    async getReviews(productId) {
        if (!db) return [];
        
        try {
            const q = query(
                collection(db, 'products', productId, 'reviews'),
                orderBy('created_at', 'desc')
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
    },
    
    async updateProductRating(productId) {
        if (!db) return;
        
        try {
            const reviews = await this.getReviews(productId);
            
            if (reviews.length === 0) return;
            
            const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
            const average = (sum / reviews.length).toFixed(1);
            
            await updateDoc(doc(db, 'products', productId), {
                rating_average: parseFloat(average),
                rating_count: reviews.length
            });
        } catch (error) {
            console.error('Error updating rating:', error);
        }
    }
};

// Admin Authentication
window.AdminAuth = {
    async login(email, password) {
        if (!auth) return null;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            return null;
        }
    },
    
    async logout() {
        if (!auth) return;
        
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    },
    
    onAuthChange(callback) {
        if (!auth) return () => {};
        
        return onAuthStateChanged(auth, callback);
    }
};

// Export initialization
console.log('Firebase API loaded. Call initFirebase() to initialize.');
