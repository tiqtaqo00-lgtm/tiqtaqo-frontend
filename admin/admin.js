// Check if admin is logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('admin_logged_in');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('admin_logged_in');
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

// Get products from localStorage
function getProducts() {
    const products = localStorage.getItem('luxury_products');
    return products ? JSON.parse(products) : [];
}

// Save products to localStorage
function saveProducts(products) {
    localStorage.setItem('luxury_products', JSON.stringify(products));
}

// Get categories from localStorage
function getCategories() {
    const categories = localStorage.getItem('luxury_categories');
    if (categories) {
        return JSON.parse(categories);
    }
    
    // Default categories
    const defaultCategories = [
        { id: 'packs', name: 'Packs', icon: 'fa-gifts', visible: true, order: 1 },
        { id: 'homme', name: 'Homme', icon: 'fa-watch', visible: true, order: 2 },
        { id: 'femme', name: 'Femme', icon: 'fa-gem', visible: true, order: 3 },
        { id: 'accessoires', name: 'Accessoires', icon: 'fa-ring', visible: true, order: 4 },
        { id: 'wallets', name: 'Wallets', icon: 'fa-wallet', visible: true, order: 5 },
        { id: 'belts', name: 'Belts', icon: 'fa-belt', visible: true, order: 6 },
        { id: 'glasses', name: 'Glasses', icon: 'fa-glasses', visible: true, order: 7 }
    ];
    
    localStorage.setItem('luxury_categories', JSON.stringify(defaultCategories));
    return defaultCategories;
}

// Save categories to localStorage
function saveCategories(categories) {
    localStorage.setItem('luxury_categories', JSON.stringify(categories));
}

// Update statistics
function updateStats() {
    const products = getProducts();
    const categories = getCategories();
    
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalCategories').textContent = categories.length;
    
    // Update category-specific stats
    categories.forEach(cat => {
        const count = products.filter(p => p.category === cat.id).length;
        const statElement = document.getElementById(`${cat.id}Products`);
        if (statElement) {
            statElement.textContent = count;
        }
    });
}

