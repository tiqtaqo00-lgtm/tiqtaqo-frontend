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

// Fallback products data for each category
const fallbackProducts = {
    'homme': [
        {
            _id: '1',
            name: 'Montre Homme Classique',
            description: 'Montre élégante pour homme',
            price: 1200,
            image: 'https://via.placeholder.com/300?text=Montre+Homme+1',
            category: 'homme',
            promotion: 0
        },
        {
            _id: '2',
            name: 'Montre Homme Sport',
            description: 'Montre sportive robuste',
            price: 1500,
            image: 'https://via.placeholder.com/300?text=Montre+Homme+2',
            category: 'homme',
            promotion: 10
        },
        {
            _id: '3',
            name: 'Montre Homme Luxe',
            description: 'Montre de luxe premium',
            price: 3000,
            image: 'https://via.placeholder.com/300?text=Montre+Homme+3',
            category: 'homme',
            promotion: 0
        }
    ],
    'femme': [
        {
            _id: '4',
            name: 'Montre Femme Élégante',
            description: 'Montre féminine élégante',
            price: 1100,
            image: 'https://via.placeholder.com/300?text=Montre+Femme+1',
            category: 'femme',
            promotion: 0
        },
        {
            _id: '5',
            name: 'Montre Femme Moderne',
            description: 'Montre moderne et tendance',
            price: 1400,
            image: 'https://via.placeholder.com/300?text=Montre+Femme+2',
            category: 'femme',
            promotion: 15
        },
        {
            _id: '6',
            name: 'Montre Femme Diamant',
            description: 'Montre avec cristaux',
            price: 2500,
            image: 'https://via.placeholder.com/300?text=Montre+Femme+3',
            category: 'femme',
            promotion: 0
        }
    ],
    'glasses': [
        {
            _id: '7',
            name: 'Lunettes de Soleil Classique',
            description: 'Lunettes de soleil classiques',
            price: 800,
            image: 'https://via.placeholder.com/300?text=Glasses+1',
            category: 'glasses',
            promotion: 0
        },
        {
            _id: '8',
            name: 'Lunettes de Soleil Aviateur',
            description: 'Style aviateur tendance',
            price: 950,
            image: 'https://via.placeholder.com/300?text=Glasses+2',
            category: 'glasses',
            promotion: 20
        },
        {
            _id: '9',
            name: 'Lunettes Optiques Premium',
            description: 'Lunettes optiques de qualité',
            price: 1200,
            image: 'https://via.placeholder.com/300?text=Glasses+3',
            category: 'glasses',
            promotion: 0
        }
    ],
    'packs': [
        {
            _id: '10',
            name: 'Pack Complet Homme',
            description: 'Montre + Accessoires',
            price: 2000,
            image: 'https://via.placeholder.com/300?text=Pack+Homme',
            category: 'packs',
            promotion: 25
        },
        {
            _id: '11',
            name: 'Pack Complet Femme',
            description: 'Montre + Bijoux',
            price: 1800,
            image: 'https://via.placeholder.com/300?text=Pack+Femme',
            category: 'packs',
            promotion: 20
        }
    ],
    'accessoires': [
        {
            _id: '12',
            name: 'Bracelet Cuir',
            description: 'Bracelet en cuir véritable',
            price: 400,
            image: 'https://via.placeholder.com/300?text=Accessoire+1',
            category: 'accessoires',
            promotion: 0
        }
    ],
    'wallets': [
        {
            _id: '13',
            name: 'Portefeuille Cuir',
            description: 'Portefeuille en cuir premium',
            price: 600,
            image: 'https://via.placeholder.com/300?text=Wallet+1',
            category: 'wallets',
            promotion: 0
        }
    ],
    'belts': [
        {
            _id: '14',
            name: 'Ceinture Cuir',
            description: 'Ceinture en cuir de qualité',
            price: 500,
            image: 'https://via.placeholder.com/300?text=Belt+1',
            category: 'belts',
            promotion: 0
        }
    ]
};

