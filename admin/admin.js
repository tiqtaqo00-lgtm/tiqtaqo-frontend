// Backend API URL
const API_BASE_URL = 'https://3000-b710c3f2-c6dc-471d-b712-7fb6622b9db5.proxy.daytona.works';

// Get JWT token from localStorage
function getToken() {
    return localStorage.getItem('admin_token');
}

// Set JWT token in localStorage
function setToken(token) {
    localStorage.setItem('admin_token', token);
}

// Check if admin is logged in
function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    window.location.href = 'login.html';
}

// Load admin email
function loadAdminInfo() {
    const email = localStorage.getItem('admin_email');
    if (email) {
        document.getElementById('adminEmail').textContent = email;
    }
}

// Fetch with authentication
async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        logout();
        throw new Error('Unauthorized');
    }

    return response;
}

// ==================== PRODUCTS ====================

// Get all products from API
async function getProducts() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return await response.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        showNotification('خطأ في تحميل المنتجات', 'error');
        return [];
    }
}

// Get single product
async function getProduct(id) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        return await response.json();
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

// Create product
async function createProduct(productData) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/products`, {
            method: 'POST',
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create product');
        }

        const result = await response.json();
        showNotification('تم إضافة المنتج بنجاح', 'success');
        return result;
    } catch (error) {
        console.error('Error creating product:', error);
        showNotification(error.message || 'خطأ في إضافة المنتج', 'error');
        throw error;
    }
}

// Update product
async function updateProduct(id, productData) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update product');
        }

        const result = await response.json();
        showNotification('تم تحديث المنتج بنجاح', 'success');
        return result;
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification(error.message || 'خطأ في تحديث المنتج', 'error');
        throw error;
    }
}

// Delete product
async function deleteProduct(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        return;
    }

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete product');
        }

        showNotification('تم حذف المنتج بنجاح', 'success');
        loadProductsTable();
        updateStats();
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification(error.message || 'خطأ في حذف المنتج', 'error');
    }
}

// Toggle product visibility
async function toggleProductVisibility(id) {
    try {
        const products = await getProducts();
        const product = products.find(p => p._id === id);
        
        if (product) {
            await updateProduct(id, { ...product, visible: !product.visible });
            loadProductsTable();
        }
    } catch (error) {
        console.error('Error toggling product visibility:', error);
    }
}

// ==================== CATEGORIES ====================

// Get all categories from API
async function getCategories() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        return await response.json();
    } catch (error) {
        console.error('Error fetching categories:', error);
        showNotification('خطأ في تحميل الفئات', 'error');
        return [];
    }
}

// Get single category
async function getCategory(id) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/categories/${id}`);
        if (!response.ok) throw new Error('Failed to fetch category');
        return await response.json();
    } catch (error) {
        console.error('Error fetching category:', error);
        return null;
    }
}

// Create category
async function createCategory(categoryData) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/categories`, {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create category');
        }

        const result = await response.json();
        showNotification('تم إضافة الفئة بنجاح', 'success');
        return result;
    } catch (error) {
        console.error('Error creating category:', error);
        showNotification(error.message || 'خطأ في إضافة الفئة', 'error');
        throw error;
    }
}

// Update category
async function updateCategory(id, categoryData) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update category');
        }

        const result = await response.json();
        showNotification('تم تحديث الفئة بنجاح', 'success');
        return result;
    } catch (error) {
        console.error('Error updating category:', error);
        showNotification(error.message || 'خطأ في تحديث الفئة', 'error');
        throw error;
    }
}

// Delete category
async function deleteCategory(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع المنتجات المرتبطة بها.')) {
        return;
    }

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/categories/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete category');
        }

        showNotification('تم حذف الفئة بنجاح', 'success');
        loadCategoriesTable();
        loadProductsTable();
        updateStats();
    } catch (error) {
        console.error('Error deleting category:', error);
        showNotification(error.message || 'خطأ في حذف الفئة', 'error');
    }
}

// Toggle category visibility
async function toggleCategoryVisibility(id) {
    try {
        const categories = await getCategories();
        const category = categories.find(c => c._id === id);
        
        if (category) {
            await updateCategory(id, { ...category, visible: !category.visible });
            loadCategoriesTable();
        }
    } catch (error) {
        console.error('Error toggling category visibility:', error);
    }
}

// ==================== UI FUNCTIONS ====================

// Update statistics
async function updateStats() {
    try {
        const products = await getProducts();
        const categories = await getCategories();

        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalCategories').textContent = categories.length;

        // Update category-specific stats
        categories.forEach(cat => {
            const count = products.filter(p => p.category === cat._id).length;
            const statElement = document.getElementById(`${cat.id}Products`);
            if (statElement) {
                statElement.textContent = count;
            }
        });
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Load products table
async function loadProductsTable() {
    try {
        const products = await getProducts();
        const tbody = document.getElementById('productsTableBody');

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-box-open" style="font-size: 48px; color: var(--gold); display: block; margin-bottom: 15px;"></i>
                        لا توجد منتجات. انقر على "إضافة منتج" للبدء.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product._id}</td>
                <td>
                    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : 'لا توجد صورة'}
                </td>
                <td>${product.name}</td>
                <td>${product.price} DH</td>
                <td><span class="category-badge">${product.category}</span></td>
                <td>${product.promotion > 0 ? product.promotion + '%' : '-'}</td>
                <td>
                    <button class="btn-toggle ${product.visible ? 'active' : ''}" onclick="toggleProductVisibility('${product._id}')">
                        ${product.visible ? '<i class="fas fa-eye"></i> مرئي' : '<i class="fas fa-eye-slash"></i> مخفي'}
                    </button>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editProduct('${product._id}')">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn-delete" onclick="deleteProduct('${product._id}')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products table:', error);
    }
}

// Load categories table
async function loadCategoriesTable() {
    try {
        const categories = await getCategories();
        const tbody = document.getElementById('categoriesTableBody');

        if (!tbody) return;

        if (categories.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                        لا توجد فئات. انقر على "إضافة فئة" للبدء.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = categories.sort((a, b) => (a.display_order || 999) - (b.display_order || 999)).map(category => `
            <tr>
                <td>${category.display_order || '-'}</td>
                <td><i class="fas ${category.icon}"></i></td>
                <td>${category.name}</td>
                <td>${category.id}</td>
                <td>
                    <button class="btn-toggle ${category.visible ? 'active' : ''}" onclick="toggleCategoryVisibility('${category._id}')">
                        ${category.visible ? '<i class="fas fa-eye"></i> مرئي' : '<i class="fas fa-eye-slash"></i> مخفي'}
                    </button>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editCategory('${category._id}')">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn-delete" onclick="deleteCategory('${category._id}')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading categories table:', error);
    }
}

