// ==================== CONFIGURATION ====================
const API_BASE_URL = 'https://tiqtaqo-backend-hx6ych8ay-tiqtaqos-projects.vercel.app/api';

// ==================== AUTHENTICATION ====================

function getToken() {
    return localStorage.getItem('admin_token');
}

function setToken(token) {
    localStorage.setItem('admin_token', token);
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    window.location.href = 'login.html';
}

// ==================== FETCH WITH AUTH ====================

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

// ==================== MESSAGE FUNCTIONS ====================

function showMessage(message, type = 'info') {
    const messageEl = document.getElementById(`${type}Message`);
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.classList.add('show');
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 5000);
    }
}

// ==================== SECTION SWITCHING ====================

function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }

    // Update menu
    document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'لوحة التحكم',
        'products': 'المنتجات',
        'categories': 'الأقسام',
        'add-product': 'إضافة منتج',
        'add-category': 'إضافة قسم'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId] || 'لوحة التحكم';

    // Load data if needed
    if (sectionId === 'products') {
        loadProducts();
    } else if (sectionId === 'categories') {
        loadCategories();
    }
}

// ==================== CATEGORIES ====================

async function loadCategories() {
    try {
        document.getElementById('categoriesLoading').classList.add('show');
        const response = await fetchWithAuth(`${API_BASE_URL}/categories`);
        const categories = await response.json();

        let html = '<table><thead><tr><th>اسم القسم</th><th>المعرف</th><th>الفروع</th><th>الإجراءات</th></tr></thead><tbody>';

        if (categories.length === 0) {
            html += '<tr><td colspan="4" style="text-align: center; padding: 40px;">لا توجد أقسام</td></tr>';
        } else {
            categories.forEach(category => {
                html += `
                    <tr>
                        <td>${category.name}</td>
                        <td>${category.id}</td>
                        <td>${category.subcategories?.join(', ') || '-'}</td>
                        <td>
                            <button class="edit-btn" onclick="editCategory('${category.id}')">تعديل</button>
                            <button class="delete-btn" onclick="deleteCategory('${category.id}')">حذف</button>
                        </td>
                    </tr>
                `;
            });
        }

        html += '</tbody></table>';
        document.getElementById('categoriesContainer').innerHTML = html;
        document.getElementById('categoriesLoading').classList.remove('show');
    } catch (error) {
        console.error('Error loading categories:', error);
        showMessage('خطأ في تحميل الأقسام', 'error');
        document.getElementById('categoriesLoading').classList.remove('show');
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete');

        showMessage('تم حذف القسم بنجاح', 'success');
        loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showMessage('خطأ في حذف القسم', 'error');
    }
}

// ==================== PRODUCTS ====================

async function loadProducts() {
    try {
        document.getElementById('productsLoading').classList.add('show');
        const response = await fetchWithAuth(`${API_BASE_URL}/products`);
        const products = await response.json();

        let html = '';

        if (products.length === 0) {
            html = '<div class="empty-state"><i class="fas fa-box"></i><p>لا توجد منتجات</p></div>';
        } else {
            products.forEach(product => {
                html += `
                    <div class="product-card">
                        <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300'">
                        <div class="product-info">
                            <h3>${product.name}</h3>
                            <p>${product.category}</p>
                            <p>${product.description || ''}</p>
                            <div class="product-price">${product.price} د.م</div>
                            <p style="font-size: 12px; color: #999;">المخزون: ${product.stock}</p>
                            <div class="product-actions">
                                <button class="edit-btn" onclick="editProduct('${product._id}')">تعديل</button>
                                <button class="delete-btn" onclick="deleteProduct('${product._id}')">حذف</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        document.getElementById('productsContainer').innerHTML = html;
        document.getElementById('productsLoading').classList.remove('show');
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage('خطأ في تحميل المنتجات', 'error');
        document.getElementById('productsLoading').classList.remove('show');
    }
}

async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete');

        showMessage('تم حذف المنتج بنجاح', 'success');
        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showMessage('خطأ في حذف المنتج', 'error');
    }
}

// ==================== FORMS ====================

async function loadCategoriesForForm() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/categories`);
        const categories = await response.json();
        const select = document.getElementById('productCategory');

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories for form:', error);
    }
}

// Product Form
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!checkAuth()) return;

    // Load admin email
    const email = localStorage.getItem('admin_email');
    if (email) {
        document.getElementById('adminEmail').textContent = email;
    }

    // Menu links
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Product form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const productData = {
                name: document.getElementById('productName').value,
                price: parseFloat(document.getElementById('productPrice').value),
                category: document.getElementById('productCategory').value,
                subcategory: document.getElementById('productSubcategory').value,
                gender: document.getElementById('productGender').value,
                stock: parseInt(document.getElementById('productStock').value),
                description: document.getElementById('productDescription').value,
                image: document.getElementById('productImage').value,
                featured: document.getElementById('productFeatured').checked
            };

            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/products`, {
                    method: 'POST',
                    body: JSON.stringify(productData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to create product');
                }

                showMessage('تم إضافة المنتج بنجاح', 'success');
                productForm.reset();
                setTimeout(() => {
                    switchSection('products');
                }, 1000);
            } catch (error) {
                console.error('Error creating product:', error);
                showMessage(error.message || 'خطأ في إضافة المنتج', 'error');
            }
        });
    }

    // Category form
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const subcategories = document.getElementById('categorySubcategories').value
                .split(',')
                .map(s => s.trim())
                .filter(s => s);

            const categoryData = {
                id: document.getElementById('categoryId').value,
                name: document.getElementById('categoryName').value,
                icon: document.getElementById('categoryIcon').value,
                displayOrder: parseInt(document.getElementById('categoryOrder').value),
                subcategories: subcategories
            };

            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/categories`, {
                    method: 'POST',
                    body: JSON.stringify(categoryData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to create category');
                }

                showMessage('تم إضافة القسم بنجاح', 'success');
                categoryForm.reset();
                setTimeout(() => {
                    switchSection('categories');
                }, 1000);
            } catch (error) {
                console.error('Error creating category:', error);
                showMessage(error.message || 'خطأ في إضافة القسم', 'error');
            }
        });
    }

    // Load categories for product form
    loadCategoriesForForm();
});

// Edit functions (placeholder)
function editProduct(productId) {
    showMessage('ميزة التعديل قيد التطوير', 'info');
}

function editCategory(categoryId) {
    showMessage('ميزة التعديل قيد التطوير', 'info');
}
