/**
 * Tiqtaqo E-commerce - Main JavaScript
 * Refactored for Firebase Backend with Pagination Support
 * Supports 100,000+ products with smooth performance
 * Version: 4 (with screen diagnostic panel)
 */

// Screen diagnostic function
function updateDiagnostic(message, type = 'info') {
    const panel = document.getElementById('diagnostic-content');
    if (!panel) return;
    
    const div = document.createElement('div');
    div.className = 'status-item ' + type;
    div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
    panel.appendChild(div);
    panel.scrollTop = panel.scrollHeight;
    
    // Also log to console
    console.log(message);
}

console.log('main.js loaded - version 4');
updateDiagnostic('main.js loaded', 'success');
updateDiagnostic('window.ProductAPI: ' + (window.ProductAPI !== undefined ? 'available' : 'undefined'), 
    window.ProductAPI !== undefined ? 'success' : 'warning');

// Initialize Firebase on page load - but wait for firebase-config to load
document.addEventListener('DOMContentLoaded', async function() {
    updateDiagnostic('DOMContentLoaded fired', 'info');
    updateDiagnostic('window.initFirebase: ' + (typeof window.initFirebase), 
        typeof window.initFirebase === 'function' ? 'success' : 'error');
    
    // Wait for Firebase to be initialized
    if (typeof window.initFirebase === 'function') {
        updateDiagnostic('Calling initFirebase from main.js', 'success');
        initFirebase();
    } else {
        updateDiagnostic('initFirebase not available, waiting...', 'warning');
        // Wait up to 3 seconds for Firebase to initialize
        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (typeof window.initFirebase === 'function') {
                updateDiagnostic('Firebase initialized after ' + (i * 100) + 'ms delay', 'success');
                initFirebase();
                break;
            }
            if (i === 29) {
                updateDiagnostic('ERROR: Firebase not initialized after 3 seconds!', 'error');
                updateDiagnostic('This means firebase-config.js may not be loaded properly', 'error');
            }
        }
    }
    
    updateDiagnostic('After initFirebase - window.ProductAPI: ' + (window.ProductAPI !== undefined ? 'available' : 'undefined'),
        window.ProductAPI !== undefined ? 'success' : 'error');
    
    // Now that Firebase is initialized, load products
    updateDiagnostic('Loading best sellers and collections...', 'info');
    
    // Load best sellers if grid exists
    if (document.getElementById('bestSellersGrid')) {
        updateDiagnostic('Calling loadBestSellers()...', 'info');
        loadBestSellers();
    }
    
    // Load collections if grid exists
    if (document.getElementById('collectionsGrid')) {
        updateDiagnostic('Calling loadCollections()...', 'info');
        loadCollections();
    }
});

// ===== Enhanced Icon Mapping for Collections =====
const collectionIcons = {
    'packs': {
        icon: 'fa-gift',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        description: 'Ensembles complets pour un style parfait'
    },
    'homme': {
        icon: 'fa-user-tie',
        gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        description: 'Montres masculines raffinées'
    },
    'femme': {
        icon: 'fa-crown',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        description: 'Élégance féminine intemporelle'
    },
    'accessoires': {
        icon: 'fa-gem',
        gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
        description: 'Complétez votre look avec style'
    },
    'wallets': {
        icon: 'fa-wallet',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        description: 'Portefeuilles en cuir premium'
    },
    'belts': {
        icon: 'fa-ribbon',
        gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
        description: 'Ceintures élégantes et durables'
    },
    'glasses': {
        icon: 'fa-glasses',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        description: 'Lunettes de soleil et de vue'
    }
};

// ===== Categories Management =====

// Get categories from Firebase or localStorage fallback
async function getCategories() {
    try {
        // Try to fetch from Firebase if available
        if (window.CategoriesAPI && typeof CategoriesAPI.getAll === 'function') {
            const categories = await CategoriesAPI.getAll();
            if (categories && categories.length > 0) {
                return categories;
            }
        }
    } catch (e) {
        console.log('Using local categories');
    }

    // Fallback to localStorage or default categories
    const localCategories = localStorage.getItem('luxury_categories');
    if (localCategories) {
        return JSON.parse(localCategories);
    }

    // Default categories
    const defaultCategories = [
        { id: 'packs', name: 'Packs', icon: 'fa-gift', visible: true, order: 1 },
        { id: 'homme', name: 'Homme', icon: 'fa-user-tie', visible: true, order: 2 },
        { id: 'femme', name: 'Femme', icon: 'fa-crown', visible: true, order: 3 },
        { id: 'wallets', name: 'Wallets', icon: 'fa-wallet', visible: true, order: 4 },
        { id: 'belts', name: 'Belts', icon: 'fa-ribbon', visible: true, order: 5 },
        { id: 'glasses', name: 'Glasses', icon: 'fa-glasses', visible: true, order: 6 },
        { id: 'accessoires', name: 'Accessoires', icon: 'fa-gem', visible: true, order: 7 }
    ];
    
    localStorage.setItem('luxury_categories', JSON.stringify(defaultCategories));
    return defaultCategories;
}

// Load collections dynamically
async function loadCollections() {
    if (typeof updateDiagnostic === 'function') {
        updateDiagnostic('loadCollections() called', 'info');
    }
    
    const categories = await getCategories();
    const collectionsGrid = document.getElementById('collectionsGrid');
    
    if (!collectionsGrid) return;
    
    if (typeof updateDiagnostic === 'function') {
        updateDiagnostic('Rendering ' + categories.length + ' categories', 'success');
    }
    
    // Filter visible categories and sort by order
    const visibleCategories = categories
        .filter(cat => cat.visible)
        .sort((a, b) => a.order - b.order);
    
    // Categories that have gender branches
    const branchCategories = ['packs', 'wallets', 'glasses', 'accessoires'];
    
    collectionsGrid.innerHTML = visibleCategories.map(category => {
        const iconData = collectionIcons[category.id] || {
            icon: category.icon || 'fa-box',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            description: 'Découvrez notre collection'
        };
        
        const linkUrl = branchCategories.includes(category.id) 
            ? `${category.id}-select.html` 
            : `${category.id}.html`;
        
        return `
            <div class="collection-card" onclick="location.href='${linkUrl}'">
                <div class="card-image" style="background: ${iconData.gradient};">
                    <i class="fas ${iconData.icon}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${iconData.description}</p>
                <button class="btn-secondary">Explorer</button>
            </div>
        `;
    }).join('');
}

// ===== Products Management with Firebase & Pagination =====

