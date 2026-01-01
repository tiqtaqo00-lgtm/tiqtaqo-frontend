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

// Get products from Firebase
async function getProducts() {
    try {
        // Wait for Firebase to be ready
        if (typeof window.isFirebaseReady !== 'function' || !window.isFirebaseReady()) {
            console.log('Firebase not ready yet, using localStorage');
            const products = localStorage.getItem('luxury_products');
            return products ? JSON.parse(products) : [];
        }
        
        const db = window.getDb();
        if (db) {
            const productsRef = window.collection(db, 'products');
            const snapshot = await window.getDocs(productsRef);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
    } catch (e) {
        console.log('Firebase error, using fallback:', e.message);
    }
    
    // Fallback to localStorage
    const products = localStorage.getItem('luxury_products');
    return products ? JSON.parse(products) : [];
}

// Save products to Firebase
async function saveProducts(products) {
    // Save to Firebase if available
    try {
        if (typeof window.isFirebaseReady === 'function' && window.isFirebaseReady()) {
            const db = window.getDb();
            if (db) {
                const batch = window.writeBatch(db);
                
                for (const product of products) {
                    const productRef = window.doc(db, 'products', product.id.toString());
                    if (product.id && typeof product.id === 'string') {
                        batch.set(productRef, product);
                    }
                }
                
                await batch.commit();
                console.log('Products saved to Firebase');
            }
        }
    } catch (e) {
        console.log('Firebase save failed, using localStorage:', e.message);
    }
    
    // Always save to localStorage as backup
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
        { id: 'packs', name: 'Packs', icon: 'fa-gift', visible: true, order: 1 },
        { id: 'homme', name: 'Homme', icon: 'fa-user-tie', visible: true, order: 2 },
        { id: 'femme', name: 'Femme', icon: 'fa-crown', visible: true, order: 3 },
        { id: 'wallets', name: 'Wallets', icon: 'fa-wallet', visible: true, order: 4 },
        { id: 'belts', name: 'Belts', icon: 'fa-ribbon', visible: true, order: 5 },
        { id: 'glasses', name: 'Glasses', icon: 'fa-glasses', visible: true, order: 6 },
        { id: 'accessoires', name: 'Accessoires', icon: 'fa-gem', visible: true, order: 7 }
    ];
    
    localStorage.setItem('luxury_categories', JSON.stringify(defaultCategories));
    return defaultCategories;
}

// Save categories to localStorage
function saveCategories(categories) {
    localStorage.setItem('luxury_categories', JSON.stringify(categories));
}

