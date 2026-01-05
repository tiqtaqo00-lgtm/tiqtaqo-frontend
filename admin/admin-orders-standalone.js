// Admin Orders Management System - Complete standalone version
// All code in one file to avoid loading issues

console.log('=== ADMIN ORDERS SYSTEM STARTING ===');

// Global orders cache
let ordersCache = [];
let ordersCacheValid = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, starting initialization...');
    await initializeFirebaseAndLoadOrders();
});

// Initialize Firebase and load orders
async function initializeFirebaseAndLoadOrders() {
    try {
        console.log('Step 1: Show loading state');
        showOrdersLoading();

        console.log('Step 2: Wait for Firebase');
        
        // Wait for Firebase to be available
        let attempts = 0;
        const maxAttempts = 100;
        
        while (typeof window.OrderAPI === 'undefined' || typeof window.OrderAPI.getOrders !== 'function') {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            
            if (attempts >= maxAttempts) {
                console.error('Timeout waiting for OrderAPI after', maxAttempts, 'attempts');
                throw new Error('Firebase API not available');
            }
        }

        console.log('Step 3: Firebase available after', attempts, 'attempts');

        // Initialize Firebase
        if (typeof window.initFirebase === 'function') {
            console.log('Step 4: Initialize Firebase');
            window.initFirebase();
        }

        // Wait for Firebase to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Step 5: Load orders');
        await loadOrders();

        console.log('Step 6: Setup UI');
        setupFilters();
        setupEventListeners();

    } catch (error) {
        console.error('ERROR:', error);
        showNotification('حدث خطأ: ' + error.message, 'error');
        loadAdminInfo();
        loadOrdersFromLocalStorage();
        setupFilters();
        setupEventListeners();
    }
}

// Show loading state
function showOrdersLoading() {
    console.log('showOrdersLoading called');
    const tableBody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('ordersTable');

    if (table) table.style.display = 'none';
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #d4af37; margin-bottom: 15px;"></i>
                    <p style="color: #666;">جاري تحميل الطلبات...</p>
                </td>
            </tr>
        `;
        console.log('Loading HTML inserted into tableBody');
    } else {
        console.error('tableBody not found!');
    }
}

// Load orders from Firebase
async function loadOrders() {
    try {
        console.log('loadOrders called');
        console.log('window.OrderAPI:', window.OrderAPI);

        if (!window.OrderAPI) {
            console.error('OrderAPI is undefined!');
            loadOrdersFromLocalStorage();
            return;
        }
        
        if (typeof window.OrderAPI.getOrders !== 'function') {
            console.error('OrderAPI.getOrders is not a function!');
            loadOrdersFromLocalStorage();
            return;
        }
        
        console.log('Calling OrderAPI.getOrders()...');
        const orders = await window.OrderAPI.getOrders();
        console.log('Orders received:', orders.length);
        
        ordersCache = orders || [];
        ordersCacheValid = true;
        updateStats(ordersCache);
        displayOrders(ordersCache, 'all');

    } catch (error) {
        console.error('ERROR loading orders:', error);
        loadOrdersFromLocalStorage();
    }
}

// Fallback: Load from localStorage
function loadOrdersFromLocalStorage() {
    console.log('loadOrdersFromLocalStorage called');
    try {
        const orders = localStorage.getItem('tiqtaqo_orders');
        ordersCache = orders ? JSON.parse(orders) : [];
        ordersCacheValid = true;
        console.log('Loaded from localStorage:', ordersCache.length, 'orders');
        updateStats(ordersCache);
        displayOrders(ordersCache, 'all');
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        ordersCache = [];
        updateStats([]);
        displayOrders([], 'all');
    }
}

// Update statistics
function updateStats(orders) {
    console.log('updateStats called with', orders.length, 'orders');
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;

    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => {
        const orderDate = o.createdAt ? new Date(o.createdAt).toDateString() : '';
        return orderDate === today;
    }).length;

    const totalOrdersEl = document.getElementById('totalOrders');
    const pendingOrdersEl = document.getElementById('pendingOrders');
    const completedOrdersEl = document.getElementById('completedOrders');
    const todayOrdersEl = document.getElementById('todayOrders');

    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
    if (completedOrdersEl) completedOrdersEl.textContent = completedOrders;
    if (todayOrdersEl) todayOrdersEl.textContent = todayOrders;
}

// Display orders in table
function displayOrders(orders, filter) {
    console.log('displayOrders called with', orders.length, 'orders, filter:', filter);
    const tableBody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('ordersTable');

    if (!tableBody) {
        console.error('tableBody not found in displayOrders!');
        return;
    }

    // Filter orders
    let filteredOrders = orders;
    if (filter !== 'all') {
        filteredOrders = orders.filter(o => o.status === filter);
    }

    // Sort by date
    filteredOrders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    console.log('Displaying', filteredOrders.length, 'filtered orders');

    if (filteredOrders.length === 0) {
        if (table) table.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }

    if (table) table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    // Generate table rows
    tableBody.innerHTML = filteredOrders.map(order => {
        const date = order.createdAt ? new Date(order.createdAt) : new Date();
        const formattedDate = formatDate(date);
        const formattedTime = formatTime(date);

        const statusClass = order.status === 'completed' ? 'completed' :
                           order.status === 'cancelled' ? 'cancelled' : 'pending';

        const statusText = order.status === 'pending' ? 'معلقة' :
                          order.status === 'completed' ? 'مكتملة' : 'ملغاة';

        const displayId = order.id.substring(0, 8).toUpperCase();
        const customerName = order.customerName || order.name || 'عميل';
        const productName = order.productName || order.product_name || 'منتج';
        const city = order.city || order.customerCity || 'غير محدد';

        return `
            <tr data-order-id="${order.id}">
                <td class="order-id">#${displayId}</td>
                <td class="customer-name">${escapeHtml(customerName)}</td>
                <td>${escapeHtml(productName)}</td>
                <td>${escapeHtml(city)}</td>
                <td>
                    <div>${formattedDate}</div>
                    <small style="color: #999;">${formattedTime}</small>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="order-actions">
                        <button class="btn-view" onclick="viewOrderDetails('${order.id}')" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-whatsapp" onclick="contactCustomerWhatsApp('${order.id}')" title="مراسلة واتساب">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        ${order.status === 'pending' ? `
                            <button class="btn-complete" onclick="markOrderCompleted('${order.id}')" title="إكمال الطلب">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn-delete" onclick="deleteOrder('${order.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('Table rows generated');
}

// Setup filter buttons
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            await loadOrdersFromCacheOrFirebase();
            displayOrders(ordersCache, filter);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    const closeDetailsBtn = document.getElementById('closeDetails');
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', function() {
            document.getElementById('orderDetailsModal').classList.remove('active');
        });
    }

    const orderDetailsModal = document.getElementById('orderDetailsModal');
    if (orderDetailsModal) {
        orderDetailsModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }
}