// Get products from Firebase with pagination and filtering
async function getProducts(options = {}) {
    const {
        category = null,
        gender = null,
        minPrice = 0,
        maxPrice = 100000,
        searchTerm = '',
        pageSize = 24,
        lastDoc = null,
        sortBy = 'created_at',
        forceRefresh = true // Always force refresh to get latest data
    } = options;

    updateDiagnostic('getProducts called - category: ' + (category || 'all') + ', forceRefresh: ' + forceRefresh);
    
    // Use Firebase API if available
    if (window.ProductAPI && typeof ProductAPI.getProducts === 'function') {
        updateDiagnostic('Using Firebase API (window.ProductAPI available)', 'success');
        try {
            const result = await ProductAPI.getProducts({
                category,
                gender,
                minPrice,
                maxPrice,
                searchTerm,
                pageSize,
                lastDoc,
                sortBy,
                forceRefresh // Pass forceRefresh to Firebase
            });
            const productCount = result.products ? result.products.length : 0;
            updateDiagnostic('Firebase returned ' + productCount + ' products', productCount > 0 ? 'success' : 'warning');
            return result;
        } catch (error) {
            updateDiagnostic('Firebase ERROR: ' + error.message, 'error');
            return { products: [], hasMore: false };
        }
    }

    // ProductAPI not available - this is an error condition
    updateDiagnostic('ERROR: ProductAPI not available! Firebase not initialized.', 'error');
    updateDiagnostic('This means firebase-config.js is not loaded or has an error', 'error');
    return { products: [], hasMore: false };
    if (localProducts) {
        let products = JSON.parse(localProducts);
        
        // Apply filters locally
        if (category) {
            products = products.filter(p => p.category === category);
        }
        if (gender) {
            products = products.filter(p => p.gender === gender);
        }
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            products = products.filter(p => 
                p.name?.toLowerCase().includes(searchLower) ||
                p.description?.toLowerCase().includes(searchLower)
            );
        }
        
        return {
            products: products.slice(0, pageSize),
            hasMore: products.length > pageSize
        };
    }

    return { products: [], hasMore: false };
}

// Get single product by ID
async function getProduct(productId, forceRefresh = true) {
    // Try Firebase first
    if (window.ProductAPI && typeof ProductAPI.getProduct === 'function') {
        try {
            const product = await ProductAPI.getProduct(productId);
            if (product) return product;
        } catch (error) {
            console.error('Error fetching product from Firebase:', error);
        }
    }

    // Fallback to localStorage
    const products = JSON.parse(localStorage.getItem('luxury_products') || '[]');
    return products.find(p => p.id === productId) || null;
}

// Get product reviews from Firebase
async function getProductReviews(productId) {
    if (window.ReviewAPI && typeof ReviewAPI.getReviews === 'function') {
        try {
            return await ReviewAPI.getReviews(productId);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    }

    // Fallback
    const products = JSON.parse(localStorage.getItem('luxury_products') || '[]');
    const product = products.find(p => p.id === productId);
    return product?.reviews || [];
}

// Get product average rating
async function getProductRating(productId) {
    const reviews = await getProductReviews(productId);
    if (reviews.length === 0) return null;
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return {
        average: (sum / reviews.length).toFixed(1),
        count: reviews.length
    };
}

// Add a new review
async function addProductReview(productId, reviewData) {
    if (window.ReviewAPI && typeof ReviewAPI.addReview === 'function') {
        try {
            const reviewId = await ReviewAPI.addReview(productId, reviewData);
            if (reviewId) return { id: reviewId, ...reviewData };
        } catch (error) {
            console.error('Error adding review:', error);
        }
    }

    // Fallback to localStorage
    const products = JSON.parse(localStorage.getItem('luxury_products') || '[]');
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
        const newReview = {
            id: 'REV-' + Date.now().toString(36).toUpperCase(),
            ...reviewData,
            createdAt: new Date().toISOString()
        };
        
        if (!products[productIndex].reviews) {
            products[productIndex].reviews = [];
        }
        products[productIndex].reviews.push(newReview);
        localStorage.setItem('luxury_products', JSON.stringify(products));
        return newReview;
    }
    return null;
}

// ===== Product Filtering and Sorting =====

// Filter products based on criteria (client-side for Firebase fallback)
function filterProducts(products, filters) {
    return products.filter(product => {
        // Price filter
        if (filters.minPrice !== undefined && product.price < filters.minPrice) {
            return false;
        }
        if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
            return false;
        }
        
        // Category filter
        if (filters.categories && filters.categories.length > 0) {
            if (!filters.categories.includes(product.category)) {
                return false;
            }
        }
        
        // Gender filter
        if (filters.genders && filters.genders.length > 0) {
            const genderBranches = ['packs', 'wallets', 'glasses', 'accessoires', 'belts'];
            if (genderBranches.includes(product.category)) {
                if (!filters.genders.includes(product.gender || 'homme')) {
                    return false;
                }
            } else {
                if (product.gender && !filters.genders.includes(product.gender)) {
                    return false;
                }
            }
        }
        
        // Visibility filter
        if (filters.visibleOnly !== false && !product.visible) {
            return false;
        }
        
        return true;
    });
}

// Sort products based on criteria
function sortProducts(products, sortBy) {
    const sorted = [...products];
    
    switch (sortBy) {
        case 'price_asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price_desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'newest':
            return sorted.sort((a, b) => b.created_at?.localeCompare(a.created_at) || b.id.localeCompare(a.id));
        case 'popular':
        case 'bestseller':
            return sorted.sort((a, b) => {
                if (a.bestSeller && !b.bestSeller) return -1;
                if (!a.bestSeller && b.bestSeller) return 1;
                return 0;
            });
        default:
            return sorted;
    }
}

// ===== Load Products with Infinite Scroll Support =====

// State for pagination
let productsState = {
    category: null,
    gender: null,
    filters: {},
    sortBy: 'newest',
    lastDoc: null,
    hasMore: true,
    loading: false,
    products: []
};

// Load filtered and sorted products for category page with pagination
async function loadFilteredCategoryProducts(category, append = false) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    // Show loading
    if (!append) {
        productsGrid.innerHTML = `
            <div class="loading-products" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #d4af37; margin-bottom: 20px;"></i>
                <p style="color: #666;">Chargement des produits...</p>
            </div>
        `;
    }
    
    // Get filter values
    const filters = {
        minPrice: parseFloat(document.getElementById('filterMinPrice')?.value) || 0,
        maxPrice: parseFloat(document.getElementById('filterMaxPrice')?.value) || 100000,
        categories: [category],
        genders: getSelectedFilters('filterGender'),
        visibleOnly: true
    };
    
    const sortBy = document.getElementById('sortSelect')?.value || 'newest';
    
    // Update state
    productsState.category = category;
    productsState.filters = filters;
    productsState.sortBy = sortBy;
    productsState.loading = true;
    
    try {
        // Fetch from Firebase with pagination
        const result = await getProducts({
            category,
            gender: filters.genders.length > 0 ? filters.genders[0] : null,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            pageSize: 24,
            lastDoc: append ? productsState.lastDoc : null,
            sortBy: sortBy === 'newest' ? 'created_at' : sortBy
        });
        
        let products = result.products || [];
        
        // Apply client-side filtering for search and complex filters
        if (filters.genders.length > 0) {
            const genderBranches = ['packs', 'wallets', 'glasses', 'accessoires', 'belts'];
            if (!genderBranches.includes(category)) {
                // For categories without gender branches, show all products
            }
        }
        
        // Sort products client-side
        products = sortProducts(products, sortBy);
        
        // Update state
        if (append) {
            productsState.products = [...productsState.products, ...products];
        } else {
            productsState.products = products;
        }
        productsState.lastDoc = result.lastDoc;
        productsState.hasMore = result.hasMore;
        
        // Render products
        renderProductsGrid(productsGrid, productsState.products, append);
        
    } catch (error) {
        console.error('Error loading products:', error);
        if (!append) {
            productsGrid.innerHTML = `
                <div class="error-loading" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 60px; color: #f59e0b; margin-bottom: 20px;"></i>
                    <h3 style="color: #666; margin-bottom: 10px;">Erreur de chargement</h3>
                    <p style="color: #999; margin-bottom: 20px;">Veuillez réessayer ultérieurement</p>
                    <button class="btn-primary" onclick="loadFilteredCategoryProducts('${category}')">
                        <i class="fas fa-redo"></i> Réessayer
                    </button>
                </div>
            `;
        }
    }
    
    productsState.loading = false;
}