// Get categories from API or Fallback
async function getCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        if (response.ok) {
            const categories = await response.json();
            if (categories && categories.length > 0) return categories;
        }
    } catch (error) {
        console.warn('Error fetching categories from API:', error);
    }

    // Fallback categories
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
    try {
        console.log('📦 Loading collections...');
        const categories = await getCategories();
        const collectionsGrid = document.getElementById('collectionsGrid');

        if (!collectionsGrid) {
            console.warn('⚠️ collectionsGrid element not found');
            return;
        }

        // ✅ Filter visible categories and sort by order
        const visibleCategories = categories
            .filter(cat => cat.visible !== false)
            .sort((a, b) => (a.order || a.displayOrder || 0) - (b.order || b.displayOrder || 0));

        if (!visibleCategories || visibleCategories.length === 0) {
            console.warn('⚠️ No visible categories found, using fallback');
            // ✅ Use fallback categories
            renderFallbackCollections(collectionsGrid);
            return;
        }

        console.log(`✅ Found ${visibleCategories.length} categories`);

        // ✅ Render categories
        collectionsGrid.innerHTML = visibleCategories.map(category => {
            const catId = category.id || category._id;
            const iconData = collectionIcons[catId] || {
                icon: category.icon || 'fa-box',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                description: category.description || 'Découvrez notre collection'
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

        console.log('✅ Collections loaded successfully');
    } catch (error) {
        console.error('❌ Error in loadCollections:', error);
        // ✅ Fallback: render default categories
        const collectionsGrid = document.getElementById('collectionsGrid');
        if (collectionsGrid) {
            renderFallbackCollections(collectionsGrid);
        }
    }
}

// ✅ NEW: Fallback function to render default categories
function renderFallbackCollections(collectionsGrid) {
    console.log('📦 Using fallback collections...');
    const defaultCategories = [
        { id: 'packs', name: 'Packs', icon: 'fa-box-open', visible: true, order: 1, description: 'Ensembles complets pour un style parfait' },
        { id: 'homme', name: 'Homme', icon: 'fa-user-tie', visible: true, order: 2, description: 'Montres masculines raffinées' },
        { id: 'femme', name: 'Femme', icon: 'fa-crown', visible: true, order: 3, description: 'Élégance féminine intemporelle' },
        { id: 'accessoires', name: 'Accessoires', icon: 'fa-gem', visible: true, order: 4, description: 'Complétez votre look with style' },
        { id: 'wallets', name: 'Wallets', icon: 'fa-wallet', visible: true, order: 5, description: 'Portefeuilles élégants et pratiques' },
        { id: 'belts', name: 'Belts', icon: 'fa-ribbon', visible: true, order: 6, description: 'Ceintures de qualité supérieure' },
        { id: 'glasses', name: 'Glasses', icon: 'fa-glasses', visible: true, order: 7, description: 'Lunettes tendance et sophistiquées' }
    ];
    
    collectionsGrid.innerHTML = defaultCategories.map(category => {
        const catId = category.id;
        const iconData = collectionIcons[catId] || {
            icon: category.icon || 'fa-box',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            description: category.description || 'Découvrez notre collection'
        };

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
    
    console.log('✅ Fallback collections rendered');
}

// Load products for specific category from API with fallback
async function loadCategoryProducts(category) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    // Show loading state
    productsGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

    let products = [];
    let usesFallback = false;

    try {
        // Try to fetch from API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${API_BASE_URL}/products?category=${category}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                products = data;
            } else {
                // API returned empty, use fallback
                products = fallbackProducts[category] || [];
                usesFallback = true;
            }
        } else {
            // API error, use fallback
            products = fallbackProducts[category] || [];
            usesFallback = true;
            console.warn(`API returned status ${response.status}, using fallback data`);
        }
    } catch (error) {
        // Network error or timeout, use fallback
        console.warn('Error loading products from API:', error);
        products = fallbackProducts[category] || [];
        usesFallback = true;
    }

    // Render products
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

    // Show fallback notice if using fallback data
    if (usesFallback) {
        console.info('Using fallback product data');
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

    // Check if current page is a category page
    if (categories.includes(page)) {
        await loadCategoryProducts(page);
    } else if (page.includes('-homme') || page.includes('-femme')) {
        // Handle subcategory pages if needed
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