// Load admin info
function loadAdminInfo() {
    const adminEmail = localStorage.getItem('admin_email') || localStorage.getItem('user_email') || 'admin@tiqtaqo.ma';
    const adminEmailElement = document.getElementById('adminEmail');
    if (adminEmailElement) {
        adminEmailElement.textContent = adminEmail;
    }
}

// Load orders from cache or Firebase
async function loadOrdersFromCacheOrFirebase() {
    if (ordersCacheValid && ordersCache.length > 0) {
        return ordersCache;
    }
    await loadOrders();
    return ordersCache;
}

// View order details
async function viewOrderDetails(orderId) {
    const orders = await loadOrdersFromCacheOrFirebase();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        alert('الطلب غير موجود');
        return;
    }

    const date = order.createdAt ? new Date(order.createdAt) : new Date();
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(date);

    const statusClass = order.status === 'completed' ? 'completed' :
                       order.status === 'cancelled' ? 'cancelled' : 'pending';

    const statusText = order.status === 'pending' ? 'معلقة' :
                      order.status === 'completed' ? 'مكتملة' : 'ملغاة';

    const customerName = order.customerName || order.name || 'عميل';
    const customerPhone = order.customerPhone || order.phone || '';
    const city = order.city || order.customerCity || 'غير محدد';
    const address = order.address || order.customerAddress || '';
    const productName = order.productName || order.product_name || 'منتج';
    const productPrice = order.productPrice || order.price || 0;

    const detailsHTML = `
        <div class="detail-section">
            <h4><i class="fas fa-box"></i> معلومات الطلب</h4>
            <div class="detail-row">
                <span class="detail-label">رقم الطلب</span>
                <span class="detail-value">#${order.id.toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الحالة</span>
                <span class="detail-value"><span class="status-badge ${statusClass}">${statusText}</span></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">تاريخ الطلب</span>
                <span class="detail-value">${formattedDate} - ${formattedTime}</span>
            </div>
        </div>

        <div class="detail-section">
            <h4><i class="fas fa-user"></i> معلومات العميل</h4>
            <div class="detail-row">
                <span class="detail-label">الاسم</span>
                <span class="detail-value">${escapeHtml(customerName)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الهاتف</span>
                <span class="detail-value">
                    <a href="tel:${customerPhone}" style="color: var(--gold);">${customerPhone}</a>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">المدينة</span>
                <span class="detail-value">${escapeHtml(city)}</span>
            </div>
            ${address ? `
            <div class="detail-row">
                <span class="detail-label">العنوان</span>
                <span class="detail-value">${escapeHtml(address)}</span>
            </div>
            ` : ''}
        </div>

        <div class="detail-section">
            <h4><i class="fas fa-shopping-bag"></i> تفاصيل الطلب</h4>
            <div class="detail-row">
                <span class="detail-label">اسم المنتج</span>
                <span class="detail-value">${escapeHtml(productName)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">سعر المنتج</span>
                <span class="detail-value" style="color: var(--gold); font-weight: 700;">${productPrice} DH</span>
            </div>
        </div>

        <div class="detail-actions">
            <button class="btn-whatsapp" onclick="contactCustomerWhatsApp('${order.id}')">
                <i class="fab fa-whatsapp"></i>
                مراسلة واتساب
            </button>
            <a href="tel:${customerPhone}" class="btn-complete" style="flex: 1; padding: 14px; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, var(--info) 0%, #138496 100%); color: var(--white); text-decoration: none;">
                <i class="fas fa-phone"></i>
                اتصال هاتفي
            </a>
        </div>
    `;

    const orderDetailsBody = document.getElementById('orderDetailsBody');
    if (orderDetailsBody) {
        orderDetailsBody.innerHTML = detailsHTML;
    }
    const orderDetailsModal = document.getElementById('orderDetailsModal');
    if (orderDetailsModal) {
        orderDetailsModal.classList.add('active');
    }
}

