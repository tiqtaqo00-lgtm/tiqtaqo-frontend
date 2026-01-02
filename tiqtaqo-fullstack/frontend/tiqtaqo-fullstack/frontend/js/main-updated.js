// Main JavaScript for TiqtaQo Frontend
// This file handles product display and interactions

// Load products for a specific category
async function loadProducts(category) {
    try {
        const products = await ProductsAPI.getAll({ category });
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showError('فشل تحميل المنتجات. يرجى المحاولة مرة أخرى.');
    }
}

// Display products in the grid
function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) return;

    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-box-open" style="font-size: 64px; color: var(--gold); margin-bottom: 20px; display: block;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">لا توجد منتجات متاحة حالياً</h3>
                <p style="color: #999;">سيتم إضافة منتجات جديدة قريباً</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            <div class="product-image">
                <img src="http://localhost:3000${product.image}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.old_price ? `<span class="old-price">${formatPrice(product.old_price)}</span>` : ''}
                </div>
                <button class="btn-primary" onclick="contactWhatsApp('${product.name}', ${product.price})">
                    <i class="fab fa-whatsapp"></i> اطلب الآن
                </button>
            </div>
        </div>
    `).join('');
}

// Format price
function formatPrice(price) {
    return `${parseFloat(price).toFixed(2)} DH`;
}

// Contact via WhatsApp
function contactWhatsApp(productName, price) {
    const message = `مرحباً، أنا مهتم بـ ${productName} بسعر ${formatPrice(price)}`;
    const whatsappNumber = '212600000000'; // Replace with actual number
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i> ${message}
    `;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i> ${message}
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Get current page category from URL or body class
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    // Map page names to category IDs
    const categoryMap = {
        'packs': 'packs',
        'homme': 'homme',
        'femme': 'femme',
        'accessoires': 'accessoires'
    };

    const category = categoryMap[currentPage];
    
    if (category) {
        await loadProducts(category);
    }

    // Sidebar menu functionality
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const closeSidebar = document.getElementById('closeSidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