// Render products grid
function renderProductsGrid(productsGrid, products, append = false) {
    if (!append) {
        productsGrid.innerHTML = '';
    }
    
    if (products.length === 0 && !append) {
        productsGrid.innerHTML = `
            <div class="no-products" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-search" style="font-size: 60px; color: #ddd; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">Aucun produit trouvé</h3>
                <p style="color: #999; margin-bottom: 20px;">Essayez de modifier vos filtres</p>
                <button class="btn-primary" onclick="resetFilters()">
                    <i class="fas fa-redo"></i> Réinitialiser les filtres
                </button>
            </div>
        `;
        return;
    }
    
    const html = products.map((product, index) => {
        const hasPromotion = product.promotion && product.promotion > 0;
        const finalPrice = hasPromotion 
            ? product.price - (product.price * product.promotion / 100)
            : product.price;
        
        // Get rating info
        const rating = product.rating_average ? {
            average: product.rating_average,
            count: product.rating_count
        } : null;
        const starsHtml = renderStarRating(rating);
        
        // Use images array if available, otherwise fall back to product.image
        const productImage = (product.images && product.images.length > 0) 
            ? product.images[0] 
            : (product.image || '');
        
        return `
            <div class="product-card scroll-animate stagger-${(index % 6) + 1}" 
                 onclick="location.href='product.html?id=${product.id}'" 
                 style="cursor: pointer;">
                ${hasPromotion ? `<div class="product-badge">-${product.promotion}%</div>` : ''}
                ${product.bestSeller ? `<div class="best-seller-badge"><i class="fas fa-fire"></i> Best-Seller</div>` : ''}
                <div class="product-image-container">
                    <img src="${productImage}" alt="${product.name}" 
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2218%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage%3C/text%3E%3C/svg%3E'">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-rating">${starsHtml}</div>
                    <p>${product.description || ''}</p>
                    <div class="product-price">
                        ${hasPromotion ? `<span class="old-price">${product.price} DH</span>` : ''}
                        <span class="price">${Math.round(finalPrice)} DH</span>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" style="flex: 1;" onclick="event.stopPropagation(); openOrderModal('${product.id}')">
                            <i class="fas fa-shopping-cart"></i> Commander
                        </button>
                        <button class="btn-secondary" style="padding: 12px;" onclick="event.stopPropagation(); addToCart(${JSON.stringify(product).replace(/'/g, "\\'")})" title="Ajouter au panier">
                            <i class="fas fa-shopping-bag"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    productsGrid.innerHTML = html;
    
    // Re-initialize scroll animations
    initScrollAnimations();
}

// Load more products (infinite scroll)
async function loadMoreProducts() {
    if (productsState.loading || !productsState.hasMore) return;
    
    productsState.loading = true;
    await loadFilteredCategoryProducts(productsState.category, true);
}

// Initialize infinite scroll
function initInfiniteScroll() {
    const productsSection = document.querySelector('.products-section, #productsSection');
    if (!productsSection) return;
    
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'infiniteScrollLoading';
    loadingIndicator.className = 'infinite-scroll-loading';
    loadingIndicator.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        <span>Chargement de plus de produits...</span>
    `;
    loadingIndicator.style.cssText = `
        display: none;
        text-align: center;
        padding: 30px;
        color: #666;
    `;
    productsSection.appendChild(loadingIndicator);
    
    // Intersection Observer for infinite scroll
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && productsState.hasMore && !productsState.loading) {
                    loadMoreProducts();
                }
            });
        }, {
            rootMargin: '200px'
        });
        
        // Observe loading indicator
        const sentinel = document.createElement('div');
        sentinel.id = 'scrollSentinel';
        sentinel.style.cssText = 'height: 20px; margin: 20px 0;';
        productsSection.appendChild(sentinel);
        observer.observe(sentinel);
    }
}

// ===== Render Star Rating Display =====
function renderStarRating(rating) {
    if (!rating) {
        return '<div class="stars" style="color: #ddd;"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><span class="rating-count">(0)</span></div>';
    }
    
    const fullStars = Math.floor(rating.average);
    const hasHalfStar = rating.average % 1 >= 0.5;
    let starsHtml = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '<i class="fas fa-star" style="color: #d4af37;"></i>';
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt" style="color: #d4af37;"></i>';
        } else {
            starsHtml += '<i class="fas fa-star" style="color: #ddd;"></i>';
        }
    }
    
    return `<div class="stars">${starsHtml}<span class="rating-count">(${rating.count})</span></div>`;
}

// ===== Filter Management =====

// Get selected filter values
function getSelectedFilters(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

// Reset all filters
async function resetFilters() {
    // Reset price inputs
    const minPriceInput = document.getElementById('filterMinPrice');
    const maxPriceInput = document.getElementById('filterMaxPrice');
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    
    // Uncheck all checkboxes
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    
    // Reset sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'newest';
    
    // Reset pagination state
    productsState.lastDoc = null;
    productsState.hasMore = true;
    
    // Reload products
    const currentCategory = getCurrentCategory();
    if (currentCategory) {
        await loadFilteredCategoryProducts(currentCategory);
    }
}

// Get current category from URL or page
function getCurrentCategory() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) return categoryParam;
    
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '');
    
    if (filename.endsWith('-homme')) return filename.replace('-homme', '');
    if (filename.endsWith('-femme')) return filename.replace('-femme', '');
    
    return filename;
}

// Load products for specific category (legacy function)
async function loadCategoryProducts(category) {
    await loadFilteredCategoryProducts(category);
}

// Initialize filter sidebar
async function initFilterSidebar() {
    const filterSection = document.getElementById('filterSection');
    if (!filterSection) return;
    
    const categories = await getCategories();
    const currentCategory = getCurrentCategory();
    
    // Get price range from products
    const result = await getProducts({ category: currentCategory, pageSize: 100, forceRefresh: true });
    const products = result.products || [];
    const maxProductPrice = products.length > 0 
        ? Math.max(...products.map(p => p.price || 0)) 
        : 1000;
    
    filterSection.innerHTML = `
        <div class="filter-sidebar">
            <div class="filter-header">
                <h3><i class="fas fa-filter"></i> Filtres</h3>
                <button class="reset-filters-btn" onclick="resetFilters()">
                    <i class="fas fa-redo"></i> Réinitialiser
                </button>
            </div>
            
            <!-- Price Filter -->
            <div class="filter-group">
                <h4><i class="fas fa-tag"></i> Prix</h4>
                <div class="price-inputs">
                    <input type="number" id="filterMinPrice" placeholder="Min" min="0" onchange="applyFilters()">
                    <span>-</span>
                    <input type="number" id="filterMaxPrice" placeholder="Max" min="0" onchange="applyFilters()">
                </div>
                <p class="filter-hint">Prix jusqu'à ${maxProductPrice} DH</p>
            </div>
            
            <!-- Gender Filter (for branched categories) -->
            <div class="filter-group" id="genderFilterGroup">
                <h4><i class="fas fa-users"></i> Genre</h4>
                <label class="filter-checkbox-label">
                    <input type="checkbox" name="filterGender" value="homme" onchange="applyFilters()">
                    <span class="checkmark"></span>
                    Homme
                </label>
                <label class="filter-checkbox-label">
                    <input type="checkbox" name="filterGender" value="femme" onchange="applyFilters()">
                    <span class="checkmark"></span>
                    Femme
                </label>
            </div>
            
            <!-- Sort Options -->
            <div class="filter-group">
                <h4><i class="fas fa-sort"></i> Trier par</h4>
                <select id="sortSelect" onchange="applyFilters()">
                    <option value="newest">Plus récents</option>
                    <option value="price_asc">Prix: croissant</option>
                    <option value="price_desc">Prix: décroissant</option>
                    <option value="popular">Populaires</option>
                    <option value="bestseller">Best-Sellers</option>
                </select>
            </div>
            
            <!-- Apply Button (Mobile) -->
            <button class="apply-filters-btn" onclick="closeMobileFilters()">
                <i class="fas fa-check"></i> Appliquer
            </button>
        </div>
    `;
    
    addFilterStyles();
}