// Load products table
function loadProductsTable() {
    const products = getProducts();
    const tbody = document.getElementById('productsTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-box-open" style="font-size: 48px; color: var(--gold); display: block; margin-bottom: 15px;"></i>
                    Aucun produit disponible. Cliquez sur "Ajouter un Produit" pour commencer.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>
                ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : 'Pas d\'image'}
            </td>
            <td>${product.name}</td>
            <td>${product.price} DH</td>
            <td><span class="category-badge badge-${product.category}">${getCategoryName(product.category)}</span></td>
            <td>${product.promotion > 0 ? product.promotion + '%' : '-'}</td>
            <td>
                <button class="btn-toggle ${product.visible ? 'active' : ''}" onclick="toggleProductVisibility(${product.id})">
                    ${product.visible ? '<i class="fas fa-eye"></i> Visible' : '<i class="fas fa-eye-slash"></i> Caché'}
                </button>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn-delete" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load categories table
function loadCategoriesTable() {
    const categories = getCategories();
    const tbody = document.getElementById('categoriesTableBody');
    
    if (!tbody) return;
    
    tbody.innerHTML = categories.sort((a, b) => a.order - b.order).map(category => `
        <tr>
            <td>${category.order}</td>
            <td><i class="fas ${category.icon}"></i></td>
            <td>${category.name}</td>
            <td>${category.id}</td>
            <td>
                <button class="btn-toggle ${category.visible ? 'active' : ''}" onclick="toggleCategoryVisibility('${category.id}')">
                    ${category.visible ? '<i class="fas fa-eye"></i> Visible' : '<i class="fas fa-eye-slash"></i> Caché'}
                </button>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editCategory('${category.id}')">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn-delete" onclick="deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Get category name in French
function getCategoryName(categoryId) {
    const categories = getCategories();
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
}

// Toggle product visibility
function toggleProductVisibility(id) {
    const products = getProducts();
    const product = products.find(p => p.id === id);
    if (product) {
        product.visible = !product.visible;
        saveProducts(products);
        loadProductsTable();
    }
}

// Toggle category visibility
function toggleCategoryVisibility(id) {
    const categories = getCategories();
    const category = categories.find(c => c.id === id);
    if (category) {
        category.visible = !category.visible;
        saveCategories(categories);
        loadCategoriesTable();
    }
}

// Delete product
function deleteProduct(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        let products = getProducts();
        products = products.filter(p => p.id !== id);
        saveProducts(products);
        loadProductsTable();
        updateStats();
    }
}

// Delete category
function deleteCategory(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Tous les produits associés seront également supprimés.')) {
        let categories = getCategories();
        categories = categories.filter(c => c.id !== id);
        saveCategories(categories);
        
        // Delete all products in this category
        let products = getProducts();
        products = products.filter(p => p.category !== id);
        saveProducts(products);
        
        loadCategoriesTable();
        loadProductsTable();
        updateStats();
    }
}

// Show add product modal
function showAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Ajouter un Produit';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('productModal').style.display = 'flex';
    loadCategoryOptions();
}

// Show add category modal
function showAddCategoryModal() {
    document.getElementById('categoryModalTitle').textContent = 'Ajouter une Catégorie';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModal').style.display = 'flex';
}

// Load category options in product form
function loadCategoryOptions() {
    const categories = getCategories();
    const select = document.getElementById('productCategory');
    select.innerHTML = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
}

// Edit product
function editProduct(id) {
    const products = getProducts();
    const product = products.find(p => p.id === id);
    
    if (product) {
        document.getElementById('productModalTitle').textContent = 'Modifier le Produit';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPromotion').value = product.promotion || 0;
        document.getElementById('productVisible').checked = product.visible;
        
        if (product.image) {
            document.getElementById('imagePreview').src = product.image;
            document.getElementById('imagePreview').style.display = 'block';
        }
        
        loadCategoryOptions();
        document.getElementById('productModal').style.display = 'flex';
    }
}

// Edit category
function editCategory(id) {
    const categories = getCategories();
    const category = categories.find(c => c.id === id);
    
    if (category) {
        document.getElementById('categoryModalTitle').textContent = 'Modifier la Catégorie';
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryIcon').value = category.icon;
        document.getElementById('categoryOrder').value = category.order;
        document.getElementById('categoryVisible').checked = category.visible;
        document.getElementById('categoryModal').style.display = 'flex';
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
function saveProduct(event) {
    event.preventDefault();
    
    const products = getProducts();
    const id = document.getElementById('productId').value;
    const imageFile = document.getElementById('productImage').files[0];
    
    const productData = {
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        description: document.getElementById('productDescription').value,
        promotion: parseInt(document.getElementById('productPromotion').value) || 0,
        visible: document.getElementById('productVisible').checked
    };
    
    // Handle image
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            productData.image = e.target.result;
            finalizeSaveProduct(id, productData, products);
        };
        reader.readAsDataURL(imageFile);
    } else {
        // Keep existing image if editing
        if (id) {
            const existingProduct = products.find(p => p.id === parseInt(id));
            if (existingProduct) {
                productData.image = existingProduct.image;
            }
        }
        finalizeSaveProduct(id, productData, products);
    }
}

function finalizeSaveProduct(id, productData, products) {
    if (id) {
        // Update existing product
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            products[index] = { ...products[index], ...productData };
        }
    } else {
        // Add new product
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, ...productData });
    }
    
    saveProducts(products);
    closeProductModal();
    loadProductsTable();
    updateStats();
}

// Save category
function saveCategory(event) {
    event.preventDefault();
    
    const categories = getCategories();
    const oldId = document.getElementById('categoryId').value;
    const newId = document.getElementById('categoryName').value.toLowerCase().replace(/\s+/g, '-');
    
    const categoryData = {
        id: oldId || newId,
        name: document.getElementById('categoryName').value,
        icon: document.getElementById('categoryIcon').value,
        order: parseInt(document.getElementById('categoryOrder').value),
        visible: document.getElementById('categoryVisible').checked
    };
    
    if (oldId) {
        // Update existing category
        const index = categories.findIndex(c => c.id === oldId);
        if (index !== -1) {
            categories[index] = categoryData;
        }
    } else {
        // Add new category
        categories.push(categoryData);
    }
    
    saveCategories(categories);
    closeCategoryModal();
    loadCategoriesTable();
    updateStats();
}

// Close modals
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (checkAuth()) {
        loadAdminInfo();
        updateStats();
        loadProductsTable();
        loadCategoriesTable();
    }
});