// Get category name
async function getCategoryName(categoryId) {
    try {
        const categories = await getCategories();
        const category = categories.find(c => c._id === categoryId);
        return category ? category.name : categoryId;
    } catch (error) {
        return categoryId;
    }
}

// Show add product modal
async function showAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'إضافة منتج';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('productModal').style.display = 'flex';
    await loadCategoryOptions();
}

// Show add category modal
function showAddCategoryModal() {
    document.getElementById('categoryModalTitle').textContent = 'إضافة فئة';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModal').style.display = 'flex';
}

// Load category options in product form
async function loadCategoryOptions() {
    try {
        const categories = await getCategories();
        const select = document.getElementById('productCategory');
        select.innerHTML = categories.map(cat =>
            `<option value="${cat._id}">${cat.name}</option>`
        ).join('');
    } catch (error) {
        console.error('Error loading category options:', error);
    }
}

// Edit product
async function editProduct(id) {
    try {
        const product = await getProduct(id);

        if (product) {
            document.getElementById('productModalTitle').textContent = 'تعديل المنتج';
            document.getElementById('productId').value = product._id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productGender').value = product.gender || 'unisex';
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productPromotion').value = product.promotion || 0;
            document.getElementById('productVisible').checked = product.visible;

            if (product.image) {
                document.getElementById('imagePreview').src = product.image;
                document.getElementById('imagePreview').style.display = 'block';
            }

            await loadCategoryOptions();
            document.getElementById('productModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error editing product:', error);
    }
}

// Edit category
async function editCategory(id) {
    try {
        const category = await getCategory(id);

        if (category) {
            document.getElementById('categoryModalTitle').textContent = 'تعديل الفئة';
            document.getElementById('categoryId').value = category._id;
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryIcon').value = category.icon;
            document.getElementById('categoryOrder').value = category.display_order || '';
            document.getElementById('categoryVisible').checked = category.visible;
            document.getElementById('categoryModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error editing category:', error);
    }
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Save product
async function saveProduct() {
    const productId = document.getElementById('productId').value;
    const productData = {
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        gender: document.getElementById('productGender').value,
        description: document.getElementById('productDescription').value,
        promotion: parseFloat(document.getElementById('productPromotion').value) || 0,
        visible: document.getElementById('productVisible').checked,
        image: document.getElementById('imagePreview').src
    };

    try {
        if (productId) {
            await updateProduct(productId, productData);
        } else {
            await createProduct(productData);
        }
        closeProductModal();
        loadProductsTable();
        updateStats();
    } catch (error) {
        console.error('Error saving product:', error);
    }
}

// Save category
async function saveCategory() {
    const categoryId = document.getElementById('categoryId').value;
    const categoryData = {
        name: document.getElementById('categoryName').value,
        icon: document.getElementById('categoryIcon').value,
        display_order: parseInt(document.getElementById('categoryOrder').value) || 999,
        visible: document.getElementById('categoryVisible').checked
    };

    try {
        if (categoryId) {
            await updateCategory(categoryId, categoryData);
        } else {
            await createCategory(categoryData);
        }
        closeCategoryModal();
        loadCategoriesTable();
        updateStats();
    } catch (error) {
        console.error('Error saving category:', error);
    }
}

// Close modals
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease-in-out;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    if (checkAuth()) {
        loadAdminInfo();
        await loadProductsTable();
        await loadCategoriesTable();
        await updateStats();
    }
});