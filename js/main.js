// TiqtaQo - Main Logic with Hybrid Data System
const API_BASE_URL = 'https://tiqtaqo-backend-hx6ych8ay-tiqtaqos-projects.vercel.app/api';

// Sample Data to ensure site is NEVER empty
const STATIC_PRODUCTS = [
    { _id: 's1', name: 'Pack Luxe Homme', price: 850, category: 'packs', branch: 'homme', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', description: 'Montre + Bracelet + Portefeuille' },
    { _id: 's2', name: 'Pack Élégance Femme', price: 750, category: 'packs', branch: 'femme', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500', description: 'Montre + Collier + Coffret' },
    { _id: 's3', name: 'Classic Silver Watch', price: 450, category: 'homme', branch: '', image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500', description: 'Montre classique en acier' },
    { _id: 's4', name: 'Rose Gold Edition', price: 550, category: 'femme', branch: '', image: 'https://images.unsplash.com/photo-1508685096489-7aac2968b240?w=500', description: 'Montre élégante rose gold' },
    { _id: 's5', name: 'Leather Wallet Brown', price: 250, category: 'wallets', branch: 'homme', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500', description: 'Cuir véritable' },
    { _id: 's6', name: 'Aviator Style Glasses', price: 350, category: 'glasses', branch: '', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500', description: 'Protection UV400' }
];

const collectionIcons = {
    'packs': { icon: 'fa-gift', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', description: 'Ensembles complets' },
    'homme': { icon: 'fa-user-tie', gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', description: 'Montres masculines' },
    'femme': { icon: 'fa-crown', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', description: 'Élégance féminine' },
    'accessoires': { icon: 'fa-gem', gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)', description: 'Style & Détails' },
    'wallets': { icon: 'fa-wallet', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', description: 'Portefeuilles' },
    'belts': { icon: 'fa-ribbon', gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)', description: 'Ceintures' },
    'glasses': { icon: 'fa-glasses', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', description: 'Lunettes' }
};

async function loadCollections() {
    const grid = document.getElementById('collectionsGrid');
    if (!grid) return;

    const cats = Object.keys(collectionIcons).map((id, index) => ({
        id, name: id.charAt(0).toUpperCase() + id.slice(1), order: index + 1
    }));

    grid.innerHTML = cats.map(c => {
        const icon = collectionIcons[c.id];
        let link = `${c.id}-select.html`;
        if (['homme', 'femme', 'glasses'].includes(c.id)) link = `${c.id}.html`;
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

async function loadCategoryProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const path = window.location.pathname.split('/').pop().replace('.html', '');
    let targetCat = path.includes('-') ? path.split('-')[0] : path;
    let targetBranch = path.includes('-') ? path.split('-')[1] : '';

    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

    let products = [...STATIC_PRODUCTS];

    try {
        const res = await fetch(`${API_BASE_URL}/products`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
            const apiData = await res.json();
            if (apiData && apiData.length > 0) products = [...apiData, ...STATIC_PRODUCTS];
        }
    } catch (e) { console.warn('Using static data due to API delay/error'); }

    const filtered = products.filter(p => {
        const cMatch = p.category && p.category.toLowerCase() === targetCat.toLowerCase();
        if (!targetBranch) return cMatch;
        const bMatch = p.branch && p.branch.toLowerCase() === targetBranch.toLowerCase();
        return cMatch && bMatch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-products"><i class="fas fa-box-open"></i><p>Bientôt disponible</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(p => `
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
}

function contactWhatsApp(name, price) {
    window.open(`https://wa.me/212621535234?text=${encodeURIComponent('Bonjour, je veux: ' + name + ' - ' + price + ' DH')}`, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (menuToggle) menuToggle.onclick = () => { sidebar.classList.add('active'); overlay.classList.add('active'); };
    if (overlay) overlay.onclick = () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); };
    loadCollections();
    loadCategoryProducts();
});