// Apply filters and reload products
async function applyFilters() {
    productsState.lastDoc = null;
    productsState.hasMore = true;
    
    const currentCategory = getCurrentCategory();
    if (currentCategory) {
        await loadFilteredCategoryProducts(currentCategory);
    }
}

// Close mobile filters
function closeMobileFilters() {
    const filterSidebar = document.getElementById('filterSection');
    const mobileToggle = document.querySelector('.mobile-filter-toggle');
    if (filterSidebar) {
        filterSidebar.classList.remove('active');
    }
    if (mobileToggle) {
        mobileToggle.classList.remove('active');
    }
    document.body.style.overflow = '';
}

// Toggle mobile filters
function toggleMobileFilters() {
    const filterSidebar = document.getElementById('filterSection');
    const mobileToggle = document.querySelector('.mobile-filter-toggle');
    if (filterSidebar) {
        filterSidebar.classList.toggle('active');
        if (filterSidebar.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            if (mobileToggle) mobileToggle.classList.add('active');
        } else {
            document.body.style.overflow = '';
            if (mobileToggle) mobileToggle.classList.remove('active');
        }
    }
}

// ===== Best Sellers =====

// Get best sellers from Firebase
async function getBestSellers() {
    if (window.ProductAPI && typeof ProductAPI.getBestSellers === 'function') {
        try {
            return await ProductAPI.getBestSellers(10);
        } catch (error) {
            console.error('Error fetching best sellers:', error);
        }
    }
    
    // Fallback
    const products = JSON.parse(localStorage.getItem('luxury_products') || '[]');
    return products.filter(p => p.bestSeller && p.visible);
}