// Contact customer via WhatsApp
async function contactCustomerWhatsApp(orderId) {
    const orders = await loadOrdersFromCacheOrFirebase();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        alert('الطلب غير موجود');
        return;
    }

    const customerPhone = order.customerPhone || order.phone || '';
    const phone = customerPhone.replace(/[^0-9]/g, '');
    const customerName = order.customerName || order.name || 'عميل';
    const productName = order.productName || order.product_name || 'منتج';
    const productPrice = order.productPrice || order.price || 0;

    const message = `مرحباً ${customerName}،

شكراً لطلبكم من TiqtaQo!

طلبكم: ${productName}
السعر: ${productPrice} DH

نحن نراجع طلبكم الآن وسنتواصل معكم قريباً.`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Mark order as completed
async function markOrderCompleted(orderId) {
    if (!confirm('هل أنت متأكد من إكمال هذا الطلب؟')) {
        return;
    }

    try {
        if (window.OrderAPI && typeof window.OrderAPI.updateOrderStatus === 'function') {
            const success = await window.OrderAPI.updateOrderStatus(orderId, 'completed');
            if (success) {
                const orderIndex = ordersCache.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    ordersCache[orderIndex].status = 'completed';
                }
                updateStats(ordersCache);
                displayOrders(ordersCache, getCurrentFilter());
                showNotification('تم إكمال الطلب بنجاح');
                return;
            }
        }
        updateOrderInLocalStorage(orderId, { status: 'completed' });
        await loadOrders();
        showNotification('تم إكمال الطلب بنجاح');
    } catch (error) {
        console.error('Error completing order:', error);
        showNotification('حدث خطأ', 'error');
    }
}

// Delete order
async function deleteOrder(orderId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        return;
    }

    try {
        if (window.OrderAPI && typeof window.OrderAPI.deleteOrder === 'function') {
            const success = await window.OrderAPI.deleteOrder(orderId);
            if (success) {
                ordersCache = ordersCache.filter(o => o.id !== orderId);
                updateStats(ordersCache);
                displayOrders(ordersCache, getCurrentFilter());
                showNotification('تم حذف الطلب بنجاح');
                return;
            }
        }
        deleteOrderFromLocalStorage(orderId);
        await loadOrders();
        showNotification('تم حذف الطلب بنجاح');
    } catch (error) {
        console.error('Error deleting order:', error);
        showNotification('حدث خطأ', 'error');
    }
}

// Update order in localStorage
function updateOrderInLocalStorage(orderId, updates) {
    try {
        const orders = JSON.parse(localStorage.getItem('tiqtaqo_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex] = { ...orders[orderIndex], ...updates };
            localStorage.setItem('tiqtaqo_orders', JSON.stringify(orders));
        }
    } catch (error) {
        console.error('Error updating order:', error);
    }
}

// Delete order from localStorage
function deleteOrderFromLocalStorage(orderId) {
    try {
        const orders = JSON.parse(localStorage.getItem('tiqtaqo_orders') || '[]');
        const filteredOrders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('tiqtaqo_orders', JSON.stringify(filteredOrders));
    } catch (error) {
        console.error('Error deleting order:', error);
    }
}

// Get current filter
function getCurrentFilter() {
    const activeBtn = document.querySelector('.filter-btn.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('orderNotification');
    const notificationText = document.getElementById('notificationText');

    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Format date
function formatDate(date) {
    if (!date || isNaN(date.getTime())) {
        return '--/--/----';
    }
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('ar-SA', options);
}

// Format time
function formatTime(date) {
    if (!date || isNaN(date.getTime())) {
        return '--:--';
    }
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('ar-SA', options);
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally
window.viewOrderDetails = viewOrderDetails;
window.contactCustomerWhatsApp = contactCustomerWhatsApp;
window.markOrderCompleted = markOrderCompleted;
window.deleteOrder = deleteOrder;

console.log('=== ALL FUNCTIONS DEFINED ===');
