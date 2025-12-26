// Configuration
const API_BASE_URL = 'https://tiqtaqo-backend-hx6ych8ay-tiqtaqos-projects.vercel.app/api';

const collectionIcons = {
    'packs': { icon: 'fa-gift', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', description: 'Ensembles complets pour un style parfait' },
    'homme': { icon: 'fa-user-tie', gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', description: 'Montres masculines raffinées' },
    'femme': { icon: 'fa-crown', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', description: 'Élégance féminine intemporelle' },
    'accessoires': { icon: 'fa-gem', gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)', description: 'Complétez votre look with style' },
    'wallets': { icon: 'fa-wallet', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', description: 'Portefeuilles élégants et pratiques' },
    'belts': { icon: 'fa-ribbon', gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)', description: 'Ceintures de qualité supérieure' },
    'glasses': { icon: 'fa-glasses', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', description: 'Lunettes tendance et sophistiquées' }
};

const FALLBACK_CATEGORIES = [
    { id: 'packs', name: 'Packs', order: 1 },
    { id: 'homme', name: 'Homme', order: 2 },
    { id: 'femme', name: 'Femme', order: 3 },
    { id: 'accessoires', name: 'Accessoires', order: 4 },
    { id: 'wallets', name: 'Wallets', order: 5 },
    { id: 'belts', name: 'Belts', order: 6 },
    { id: 'glasses', name: 'Glasses', order: 7 }
];

// Load collections on homepage
async function loadCollections() {
    const grid = document.getElementById('collectionsGrid');
    if (!grid) return;

    // Initial render
    renderCategories(FALLBACK_CATEGORIES);

    try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) renderCategories(data);
        }
    } catch (e) { console.error('Categories Load Error:', e); }
}

function renderCategories(categories) {
    const grid = document.getElementById('collectionsGrid');
    if (!grid) return;

    grid.innerHTML = categories
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(c => {
            const id = c.id || c._id;
            const icon = collectionIcons[id] || { icon: 'fa-box', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', description: 'Découvrez' };
            let link = `${id}-select.html`;
            if (['homme', 'femme', 'glasses'].includes(id)) link = `${id}.html`;
            
            return `
                <div class="collection-card" onclick="location.href='${link}'">
                    <div class="card-image" style="background: ${icon.gradient};">
                        <i class="fas ${icon.icon}"></i>
                    </div>
                    <h3>${c.name}</h3>
                    <p>${icon.description}</p>
                    <button class="btn-secondary">Explorer</button>
                </div>
            `;
        }).join('');
}

// Load products with Client-side filtering to ensure it works even if API filtering fails
async function loadCategoryProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const path = window.location.pathname.split('/').pop().replace('.html', '');
    let targetCategory = path;
    let targetBranch = '';

    if (path.includes('-')) {
        const parts = path.split('-');
        targetCategory = parts[0];
        targetBranch = parts[1];
    }

    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
    
    try {
        // Fetch ALL products and filter them here to be safe
        const res = await fetch(`${API_BASE_URL}/products`);
        if (!res.ok) throw new Error('API Error');
        
        const allProducts = await res.json();
        
        // Filter logic
        const filteredProducts = allProducts.filter(p => {
            const catMatch = p.category && p.category.toLowerCase() === targetCategory.toLowerCase();
            if (!targetBranch) return catMatch;
            const branchMatch = p.branch && p.branch.toLowerCase() === targetBranch.toLowerCase();
            return catMatch && branchMatch;
        });
        
        if (filteredProducts.length === 0) {
            grid.innerHTML = '<div class="no-products"><i class="fas fa-box-open"></i><p>Aucun produit trouvé dans cette catégorie</p></div>';
            return;
        }
        
        grid.innerHTML = filteredProducts.map(p => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300'">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-price"><span class="price">${Math.round(p.price)} DH</span></div>
                    <button class="btn-primary" onclick="contactWhatsApp('${p.name}', ${Math.round(p.price)})">
                        <i class="fab fa-whatsapp"></i> Commander
                    </button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Products Load Error:', e);
        grid.innerHTML = '<div class="error">⚠️ Erreur de connexion. Veuillez rafraîchir.</div>';
    }
}

function contactWhatsApp(name, price) {
    const msg = `Bonjour, je suis intéressé(e) par: ${name} - ${price} DH`;
    window.open(`https://wa.me/212621535234?text=${encodeURIComponent(msg)}`, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const overlay = document.getElementById('overlay');
    
    if (menuToggle) menuToggle.onclick = () => { sidebar.classList.add('active'); overlay.classList.add('active'); };
    if (closeSidebar) closeSidebar.onclick = () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); };
    if (overlay) overlay.onclick = () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); };
    
    loadCollections();
    loadCategoryProducts();
});