// Load best sellers
async function loadBestSellers() {
    if (typeof updateDiagnostic === 'function') {
        updateDiagnostic('loadBestSellers() called', 'info');
    }
    
    const bestSellersGrid = document.getElementById('bestSellersGrid');
    if (!bestSellersGrid) return;
    
    if (typeof updateDiagnostic === 'function') {
        updateDiagnostic('bestSellersGrid found, calling getBestSellers()...', 'info');
    }
    
    const bestSellers = await getBestSellers();
    
    if (typeof updateDiagnostic === 'function') {
        updateDiagnostic('getBestSellers() returned ' + bestSellers.length + ' products', 
            bestSellers.length > 0 ? 'success' : 'warning');
    }
    
    if (bestSellers.length === 0) {
        bestSellersGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-fire"></i>
                <p>Aucun best-seller disponible pour le moment</p>
            </div>
        `;
        return;
    }
    
    bestSellersGrid.innerHTML = bestSellers.map((product, index) => {
        const hasPromotion = product.promotion && product.promotion > 0;
        const finalPrice = hasPromotion 
            ? product.price - (product.price * product.promotion / 100)
            : product.price;
        
        const rating = product.rating_average ? {
            average: product.rating_average,
            count: product.rating_count
        } : null;
        const starsHtml = renderStarRating(rating);
        
        const productImage = (product.images && product.images.length > 0) 
            ? product.images[0] 
            : (product.image || '');
        
        return `
            <div class="product-card best-seller scroll-animate stagger-${(index % 6) + 1}" 
                 onclick="location.href='product.html?id=${product.id}'" 
                 style="cursor: pointer;">
                <div class="best-seller-badge">
                    <i class="fas fa-fire"></i>
                    Best-Seller
                </div>
                ${hasPromotion ? `<div class="product-badge">-${product.promotion}%</div>` : ''}
                <div class="product-image-container">
                    <img src="${productImage}" alt="${product.name}" 
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2218%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage%3C/text%3E%3C/svg%3E'">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-rating">${starsHtml}</div>
                    <p>${product.description || ''}</p>
                    <div class="product-price">
                        ${hasPromotion ? `<span class="old-price">${product.price} DH</span>` : ''}
                        <span class="price">${Math.round(finalPrice)} DH</span>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" style="flex: 1;" onclick="event.stopPropagation(); openOrderModal('${product.id}')">
                            <i class="fas fa-shopping-cart"></i> Commander
                        </button>
                        <button class="btn-secondary" style="padding: 12px;" onclick="event.stopPropagation(); addToCart(${JSON.stringify(product).replace(/'/g, "\\'")})" title="Ajouter au panier">
                            <i class="fas fa-shopping-bag"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    initScrollAnimations();
}

// ===== Search Functionality =====

// Search products
async function searchProducts(query) {
    if (!query || query.length < 2) return [];
    
    // Use Firebase search if available
    if (window.ProductAPI && typeof ProductAPI.getProducts === 'function') {
        const result = await ProductAPI.getProducts({
            searchTerm: query,
            pageSize: 10,
            forceRefresh: true
        });
        return result.products || [];
    }
    
    // Fallback to localStorage
    const products = JSON.parse(localStorage.getItem('luxury_products') || '[]');
    const queryLower = query.toLowerCase();
    
    return products.filter(product => {
        return product.visible && (
            (product.name && product.name.toLowerCase().includes(queryLower)) ||
            (product.description && product.description.toLowerCase().includes(queryLower)) ||
            (product.category && product.category.toLowerCase().includes(queryLower))
        );
    }).slice(0, 10);
}

// ===== WhatsApp Contact =====
function contactWhatsApp(productName, price) {
    const phoneNumber = '212674743106';
    const message = `Bonjour, je suis intéressé(e) par: ${productName} - ${price} DH`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// ===== Sidebar Functionality =====
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const overlay = document.getElementById('overlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
    
    // Load collections on homepage
    if (document.getElementById('collectionsGrid')) {
        loadCollections();
    }
    
    // Load products on category pages
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    if (['homme', 'femme', 'packs', 'accessoires', 'wallets', 'belts', 'glasses'].includes(currentPage)) {
        initFilterSidebar();
        
        const productsSection = document.querySelector('.products-section, #productsSection');
        if (productsSection) {
            const mobileToggle = document.createElement('button');
            mobileToggle.className = 'mobile-filter-toggle';
            mobileToggle.innerHTML = '<i class="fas fa-filter"></i> Filtrer et Trier';
            mobileToggle.onclick = toggleMobileFilters;
            productsSection.insertBefore(mobileToggle, productsSection.firstChild);
        }
        
        loadCategoryProducts(currentPage);
        initInfiniteScroll();
    }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== Search Functionality (Desktop) =====
document.addEventListener('DOMContentLoaded', async function() {
    const desktopSearchContainer = document.querySelector('.search-container.desktop-search');
    const desktopSearchInput = document.getElementById('desktopSearchInput');
    const desktopSearchBtn = document.getElementById('desktopSearchBtn');
    
    if (desktopSearchBtn && desktopSearchContainer && desktopSearchInput) {
        desktopSearchBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            desktopSearchContainer.classList.toggle('active');
            if (desktopSearchContainer.classList.contains('active')) {
                desktopSearchInput.focus();
            }
        });
        
        desktopSearchInput.addEventListener('input', debounce(async function(e) {
            const query = e.target.value.trim().toLowerCase();
            let searchResults = desktopSearchContainer.querySelector('.search-results');
            
            if (query.length < 2) {
                if (searchResults) {
                    searchResults.remove();
                }
                return;
            }
            
            const products = await searchProducts(query);
            
            if (products.length === 0) {
                if (searchResults) {
                    searchResults.remove();
                }
            } else {
                if (!searchResults) {
                    searchResults = document.createElement('div');
                    searchResults.className = 'search-results';
                    desktopSearchContainer.appendChild(searchResults);
                }
                
                searchResults.innerHTML = products.map(product => {
                    const hasPromotion = product.promotion && product.promotion > 0;
                    const finalPrice = hasPromotion 
                        ? product.price - (product.price * product.promotion / 100)
                        : product.price;
                    
                    const imageUrl = (product.images && product.images.length > 0) 
                        ? product.images[0] 
                        : (product.image || '');
                    const rating = product.rating_average ? {
                        average: product.rating_average,
                        count: product.rating_count
                    } : null;
                    
                    return `
                        <div class="search-result-item" onclick="viewProduct('${product.id}')">
                            <div class="search-result-image">
                                ${imageUrl ? 
                                    `<img src="${imageUrl}" alt="${product.name}" onerror="this.innerHTML='<i class=\\'fas fa-box\\'></i>'">` : 
                                    '<i class="fas fa-box"></i>'}
                            </div>
                            <div class="search-result-info">
                                <h4>${product.name}</h4>
                                <div class="search-result-price">
                                    <span class="price">${Math.round(finalPrice)} DH</span>
                                    ${rating ? `<span class="rating">★ ${rating.average}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }, 300));
        
        document.addEventListener('click', function(e) {
            if (!desktopSearchContainer.contains(e.target)) {
                desktopSearchContainer.classList.remove('active');
                const searchResults = desktopSearchContainer.querySelector('.search-results');
                if (searchResults) {
                    searchResults.remove();
                }
            }
        });
    }
    
    // ===== Search Modal Functionality (Mobile) =====
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const searchModal = document.getElementById('searchModal');
    const closeSearchModal = document.getElementById('closeSearchModal');
    const searchModalInput = document.getElementById('searchModalInput');
    const searchModalResults = document.getElementById('searchModalResults');
    
    if (mobileSearchBtn && searchModal) {
        mobileSearchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            searchModal.classList.add('active');
            setTimeout(() => searchModalInput.focus(), 300);
        });
    }
    
    if (closeSearchModal && searchModal) {
        closeSearchModal.addEventListener('click', function() {
            searchModal.classList.remove('active');
        });
    }
    
    if (searchModal) {
        searchModal.addEventListener('click', function(e) {
            if (e.target === this) {
                searchModal.classList.remove('active');
            }
        });
    }
    
    if (searchModalInput && searchModalResults) {
        searchModalInput.addEventListener('input', debounce(async function(e) {
            const query = e.target.value.trim().toLowerCase();
            
            if (query.length < 2) {
                searchModalResults.innerHTML = `
                    <div class="search-modal-placeholder">
                        <i class="fas fa-search"></i>
                        <p>Tapez pour rechercher</p>
                    </div>
                `;
                return;
            }
            
            const products = await searchProducts(query);
            
            if (products.length === 0) {
                searchModalResults.innerHTML = `
                    <div class="search-modal-no-results">
                        <i class="fas fa-search"></i>
                        <p>Aucun produit trouvé pour "${query}"</p>
                    </div>
                `;
            } else {
                searchModalResults.innerHTML = products.map(product => {
                    const hasPromotion = product.promotion && product.promotion > 0;
                    const finalPrice = hasPromotion 
                        ? product.price - (product.price * product.promotion / 100)
                        : product.price;
                    
                    const imageUrl = (product.images && product.images.length > 0) 
                        ? product.images[0] 
                        : (product.image || '');
                    const rating = product.rating_average ? {
                        average: product.rating_average,
                        count: product.rating_count
                    } : null;
                    
                    return `
                        <div class="search-modal-item" onclick="viewProduct('${product.id}'); searchModal.classList.remove('active');">
                            <div class="search-modal-item-image">
                                ${imageUrl ? 
                                    `<img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : 
                                    '<i class="fas fa-box"></i>'}
                            </div>
                            <div class="search-modal-item-info">
                                <h4>${product.name}</h4>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span class="price">${Math.round(finalPrice)} DH</span>
                                    ${rating ? `<span style="color: #d4af37; font-size: 12px;">★ ${rating.average}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }, 300));
    }
});

// Debounce helper
function debounce(func, wait) {
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

// View product from search
function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// ===== Scroll to Top =====
function initScrollToTop() {
    const scrollTopBtn = document.querySelector('.scroll-top');
    if (!scrollTopBtn) return;
    
    window.addEventListener('scroll', debounce(function() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    }, 100));
    
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== Loading Animation =====
function showLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
}

function hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

// ===== Enhanced Sidebar =====
function initEnhancedSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const overlay = document.getElementById('overlay');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            sidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeSidebar && sidebar) {
        closeSidebar.addEventListener('click', function(e) {
            e.preventDefault();
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (overlay && sidebar) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

// ===== Initialize All Features =====
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize UI features here (Firebase loading is handled separately)
    initEnhancedSidebar();
    initCart();
    
    initScrollToTop();
    initScrollAnimations();
    
    // Load best sellers if grid exists (will use Firebase if available)
    if (document.getElementById('bestSellersGrid')) {
        // Delay slightly to ensure Firebase is initialized
        setTimeout(() => {
            updateDiagnostic('DOMContentLoaded: Calling loadBestSellers()', 'info');
            loadBestSellers();
        }, 100);
    }
    
    // Load collections if grid exists
    if (document.getElementById('collectionsGrid')) {
        setTimeout(() => {
            updateDiagnostic('DOMContentLoaded: Calling loadCollections()', 'info');
            loadCollections();
        }, 100);
    }
    
    window.addEventListener('load', function() {
        hideLoading();
    });
});

// ===== Cart Functionality =====
const CART_STORAGE_KEY = 'tiqtaqo_cart';

function getCart() {
    try {
        const cart = localStorage.getItem(CART_STORAGE_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch (e) {
        console.error('Error reading cart:', e);
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error('Error saving cart:', e);
    }
}

function addToCart(product, selectedColor = null, selectedColorHex = null) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id && item.color === selectedColor);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        let productImage = product.image;
        if (selectedColor && product.colors) {
            const colorObj = product.colors.find(c => c.name === selectedColor);
            if (colorObj && colorObj.image) {
                productImage = colorObj.image;
            }
        } else if (product.images && product.images.length > 0) {
            productImage = product.images[0];
        }
        
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: productImage,
            quantity: 1,
            color: selectedColor,
            colorHex: selectedColorHex
        });
    }
    
    saveCart(cart);
    updateCartUI();
    showNotification('Produit ajouté au panier!');
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    updateCartUI();
    showNotification('Produit retiré du panier');
}

function updateCartQuantity(productId, change) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        saveCart(cart);
        updateCartUI();
    }
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

function updateCartUI() {
    const cart = getCart();
    const cartBadge = document.getElementById('cartBadge');
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    const count = getCartCount();
    if (cartBadge) {
        cartBadge.textContent = count;
        cartBadge.style.display = count === 0 ? 'none' : 'flex';
    }
    if (cartCount) cartCount.textContent = count;
    
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-bag"></i>
                    <p>Votre panier est vide</p>
                    <button class="btn-primary" onclick="closeCartPanel()">Continuer vos achats</button>
                </div>
            `;
        } else {
            cartItems.innerHTML = cart.map((item, index) => `
                <div class="cart-item" style="animation-delay: ${index * 0.05}s">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}" onerror="this.innerHTML='<i class=\\'fas fa-box\\'></i>'">
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.name}</h4>
                        <div class="cart-item-price">${Math.round(item.price)} DH</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
    }
    
    if (cartTotal) {
        cartTotal.textContent = `${Math.round(getCartTotal()).toLocaleString()} MAD`;
    }
}

function initCart() {
    const cartToggle = document.getElementById('cartToggle');
    const cartPanel = document.getElementById('cartPanel');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCart = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cartToggle && cartPanel) {
        cartToggle.addEventListener('click', function() {
            cartPanel.classList.add('active');
            if (cartOverlay) cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    function closeCartPanel() {
        if (cartPanel) cartPanel.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', closeCartPanel);
    }
    
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCartPanel);
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            const cart = getCart();
            if (cart.length === 0) {
                showNotification('Votre panier est vide!', 'warning');
                return;
            }
            closeCartPanel();
            openCartOrderModal();
        });
    }
    
    updateCartUI();
}

function closeCartPanel() {
    const cartPanel = document.getElementById('cartPanel');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartPanel) cartPanel.classList.remove('active');
    if (cartOverlay) cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: linear-gradient(135deg, #25D366, #1DA851);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 5px 20px rgba(37, 211, 102, 0.4);
                z-index: 10000;
                animation: slideInUp 0.3s ease forwards;
            }
            .notification.warning {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                box-shadow: 0 5px 20px rgba(245, 158, 11, 0.4);
            }
            @keyframes slideInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideOutDown {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(20px); }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Make functions globally accessible
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.closeCartPanel = closeCartPanel;
window.openOrderModal = openOrderModal;
window.selectOrderColor = selectOrderColor;
window.resetFilters = resetFilters;
window.applyFilters = applyFilters;
window.toggleMobileFilters = toggleMobileFilters;
window.closeMobileFilters = closeMobileFilters;

// ===== Order Modal =====
function getOrderModalHTML() {
    return `
    <div class="order-modal" id="orderModal">
        <div class="order-modal-content">
            <div class="order-modal-header">
                <h3><i class="fas fa-clipboard-list"></i> Passer la commande</h3>
                <button class="close-order-modal" id="closeOrderModal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="order-product-summary" id="orderProductSummary"></div>
            <form id="orderForm" class="order-form">
                <input type="hidden" id="orderProductId" name="productId">
                <input type="hidden" id="orderProductName" name="productName">
                <input type="hidden" id="orderProductPrice" name="productPrice">
                
                <div class="form-group">
                    <label for="customerName"><i class="fas fa-user"></i> Nom complet *</label>
                    <input type="text" id="customerName" name="customerName" required 
                           placeholder="Entrez votre nom complet">
                </div>
                
                <div class="form-group">
                    <label for="customerPhone"><i class="fas fa-phone"></i> Numéro de téléphone *</label>
                    <input type="tel" id="customerPhone" name="customerPhone" required 
                           placeholder="Exemple: 06 12 34 56 78" dir="ltr">
                </div>
                
                <div class="form-group">
                    <label for="customerCity"><i class="fas fa-city"></i> Ville *</label>
                    <select id="customerCity" name="customerCity" required>
                        <option value="">Sélectionnez la ville</option>
                        <option value="casablanca">Casablanca</option>
                        <option value="rabat">Rabat</option>
                        <option value="marrakech">Marrakech</option>
                        <option value="fes">Fès</option>
                        <option value="tanger">Tanger</option>
                        <option value="agadir">Agadir</option>
                        <option value="meknes">Meknès</option>
                        <option value="oujda">Oujda</option>
                        <option value="kenitra">Kénitra</option>
                        <option value="tetouan">Tétouan</option>
                        <option value="safii">Safi</option>
                        <option value="benslimane">Benslimane</option>
                        <option value="berrechid">Berrechid</option>
                        <option value="eljadida">El Jadida</option>
                        <option value="settat">Settat</option>
                        <option value="khouribga">Khouribga</option>
                        <option value="benimellal">Béni Mellal</option>
                        <option value="mohammedia">Mohammedia</option>
                        <option value="autre">Autre ville</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="customerAddress"><i class="fas fa-map-marker-alt"></i> Adresse détaillée (optionnel)</label>
                    <textarea id="customerAddress" name="customerAddress" rows="3" 
                              placeholder="Adresse complète pour la livraison..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="orderNotes"><i class="fas fa-comment-alt"></i> Notes supplémentaires (optionnel)</label>
                    <textarea id="orderNotes" name="orderNotes" rows="2" 
                              placeholder="Cualquier remarque concernant la commande..."></textarea>
                </div>
                
                <button type="submit" class="submit-order-btn" id="submitOrderBtn">
                    <i class="fas fa-paper-plane"></i>
                    Envoyer la commande
                </button>
            </form>
            
            <div class="order-success" id="orderSuccess" style="display: none;">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Votre commande a été envoyée avec succès!</h3>
                <p>Notre équipe vous contactera sous peu pour confirmer</p>
                <button class="btn-primary" id="closeSuccessBtn">D'accord</button>
            </div>
        </div>
    </div>
    `;
}

// Open order modal
async function openOrderModal(productId, selectedColor = null, selectedColorHex = null) {
    const product = await getProduct(productId);
    
    if (!product) {
        showNotification('Produit non trouvé!', 'warning');
        return;
    }
    
    let orderModal = document.getElementById('orderModal');
    if (!orderModal) {
        document.body.insertAdjacentHTML('beforeend', getOrderModalHTML());
        orderModal = document.getElementById('orderModal');
        
        orderModal.querySelector('#orderForm').addEventListener('submit', handleOrderSubmit);
        orderModal.querySelector('#closeOrderModal').addEventListener('click', closeOrderModal);
        orderModal.querySelector('#closeSuccessBtn').addEventListener('click', closeOrderModal);
        orderModal.addEventListener('click', function(e) {
            if (e.target === this) closeOrderModal();
        });
        
        addOrderModalStyles();
    }
    
    const hasPromotion = product.promotion && product.promotion > 0;
    const finalPrice = hasPromotion 
        ? product.price - (product.price * product.promotion / 100)
        : product.price;
    
    document.getElementById('orderProductId').value = product.id;
    document.getElementById('orderProductName').value = product.name;
    document.getElementById('orderProductPrice').value = Math.round(finalPrice);
    
    let displayImage = product.image;
    if (selectedColor && product.colors) {
        const colorObj = product.colors.find(c => c.name === selectedColor);
        if (colorObj && colorObj.image) {
            displayImage = colorObj.image;
        }
    } else if (product.images && product.images.length > 0) {
        displayImage = product.images[0];
    }
    
    let colorSelectionHTML = '';
    if (product.colors && product.colors.length > 0) {
        colorSelectionHTML = `
            <div class="order-product-colors" style="margin-top: 10px;">
                <span style="font-size: 12px; color: #666; display: block; margin-bottom: 8px;">Couleur:</span>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${product.colors.map(color => `
                        <button type="button" 
                                class="order-color-btn ${selectedColor === color.name ? 'selected' : ''}"
                                data-color="${color.name}"
                                data-hex="${color.hex}"
                                data-image="${color.image || ''}"
                                style="
                                    width: 32px;
                                    height: 32px;
                                    border-radius: 50%;
                                    border: 3px solid ${selectedColor === color.name ? color.hex : '#ddd'};
                                    background: ${color.hex};
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    padding: 0;
                                "
                                onclick="selectOrderColor(this, '${color.name}', '${color.hex}', '${color.image || ''}')">
                            ${color.image ? `<img src="${color.image}" alt="${color.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : ''}
                        </button>
                    `).join('')}
                </div>
                ${selectedColor ? `<span id="selectedColorName" style="font-size: 13px; color: #333; margin-top: 5px; display: block;">${selectedColor}</span>` : ''}
            </div>
        `;
        orderModal.selectedColor = selectedColor;
        orderModal.selectedColorHex = selectedColorHex;
    }
    
    document.getElementById('orderProductSummary').innerHTML = `
        <div class="order-product-image">
            ${displayImage ? `<img src="${displayImage}" alt="${product.name}" onerror="this.innerHTML='<i class=\\'fas fa-box\\'></i>'">` : '<i class="fas fa-box"></i>'}
        </div>
        <div class="order-product-info">
            <h4>${product.name}</h4>
            <span class="price">${Math.round(finalPrice)} DH</span>
            ${colorSelectionHTML}
        </div>
    `;
    
    orderModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function selectOrderColor(btn, colorName, colorHex, colorImage) {
    const orderModal = document.getElementById('orderModal');
    if (!orderModal) return;
    
    const colorBtns = orderModal.querySelectorAll('.order-color-btn');
    colorBtns.forEach(b => {
        const hex = b.dataset.hex;
        b.style.borderColor = '#ddd';
        b.classList.remove('selected');
    });
    btn.style.borderColor = colorHex;
    btn.classList.add('selected');
    
    const colorNameSpan = orderModal.querySelector('#selectedColorName');
    if (colorNameSpan) {
        colorNameSpan.textContent = colorName;
    } else {
        const colorsContainer = orderModal.querySelector('.order-product-colors span');
        if (colorsContainer) {
            colorsContainer.insertAdjacentHTML('afterend', `<span id="selectedColorName" style="font-size: 13px; color: #333; margin-top: 5px; display: block;">${colorName}</span>`);
        }
    }
    
    if (colorImage) {
        const productImg = orderModal.querySelector('.order-product-image img');
        if (productImg) {
            productImg.src = colorImage;
        }
    }
    
    orderModal.selectedColor = colorName;
    orderModal.selectedColorHex = colorHex;
}

// Open order modal for cart
function openCartOrderModal() {
    const cart = getCart();
    
    if (cart.length === 0) {
        showNotification('Votre panier est vide!', 'warning');
        return;
    }
    
    let orderModal = document.getElementById('orderModal');
    if (!orderModal) {
        document.body.insertAdjacentHTML('beforeend', getOrderModalHTML());
        orderModal = document.getElementById('orderModal');
        
        orderModal.querySelector('#orderForm').addEventListener('submit', handleCartOrderSubmit);
        orderModal.querySelector('#closeOrderModal').addEventListener('click', closeOrderModal);
        orderModal.querySelector('#closeSuccessBtn').addEventListener('click', closeOrderModal);
        orderModal.addEventListener('click', function(e) {
            if (e.target === this) closeOrderModal();
        });
        
        addOrderModalStyles();
    }
    
    let cartSummaryHTML = '';
    let totalPrice = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        cartSummaryHTML += `
            <div class="cart-order-item" style="display: flex; align-items: center; gap: 15px; padding: 10px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
                <div class="cart-order-item-image" style="width: 60px; height: 60px; border-radius: 8px; overflow: hidden; background: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fas fa-box" style="color: #d4af37;"></i>'}
                </div>
                <div class="cart-order-item-info" style="flex: 1;">
                    <h4 style="font-size: 14px; margin: 0 0 5px 0; color: #1a1a1a;">${item.name}</h4>
                    <span style="font-size: 12px; color: #666;">${item.quantity} x ${Math.round(item.price)} DH</span>
                </div>
                <div class="cart-order-item-price" style="font-weight: 600; color: #d4af37; font-size: 14px;">
                    ${Math.round(itemTotal)} DH
                </div>
            </div>
        `;
    });
    
    const modalHeader = orderModal.querySelector('.order-modal-header h3');
    if (modalHeader) {
        modalHeader.innerHTML = '<i class="fas fa-shopping-cart"></i> Commander votre panier';
    }
    
    document.getElementById('orderProductId').value = 'CART-' + Date.now();
    document.getElementById('orderProductName').value = 'Panier (' + cart.length + ' produits)';
    document.getElementById('orderProductPrice').value = Math.round(totalPrice);
    
    orderModal.cartData = cart;
    orderModal.cartTotal = Math.round(totalPrice);
    
    document.getElementById('orderProductSummary').innerHTML = `
        <div style="width: 100%;">
            <div style="max-height: 200px; overflow-y: auto;">
                ${cartSummaryHTML}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 15px; border-top: 2px solid rgba(212, 175, 55, 0.3);">
                <span style="font-weight: 600; color: #1a1a1a;">Total:</span>
                <span style="font-weight: 700; color: #d4af37; font-size: 20px;">${Math.round(totalPrice)} DH</span>
            </div>
        </div>
    `;
    
    orderModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Handle cart order submission
async function handleCartOrderSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitOrderBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    
    const orderModal = document.getElementById('orderModal');
    const cart = orderModal.cartData || [];
    const cartTotal = orderModal.cartTotal || 0;
    
    let cartItemsSummary = '';
    cart.forEach(item => {
        const colorInfo = item.color ? ` - ${item.color}` : '';
        cartItemsSummary += `${item.name}${colorInfo} x${item.quantity}: ${Math.round(item.price * item.quantity)} DH\n`;
    });
    
    const orderData = {
        id: 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
        productId: document.getElementById('orderProductId').value,
        productName: document.getElementById('orderProductName').value,
        productPrice: cartTotal,
        cartItems: cart,
        cartItemsSummary: cartItemsSummary,
        customerName: document.getElementById('customerName').value,
        customerPhone: document.getElementById('customerPhone').value,
        city: document.getElementById('customerCity').value,
        address: document.getElementById('customerAddress').value,
        notes: document.getElementById('orderNotes').value,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    // Try Firebase first
    if (window.OrderAPI && typeof OrderAPI.createOrder === 'function') {
        try {
            const orderId = await OrderAPI.createOrder(orderData);
            if (orderId) {
                localStorage.removeItem('tiqtaqo_cart');
                updateCartUI();
                document.getElementById('orderForm').style.display = 'none';
                document.getElementById('orderSuccess').style.display = 'block';
                showNotification('Commande envoyée avec succès!');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer la commande';
                return;
            }
        } catch (error) {
            console.error('Error saving order to Firebase:', error);
        }
    }
    
    // Fallback to localStorage
    try {
        const orders = JSON.parse(localStorage.getItem('tiqtaqo_orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('tiqtaqo_orders', JSON.stringify(orders));
        
        localStorage.removeItem('tiqtaqo_cart');
        updateCartUI();
        
        document.getElementById('orderForm').style.display = 'none';
        document.getElementById('orderSuccess').style.display = 'block';
        
        showNotification('Commande envoyée avec succès!');
    } catch (error) {
        console.error('Error saving order:', error);
        showNotification('Erreur lors de l\'envoi de la commande', 'warning');
    }
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer la commande';
}

// Close order modal
function closeOrderModal() {
    const orderModal = document.getElementById('orderModal');
    if (orderModal) {
        orderModal.classList.remove('active');
        document.body.style.overflow = '';
        
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.reset();
            orderForm.style.display = 'block';
        }
        const orderSuccess = document.getElementById('orderSuccess');
        if (orderSuccess) {
            orderSuccess.style.display = 'none';
        }
        
        // Reset modal header
        const modalHeader = orderModal.querySelector('.order-modal-header h3');
        if (modalHeader) {
            modalHeader.innerHTML = '<i class="fas fa-clipboard-list"></i> Passer la commande';
        }
    }
}

// Handle order form submission
async function handleOrderSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitOrderBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    
    const orderModal = document.getElementById('orderModal');
    
    const orderData = {
        id: 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
        productId: document.getElementById('orderProductId').value,
        productName: document.getElementById('orderProductName').value,
        productPrice: parseFloat(document.getElementById('orderProductPrice').value),
        customerName: document.getElementById('customerName').value,
        customerPhone: document.getElementById('customerPhone').value,
        city: document.getElementById('customerCity').value,
        address: document.getElementById('customerAddress').value,
        notes: document.getElementById('orderNotes').value,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    if (orderModal && orderModal.selectedColor) {
        orderData.selectedColor = orderModal.selectedColor;
        orderData.selectedColorHex = orderModal.selectedColorHex;
    }
    
    // Try Firebase first
    if (window.OrderAPI && typeof OrderAPI.createOrder === 'function') {
        try {
            const orderId = await OrderAPI.createOrder(orderData);
            if (orderId) {
                document.getElementById('orderForm').style.display = 'none';
                document.getElementById('orderSuccess').style.display = 'block';
                showNotification('Commande envoyée avec succès!');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer la commande';
                return;
            }
        } catch (error) {
            console.error('Error saving order to Firebase:', error);
        }
    }
    
    // Fallback to localStorage
    try {
        const orders = JSON.parse(localStorage.getItem('tiqtaqo_orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('tiqtaqo_orders', JSON.stringify(orders));
        
        document.getElementById('orderForm').style.display = 'none';
        document.getElementById('orderSuccess').style.display = 'block';
        
        showNotification('Commande envoyée avec succès!');
    } catch (error) {
        console.error('Error saving order:', error);
        showNotification('Erreur lors de l\'envoi de la commande', 'warning');
    }
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer la commande';
}

// Add order modal styles
function addOrderModalStyles() {
    if (document.getElementById('order-modal-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'order-modal-styles';
    styles.textContent = `
        .order-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 10000; overflow-y: auto; padding: 20px; box-sizing: border-box; }
        .order-modal.active { display: flex; align-items: flex-start; justify-content: center; animation: fadeIn 0.3s ease; }
        .order-modal-content { background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%); border-radius: 20px; width: 100%; max-width: 500px; margin: 20px 0; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3); animation: slideDown 0.4s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .order-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 25px 30px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 20px 20px 0 0; }
        .order-modal-header h3 { color: #ffffff; font-size: 22px; margin: 0; display: flex; align-items: center; gap: 10px; }
        .order-modal-header h3 i { color: #d4af37; }
        .close-order-modal { background: none; border: none; color: #ffffff; font-size: 24px; cursor: pointer; transition: all 0.3s ease; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .close-order-modal:hover { background: rgba(255,255,255,0.1); transform: rotate(90deg); }
        .order-product-summary { background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%); padding: 20px 30px; border-bottom: 1px solid rgba(212, 175, 55, 0.3); display: flex; align-items: center; gap: 20px; }
        .order-product-image { width: 80px; height: 80px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
        .order-product-image img { width: 100%; height: 100%; object-fit: cover; }
        .order-product-image i { font-size: 32px; color: #d4af37; }
        .order-product-info { flex: 1; }
        .order-product-info h4 { color: #1a1a1a; font-size: 18px; margin: 0 0 5px 0; }
        .order-product-info .price { color: #d4af37; font-size: 20px; font-weight: 700; }
        .order-form { padding: 30px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: flex; align-items: center; gap: 8px; color: #1a1a1a; font-weight: 500; margin-bottom: 8px; font-size: 14px; }
        .form-group label i { color: #d4af37; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 14px 18px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 15px; font-family: 'Poppins', sans-serif; transition: all 0.3s ease; background: #ffffff; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #d4af37; box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1); }
        .form-group input::placeholder, .form-group textarea::placeholder { color: #999; }
        .form-group select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: left 15px center; padding-left: 40px; }
        .submit-order-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #d4af37 0%, #c9a227 100%); color: #1a1a1a; border: none; border-radius: 10px; font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 10px; }
        .submit-order-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3); }
        .submit-order-btn:disabled { background: #ccc; cursor: not-allowed; transform: none; }
        .order-success { text-align: center; padding: 50px 30px; }
        .success-icon { width: 100px; height: 100px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; animation: popIn 0.5s ease; }
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
        .success-icon i { font-size: 50px; color: #ffffff; }
        .order-success h3 { color: #28a745; font-size: 24px; margin: 0 0 10px 0; }
        .order-success p { color: #666; font-size: 16px; margin: 0 0 30px 0; }
        .order-success .btn-primary { padding: 14px 40px; }
        @media (max-width: 768px) { .order-modal { padding: 10px; } .order-modal-content { border-radius: 15px; } .order-modal-header { padding: 20px; } .order-modal-header h3 { font-size: 18px; } .order-product-summary { padding: 15px 20px; flex-direction: column; text-align: center; } .order-product-image { width: 100px; height: 100px; } .order-form { padding: 20px; } }
    `;
    document.head.appendChild(styles);
}

// ===== Scroll Animation =====
function initScrollAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        .scroll-animate { opacity: 0; transform: translateY(30px); transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .scroll-animate.animated { opacity: 1; transform: translateY(0); }
        .collection-card.scroll-animate { transform: translateY(40px) scale(0.95); }
        .collection-card.scroll-animate.animated { transform: translateY(0) scale(1); }
        .product-card.scroll-animate { transform: translateY(40px) scale(0.98); }
        .product-card.scroll-animate.animated { transform: translateY(0) scale(1); }
        .scroll-animate.stagger-1 { transition-delay: 0ms; }
        .scroll-animate.stagger-2 { transition-delay: 100ms; }
        .scroll-animate.stagger-3 { transition-delay: 200ms; }
        .scroll-animate.stagger-4 { transition-delay: 300ms; }
        .scroll-animate.stagger-5 { transition-delay: 400ms; }
        .scroll-animate.stagger-6 { transition-delay: 500ms; }
    `;
    document.head.appendChild(style);
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
        
        document.querySelectorAll('.collection-card, .product-card, .best-seller, .feature-card').forEach((card, index) => {
            card.classList.add('scroll-animate');
            card.classList.add(`stagger-${(index % 6) + 1}`);
            observer.observe(card);
        });
    } else {
        document.querySelectorAll('.collection-card, .product-card, .best-seller, .feature-card').forEach(card => {
            card.classList.add('animated');
        });
    }
}

// Export functions for external use
window.getProducts = getProducts;
window.getProduct = getProduct;
window.getProductReviews = getProductReviews;
window.getProductRating = getProductRating;
window.addProductReview = addProductReview;
window.renderStarRating = renderStarRating;
window.filterProducts = filterProducts;
window.sortProducts = sortProducts;
window.searchProducts = searchProducts;
window.loadMoreProducts = loadMoreProducts;