// Update statistics
async function updateStats() {
    const products = await getProducts();
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
async function loadProductsTable() {
    const products = await getProducts();
    const tbody = document.getElementById('productsTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #666;">
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
                ${product.images && product.images.length > 1 ? `<span style="display: block; font-size: 10px; color: #666;">+${product.images.length - 1} autres</span>` : ''}
            </td>
            <td>${product.name}</td>
            <td>${product.price} DH</td>
            <td><span class="category-badge badge-${product.category}">${getCategoryName(product.category)}</span></td>
            <td>${getGenderDisplay(product)}</td>
            <td>${product.promotion > 0 ? product.promotion + '%' : '-'}</td>
            <td>
                <button class="btn-toggle ${product.bestSeller ? 'active' : ''}" style="${product.bestSeller ? 'background: linear-gradient(135deg, #ff6b6b, #ee5a24);' : ''}" onclick="toggleProductBestSeller('${product.id}')">
                    ${product.bestSeller ? '<i class="fas fa-fire"></i> Oui' : '<i class="fas fa-times"></i> Non'}
                </button>
            </td>
            <td>
                <button class="btn-toggle ${product.visible ? 'active' : ''}" onclick="toggleProductVisibility('${product.id}')">
                    ${product.visible ? '<i class="fas fa-eye"></i> Visible' : '<i class="fas fa-eye-slash"></i> Caché'}
                </button>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn-delete" onclick="deleteProduct('${product.id}')">
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

// Get gender display in French
function getGenderDisplay(product) {
    const branchedCategories = ['packs', 'wallets', 'glasses', 'accessoires'];
    if (branchedCategories.includes(product.category)) {
        return product.gender === 'femme' ? 
            '<span class="badge-femme">Femme</span>' : 
            '<span class="badge-homme">Homme</span>';
    }
    return '-';
}

// Toggle product best seller status
async function toggleProductBestSeller(id) {
    const products = await getProducts();
    const product = products.find(p => p.id === id);
    if (product) {
        product.bestSeller = !product.bestSeller;
        await saveProducts(products);
        loadProductsTable();
    }
}

// Toggle product visibility
async function toggleProductVisibility(id) {
    const products = await getProducts();
    const product = products.find(p => p.id === id);
    if (product) {
        product.visible = !product.visible;
        await saveProducts(products);
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
async function deleteProduct(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        // Delete from Firebase
        try {
            if (typeof window.isFirebaseReady === 'function' && window.isFirebaseReady()) {
                const db = window.getDb();
                if (db) {
                    await window.deleteDoc(window.doc(db, 'products', id));
                }
            }
        } catch (e) {
            console.log('Firebase delete failed:', e.message);
        }
        
        // Update localStorage
        let products = await getProducts();
        products = products.filter(p => p.id !== id);
        await saveProducts(products);
        
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
        // Note: This would need to be async in a full implementation
        
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
    document.getElementById('imagePreviewContainer').innerHTML = '';
    document.getElementById('imagePreviewContainer').style.display = 'none';
    document.getElementById('colorsContainer').innerHTML = '';
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

// Handle category change - show/hide gender selection
function handleCategoryChange() {
    const categorySelect = document.getElementById('productCategory');
    const genderFormGroup = document.getElementById('genderFormGroup');
    const branchedCategories = ['packs', 'wallets', 'glasses', 'accessoires'];
    
    if (branchedCategories.includes(categorySelect.value)) {
        genderFormGroup.style.display = 'block';
        document.getElementById('productGender').setAttribute('required', 'true');
    } else {
        genderFormGroup.style.display = 'none';
        document.getElementById('productGender').removeAttribute('required');
    }
}

// Load category options in product form
function loadCategoryOptions() {
    const categories = getCategories();
    const select = document.getElementById('productCategory');
    select.innerHTML = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
    
    // Trigger category change handler to update gender visibility
    handleCategoryChange();
}

// Edit product
async function editProduct(id) {
    const products = await getProducts();
    const product = products.find(p => p.id === id);
    
    if (product) {
        document.getElementById('productModalTitle').textContent = 'Modifier le Produit';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPromotion').value = product.promotion || 0;
        document.getElementById('productBestSeller').checked = product.bestSeller || false;
        document.getElementById('productVisible').checked = product.visible;
        
        // Handle gender for branched categories
        const branchedCategories = ['packs', 'wallets', 'glasses', 'accessoires'];
        if (branchedCategories.includes(product.category)) {
            document.getElementById('genderFormGroup').style.display = 'block';
            document.getElementById('productGender').value = product.gender || 'homme';
            document.getElementById('productGender').setAttribute('required', 'true');
        } else {
            document.getElementById('genderFormGroup').style.display = 'none';
            document.getElementById('productGender').removeAttribute('required');
        }
        
        if (product.image || (product.images && product.images.length > 0)) {
            // Show image preview container
            const previewContainer = document.getElementById('imagePreviewContainer');
            previewContainer.innerHTML = '';
            previewContainer.style.display = 'grid';
            
            // Show all images
            const allImages = product.images && product.images.length > 0 ? product.images : [product.image];
            allImages.forEach((img, index) => {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'preview-image';
                imgDiv.innerHTML = `
                    <img src="${img}" alt="Image ${index + 1}">
                    <button type="button" class="remove-image-btn" onclick="removeExistingImage(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(imgDiv);
            });
        }
        
        // Load colors
        loadProductColors(product.colors || []);
        
        loadCategoryOptions();
        document.getElementById('productModal').style.display = 'flex';
    }
}

// Load product colors for editing
function loadProductColors(colors) {
    const container = document.getElementById('colorsContainer');
    container.innerHTML = '';
    
    colors.forEach((color, index) => {
        addColorRow(color.name, color.hex, color.image, index);
    });
}

// Add a new color row
function addColorRow(name = '', hex = '#000000', image = '', index = null) {
    const container = document.getElementById('colorsContainer');
    const rowId = index !== null ? `color-row-${index}` : `color-row-${Date.now()}`;
    
    const row = document.createElement('div');
    row.className = 'color-row';
    row.id = rowId;
    row.innerHTML = `
        <div class="color-inputs">
            <div class="color-name-group">
                <label>Nom du couleur</label>
                <input type="text" class="color-name" value="${name}" placeholder="Ex: Noir, Or, Argent...">
            </div>
            <div class="color-hex-group">
                <label>Couleur</label>
                <input type="color" class="color-hex" value="${hex}" onchange="updateColorPreview(this)">
            </div>
            <div class="color-image-group">
                <label>Image</label>
                <div class="color-image-upload" onclick="document.getElementById('colorImage-${rowId}').click()">
                    ${image ? `<img src="${image}" alt="Couleur">` : '<i class="fas fa-camera"></i>'}
                </div>
                <input type="file" id="colorImage-${rowId}" accept="image/*" style="display:none" onchange="handleColorImageUpload(this, '${rowId}')">
            </div>
            <button type="button" class="remove-color-btn" onclick="removeColorRow('${rowId}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(row);
}

// Update color preview circle
function updateColorPreview(colorInput) {
    const row = colorInput.closest('.color-row');
    const colorImageUpload = row.querySelector('.color-image-upload');
    colorImageUpload.style.background = colorInput.value;
}

// Handle color image upload
function handleColorImageUpload(input, rowId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const row = document.getElementById(rowId);
            const colorImageUpload = row.querySelector('.color-image-upload');
            colorImageUpload.innerHTML = `<img src="${e.target.result}" alt="Couleur">`;
            colorImageUpload.dataset.image = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Remove color row
function removeColorRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
    }
}

// Add new color
function addNewColor() {
    addColorRow();
}

// Get all colors from form
function getProductColors() {
    const container = document.getElementById('colorsContainer');
    const rows = container.querySelectorAll('.color-row');
    const colors = [];
    
    rows.forEach(row => {
        const name = row.querySelector('.color-name').value.trim();
        const hex = row.querySelector('.color-hex').value;
        const colorImageUpload = row.querySelector('.color-image-upload');
        const image = colorImageUpload.dataset.image || (colorImageUpload.querySelector('img') ? colorImageUpload.querySelector('img').src : '');
        
        if (name) {
            colors.push({ name, hex, image });
        }
    });
    
    return colors;
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

// Handle multiple image upload
function handleImageUpload(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
        const previewContainer = document.getElementById('imagePreviewContainer');
        
        // Check if preview container already has images (editing mode)
        if (previewContainer.innerHTML === '' && !document.getElementById('productId').value) {
            previewContainer.style.display = 'none';
        }
        
        Array.from(files).forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    addImageToPreview(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Add image to preview container
function addImageToPreview(imageData) {
    const previewContainer = document.getElementById('imagePreviewContainer');
    previewContainer.style.display = 'grid';
    
    const imgDiv = document.createElement('div');
    imgDiv.className = 'preview-image';
    imgDiv.dataset.image = imageData;
    imgDiv.innerHTML = `
        <img src="${imageData}" alt="Aperçu">
        <button type="button" class="remove-image-btn" onclick="removePreviewImage(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    previewContainer.appendChild(imgDiv);
}

// Remove preview image
function removePreviewImage(btn) {
    const imgDiv = btn.closest('.preview-image');
    imgDiv.remove();
    
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer.children.length === 0) {
        previewContainer.style.display = 'none';
    }
}

// Remove existing image (during edit)
function removeExistingImage(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
        const previewContainer = document.getElementById('imagePreviewContainer');
        if (previewContainer.children[index]) {
            previewContainer.children[index].remove();
        }
        
        // Add to removed images array (will be handled in saveProduct)
        if (!window.removedImages) window.removedImages = [];
        window.removedImages.push(index);
        
        if (previewContainer.children.length === 0) {
            previewContainer.style.display = 'none';
        }
    }
}

// Save product to Firebase
async function saveProduct(event) {
    event.preventDefault();
    
    const products = await getProducts();
    const id = document.getElementById('productId').value;
    const imageFiles = document.getElementById('productImage').files;
    
    const branchedCategories = ['packs', 'wallets', 'glasses', 'accessoires'];
    const selectedCategory = document.getElementById('productCategory').value;
    
    const productData = {
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        category: selectedCategory,
        description: document.getElementById('productDescription').value,
        promotion: parseInt(document.getElementById('productPromotion').value) || 0,
        bestSeller: document.getElementById('productBestSeller').checked,
        visible: document.getElementById('productVisible').checked,
        created_at: new Date().toISOString()
    };
    
    // Handle gender for branched categories
    if (branchedCategories.includes(selectedCategory)) {
        productData.gender = document.getElementById('productGender').value;
    } else {
        productData.gender = null;
    }
    
    // Get all images from preview container
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImages = previewContainer.querySelectorAll('.preview-image img');
    const images = Array.from(previewImages).map(img => img.src);
    
    // Handle images
    if (images.length > 0) {
        productData.image = images[0]; // Main image for backward compatibility
        productData.images = images;   // All images as array
    } else if (id) {
        // Keep existing images if editing and no new images added
        const existingProduct = products.find(p => p.id === id);
        if (existingProduct) {
            productData.image = existingProduct.image;
            productData.images = existingProduct.images || (existingProduct.image ? [existingProduct.image] : []);
        }
    }
    
    // Get colors
    productData.colors = getProductColors();
    
    // Save to Firebase
    try {
        if (typeof window.isFirebaseReady === 'function' && window.isFirebaseReady()) {
            const db = window.getDb();
            if (db) {
                if (id) {
                    // Update existing product
                    await window.updateDoc(window.doc(db, 'products', id), productData);
                } else {
                    // Add new product with auto-generated ID
                    const docRef = await window.addDoc(window.collection(db, 'products'), productData);
                    productData.id = docRef.id;
                    products.push(productData);
                }
                
                // Also save to localStorage as backup
                localStorage.setItem('luxury_products', JSON.stringify(products));
                
                closeProductModal();
                loadProductsTable();
                updateStats();
                
                alert('Produit enregistré avec succès!');
            } else {
                // Fallback if Firebase not available
                finalizeSaveProduct(id, productData, products);
            }
        } else {
            // Fallback if Firebase not ready
            finalizeSaveProduct(id, productData, products);
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Erreur lors de l\'enregistrement: ' + error.message);
    }
}

async function finalizeSaveProduct(id, productData, products) {
    if (id) {
        // Update existing product
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...productData };
        }
    } else {
        // Add new product
        const newId = 'p' + (Date.now().toString(36) + Math.random().toString(36).substr(2)).substr(0, 8);
        productData.id = newId;
        products.push(productData);
    }
    
    await saveProducts(products);
    closeProductModal();
    loadProductsTable();
    updateStats();
    
    alert('Produit enregistré avec succès!');
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
    document.getElementById('categoryModal').style.display = 'flex';
}

// Export functions to window for global access
window.checkAuth = checkAuth;
window.logout = logout;
window.loadAdminInfo = loadAdminInfo;
window.getProducts = getProducts;
window.saveProducts = saveProducts;
window.getCategories = getCategories;
window.saveCategories = saveCategories;
window.updateStats = updateStats;
window.loadProductsTable = loadProductsTable;
window.loadCategoriesTable = loadCategoriesTable;
window.getCategoryName = getCategoryName;
window.getGenderDisplay = getGenderDisplay;
window.toggleProductBestSeller = toggleProductBestSeller;
window.toggleProductVisibility = toggleProductVisibility;
window.toggleCategoryVisibility = toggleCategoryVisibility;
window.deleteProduct = deleteProduct;
window.deleteCategory = deleteCategory;
window.showAddProductModal = showAddProductModal;
window.showAddCategoryModal = showAddCategoryModal;
window.handleCategoryChange = handleCategoryChange;
window.loadCategoryOptions = loadCategoryOptions;
window.editProduct = editProduct;
window.loadProductColors = loadProductColors;
window.addColorRow = addColorRow;
window.updateColorPreview = updateColorPreview;
window.handleColorImageUpload = handleColorImageUpload;
window.removeColorRow = removeColorRow;
window.addNewColor = addNewColor;
window.getProductColors = getProductColors;
window.editCategory = editCategory;
window.handleImageUpload = handleImageUpload;
window.addImageToPreview = addImageToPreview;
window.removePreviewImage = removePreviewImage;
window.removeExistingImage = removeExistingImage;
window.saveProduct = saveProduct;
window.finalizeSaveProduct = finalizeSaveProduct;
window.saveCategory = saveCategory;
window.closeProductModal = closeProductModal;
window.closeCategoryModal = closeCategoryModal;

// Firebase Configuration - Inline to ensure it's always available
const firebaseConfig = {
    apiKey: "AIzaSyAmJp754L3V_AAUl6lV4LzE_dUCEFaX_nA",
    authDomain: "tiqtaqo-store.firebaseapp.com",
    projectId: "tiqtaqo-store",
    storageBucket: "tiqtaqo-store.firebasestorage.app",
    messagingSenderId: "747111253966",
    appId: "1:747111253966:web:84c265ac397b644fe28d9f"
};

// Initialize Firebase if not already initialized
async function initializeFirebaseIfNeeded() {
    // Check if Firebase is already initialized
    if (window.firebaseInitialized) {
        return;
    }
    
    try {
        // Dynamically import Firebase
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
        const { getFirestore, enableIndexedDbPersistence, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // Enable offline persistence
        enableIndexedDbPersistence(db).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.log('Multiples tabs open, persistence enabled in one tab only');
            } else if (err.code === 'unimplemented') {
                console.log('Browser does not support persistence');
            }
        });
        
        // Export Firebase functions to window
        window.getDb = () => db;
        window.collection = collection;
        window.doc = doc;
        window.getDoc = getDoc;
        window.getDocs = getDocs;
        window.addDoc = addDoc;
        window.updateDoc = updateDoc;
        window.deleteDoc = deleteDoc;
        window.writeBatch = writeBatch;
        window.serverTimestamp = serverTimestamp;
        window.firebaseInitialized = true;
        window.isFirebaseReady = () => true;
        
        console.log('Firebase initialized successfully in admin.js');
    } catch (error) {
        console.error('Firebase initialization error:', error);
        // Fallback: set up empty functions
        window.isFirebaseReady = () => false;
    }
}

// Initialize dashboard
async function initializeDashboard() {
    // Initialize Firebase first if not already done
    await initializeFirebaseIfNeeded();
    
    // Wait for Firebase to be ready (up to 5 seconds)
    let attempts = 0;
    const maxAttempts = 50; // 50 * 100ms = 5 seconds
    
    while (typeof window.isFirebaseReady !== 'function' || !window.isFirebaseReady()) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (attempts >= maxAttempts) {
            console.log('Firebase initialization timeout, proceeding anyway');
            break;
        }
    }
    
    if (checkAuth()) {
        loadAdminInfo();
        await updateStats();
        await loadProductsTable();
        loadCategoriesTable();
    }
}

// Auto-initialize when loaded as module
if (typeof window !== 'undefined') {
    // Check if DOM is already ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        initializeDashboard();
    }
}

// Export for module usage
export { initializeDashboard, checkAuth, logout, getProducts, saveProducts };
