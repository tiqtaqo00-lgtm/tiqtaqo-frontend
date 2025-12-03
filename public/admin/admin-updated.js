// Admin Dashboard JavaScript - Updated for Backend API

// Check authentication
async function checkAuth() {
    try {
        await AuthAPI.verify();
        return true;
    } catch (error) {
        window.location.href = 'login.html';
        return false;
    }
}

// Logout
function logout() {
    AuthAPI.logout();
}

// Load admin info
async function loadAdminInfo() {
    try {
        const data = await AuthAPI.verify();
        if (data.user && data.user.email) {
            const emailElement = document.getElementById('adminEmail');
            if (emailElement) {
                emailElement.textContent = data.user.email;
            }
        }
    } catch (error) {
        console.error('Error loading admin info:', error);
    }
}

// Update statistics
async function updateStats() {
    try {
        const stats = await StatsAPI.getDashboard();
        
        document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
        document.getElementById('totalCategories').textContent = stats.totalCategories || 0;

        // Update category-specific stats
        if (stats.productsByCategory) {
            stats.productsByCategory.forEach(cat => {
                const statElement = document.getElementById(`${cat.category}Products`);
                if (statElement) {
                    statElement.textContent = cat.count;
                }
            });
        }
    } catch (error) {
        console.error('Error updating stats:', error);
        showNotification('فشل تحميل الإحصائيات', 'error');
    }
}

// Load products table
async function loadProductsTable() {
    try {
        const products = await ProductsAPI.getAll();
        const tbody = document.getElementById('productsTableBody');

        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-box-open" style="font-size: 48px; color: var(--gold); display: block; margin-bottom: 15px;"></i>
                        لا توجد منتجات. انقر على "إضافة منتج" للبدء.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>
                    ${product.image ? 
                        `<img src="http://localhost:3000${product.image}" alt="${product.name}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` 
                        : 'لا توجد صورة'}
                </td>
                <td>${product.name}</td>
                <td>${getCategoryName(product.category)}</td>
                <td>${formatPrice(product.price)}</td>
                <td>
                    <span class="badge ${product.visible ? 'badge-success' : 'badge-danger'}">
                        ${product.visible ? 'مرئي' : 'مخفي'}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" onclick="editProduct(${product.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteProduct(${product.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('فشل تحميل المنتجات', 'error');
    }
}

// Get category name
function getCategoryName(categoryId) {
    const categories = {
        'packs': 'باكات',
        'homme': 'رجالي',
        'femme': 'نسائي',
        'accessoires': 'إكسسوارات'
    };
    return categories[categoryId] || categoryId;
}

// Format price
function formatPrice(price) {
    return `${parseFloat(price).toFixed(2)} DH`;
}

// Show add product modal
function showAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('currentImage').style.display = 'none';
    document.getElementById('productModal').style.display = 'flex';
}

// Edit product
async function editProduct(id) {
    try {
        const product = await ProductsAPI.getById(id);
        
        document.getElementById('productModalTitle').textContent = 'تعديل المنتج';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productOldPrice').value = product.old_price || '';
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productBadge').value = product.badge || '';
        document.getElementById('productFeatured').checked = product.featured === 1;
        document.getElementById('productVisible').checked = product.visible === 1;

        // Show current image
        if (product.image) {
            const currentImage = document.getElementById('currentImage');
            currentImage.innerHTML = `
                <img src="http://localhost:3000${product.image}" alt="${product.name}" 
                     style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                <p style="margin-top: 10px; color: #666;">الصورة الحالية</p>
            `;
            currentImage.style.display = 'block';
        }

        document.getElementById('productModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('فشل تحميل بيانات المنتج', 'error');
    }
}

// Save product
async function saveProduct(event) {
    event.preventDefault();

    const productId = document.getElementById('productId').value;
    const formData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: document.getElementById('productPrice').value,
        old_price: document.getElementById('productOldPrice').value || null,
        category: document.getElementById('productCategory').value,
        badge: document.getElementById('productBadge').value || null,
        featured: document.getElementById('productFeatured').checked ? 1 : 0,
        visible: document.getElementById('productVisible').checked ? 1 : 0,
    };

    // Add image if selected
    const imageInput = document.getElementById('productImage');
    if (imageInput.files.length > 0) {
        formData.image = imageInput.files[0];
    }

    try {
        if (productId) {
            // Update existing product
            await ProductsAPI.update(productId, formData);
            showNotification('تم تحديث المنتج بنجاح', 'success');
        } else {
            // Create new product
            await ProductsAPI.create(formData);
            showNotification('تم إضافة المنتج بنجاح', 'success');
        }

        closeProductModal();
        await loadProductsTable();
        await updateStats();
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('فشل حفظ المنتج: ' + error.message, 'error');
    }
}

// Delete product
async function deleteProduct(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        return;
    }

    try {
        await ProductsAPI.delete(id);
        showNotification('تم حذف المنتج بنجاح', 'success');
        await loadProductsTable();
        await updateStats();
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('فشل حذف المنتج', 'error');
    }
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('productForm').reset();
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    `;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (await checkAuth()) {
        await loadAdminInfo();
        await updateStats();
        await loadProductsTable();

        // Setup form submission
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', saveProduct);
        }

        // Setup modal close buttons
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeProductModal);
        });

        // Close modal on outside click
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('productModal');
            if (event.target === modal) {
                closeProductModal();
            }
        });
    }
});
