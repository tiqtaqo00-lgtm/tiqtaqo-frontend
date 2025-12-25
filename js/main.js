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
        description: 'Complétez votre look with style',
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

// API Configuration
const API_BASE_URL = 'https://tiqtaqo-backend-hx6ych8ay-tiqtaqos-projects.vercel.app/api';

// Get categories from API or Fallback
async function getCategories() {
    console.log('🔍 Fetching categories...');
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (response.ok) {
            const categories = await response.json();
            console.log('✅ Categories fetched:', categories);
            if (categories && categories.length > 0) return categories;
        }
    } catch (error) {
        console.error('❌ Error fetching categories:', error);
    }

    // Fallback categories
    console.log('⚠️ Using fallback categories');
    return [
        { id: 'packs', name: 'Packs', icon: 'fa-box-open', visible: true, order: 1},
        { id: 'homme', name: 'Homme', icon: 'fa-user-tie', visible: true, order: 2},
        { id: 'femme', name: 'Femme', icon: 'fa-user-crown', visible: true, order: 3 },
        { id: 'accessoires', name: 'Accessoires', icon: 'fa-gem', visible: true, order: 4 },
        { id: 'wallets', name: 'Wallets', icon: 'fa-wallet', visible: true, order: 5 },
        { id: 'belts', name: 'Belts', icon: 'fa-belt', visible: true, order: 6 },
        { id: 'glasses', name: 'Glasses', icon: 'fa-glasses', visible: true, order: 7 }
    ];
}

// Load collections dynamically
async function loadCollections() {
    console.log('📦 Loading collections...');
    const categories = await getCategories();
    const collectionsGrid = document.getElementById('collectionsGrid');
    
    if (!collectionsGrid) {
        console.error('❌ collectionsGrid element not found!');
        return;
    }
    
    const visibleCategories = categories
        .filter(cat => cat.visible !== false)
        .sort((a, b) => (a.order || a.displayOrder || 0) - (b.order || b.displayOrder || 0));
    
    console.log('✨ Rendering categories:', visibleCategories.length);
    
    collectionsGrid.innerHTML = visibleCategories.map(category => {
        const catId = category.id || category._id;
        const iconData = collectionIcons[catId] || {
            icon: category.icon || 'fa-box',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            description: 'Découvrez notre collection'
        };
        
        // Determine the correct link based on category
        let link = `${catId}-select.html`;
        if (['homme', 'femme', 'glasses'].includes(catId)) {
            link = `${catId}.html`;
        }
        
        return `
            <div class="collection-card" onclick="location.href='${link}'">
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

// Load products for specific category from API
async function loadCategoryProducts(category) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    console.log(`📦 Loading products for category: ${category}`);
    productsGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/products?category=${category}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const products = await response.json();
        console.log(`✅ Products loaded for ${category}:`, products.length);
        
        if (!products || products.length === 0) {
            productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <p>Aucun produit disponible pour le moment</p>
                </div>
            `;
            return;
        }
        
        productsGrid.innerHTML = products.map(product => {
            const hasPromotion = product.promotion && product.promotion > 0;
            const finalPrice = hasPromotion 
                ? product.price - (product.price * product.promotion / 100)
                : product.price;
            
            return `
                <div class="product-card">
                    ${hasPromotion ? `<div class="product-badge">-${product.promotion}%</div>` : ''}
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300'">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
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
    } catch (error) {
        console.error('❌ Error loading products:', error);
        productsGrid.innerHTML = '<div class="error">Erreur lors du chargement des produits.</div>';
    }
}

// WhatsApp contact function
function contactWhatsApp(productName, price) {
    const phoneNumber = '212621535234';
    const message = `Bonjour, je suis intéressé(e) par: ${productName} - ${price} DH`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Sidebar functionality
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Page initialized');
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
        await loadCollections();
    }
    
    // Load products on category pages
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '');
    
    const categories = ['homme', 'femme', 'packs', 'accessoires', 'wallets', 'belts', 'glasses'];
    
    if (categories.includes(page)) {
        await loadCategoryProducts(page);
    } else if (page.includes('-homme') || page.includes('-femme')) {
        const category = page.split('-')[0];
        await loadCategoryProducts(category);
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
