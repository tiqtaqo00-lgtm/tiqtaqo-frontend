// Enhanced Icon Mapping for Collections
const collectionIcons = {
    'packs': {
        icon: 'fa-gift',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        description: 'Ensembles complets pour un style parfait',
        animation: 'bounce'
    },
    'homme': {
        icon: 'fa-user-tie',
        gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        description: 'Montres masculines raffinées',
        animation: 'pulse'
    },
    'femme': {
        icon: 'fa-crown',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        description: 'Élégance féminine intemporelle',
        animation: 'sparkle'
    },
    'accessoires': {
        icon: 'fa-gem',
        gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
        description: 'Complétez votre look avec style',
        animation: 'shine'
    },
    'wallets': {
        icon: 'fa-wallet',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        description: 'Portefeuilles élégants et pratiques',
        animation: 'slide'
    },
    'belts': {
        icon: 'fa-ribbon',
        gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
        description: 'Ceintures de qualité supérieure',
        animation: 'rotate'
    },
    'glasses': {
        icon: 'fa-glasses',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        description: 'Lunettes tendance et sophistiquées',
        animation: 'swing'
    }
};

// Version control for localStorage - increment this when adding new categories
const CATEGORIES_VERSION = 2;

// Get categories from localStorage
function getCategories() {
    // Default categories - ALWAYS use these as the source of truth
    const defaultCategories = [
        { id: 'packs', name: 'Packs', icon: 'fa-box-open', visible: true, order: 1},
        { id: 'homme', name: 'Homme', icon: 'fa-user-tie', visible: true, order: 2},
        { id: 'femme', name: 'Femme', icon: 'fa-user-crown', visible: true, order: 3 },
        { id: 'accessoires', name: 'Accessoires', icon: 'fa-gem', visible: true, order: 4 },
        { id: 'wallets', name: 'Wallets', icon: 'fa-wallet', visible: true, order: 5 },
        { id: 'belts', name: 'Belts', icon: 'fa-belt', visible: true, order: 6 },
        { id: 'glasses', name: 'Glasses', icon: 'fa-glasses', visible: true, order: 7 }
    ];

    // Check version
    const storedVersion = localStorage.getItem('luxury_categories_version');
    
    if (!storedVersion || parseInt(storedVersion) < CATEGORIES_VERSION) {
        // Force update if version is old or missing
        localStorage.setItem('luxury_categories', JSON.stringify(defaultCategories));
        localStorage.setItem('luxury_categories_version', CATEGORIES_VERSION.toString());
        return defaultCategories;
    }

    const categories = localStorage.getItem('luxury_categories');
    
    if (categories) {
        return JSON.parse(categories);
    }

    localStorage.setItem('luxury_categories', JSON.stringify(defaultCategories));
    localStorage.setItem('luxury_categories_version', CATEGORIES_VERSION.toString());
    return defaultCategories;
}

// Load collections dynamically
function loadCollections() {
    const categories = getCategories();
    const collectionsGrid = document.getElementById('collectionsGrid');
    
    if (!collectionsGrid) return;
    
    // Filter visible categories and sort by order
    const visibleCategories = categories
        .filter(cat => cat.visible)
        .sort((a, b) => a.order - b.order);
    
    collectionsGrid.innerHTML = visibleCategories.map(category => {
        const iconData = collectionIcons[category.id] || {
            icon: category.icon || 'fa-box',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            description: 'Découvrez notre collection'
        };
        
        return `
            <div class="collection-card" onclick="location.href='${category.id}-select.html'">
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

// Get products from localStorage
function getProducts() {
    const products = localStorage.getItem('luxury_products');
    return products ? JSON.parse(products) : [];
}

// Load products for specific category
function loadCategoryProducts(category) {
    const products = getProducts();
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) return;
    
    const categoryProducts = products.filter(p => 
        p.category === category && p.visible
    );
    
    if (categoryProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <p>Aucun produit disponible pour le moment</p>
            </div>
        `;
        return;
    }
    
    productsGrid.innerHTML = categoryProducts.map(product => {
        const hasPromotion = product.promotion && product.promotion > 0;
        const finalPrice = hasPromotion 
            ? product.price - (product.price * product.promotion / 100)
            : product.price;
        
        return `
            <div class="product-card">
                ${hasPromotion ? `<div class="product-badge">-${product.promotion}%</div>` : ''}
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2218%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage%3C/text%3E%3C/svg%3E'">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description || ''}</p>
                    <div class="product-price">
                        ${hasPromotion ? `<span class="old-price">${product.price} DH</span>` : ''}
                        <span class="price">${Math.round(finalPrice)} DH</span>
                    </div>
                    <button class="btn-primary" onclick="contactWhatsApp('${product.name}', ${Math.round(finalPrice)})">
                        <i class="fab fa-whatsapp"></i> Commander
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// WhatsApp contact function
function contactWhatsApp(productName, price) {
    const phoneNumber = '212XXXXXXXXX'; // Replace with actual number
    const message = `Bonjour, je suis intéressé(e) par: ${productName} - ${price} DH`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Sidebar functionality
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
        loadCategoryProducts(currentPage);
    }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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