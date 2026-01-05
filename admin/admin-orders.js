// Admin Orders Management System - Firebase Edition
// Orders are now stored in Firebase Firestore for permanent access from any device

// NOTE: OrderAPI is imported via window from firebase-config.js which is loaded as a module
// The module exports OrderAPI to window object for compatibility

// Debug: Check what was loaded
console.log('=== FIREBASE ORDER API DEBUG ===');
console.log('window.OrderAPI:', window.OrderAPI);
console.log('window.OrderAPI?.getOrders:', typeof window.OrderAPI?.getOrders);

// Global orders cache for real-time updates
let ordersCache = [];
let ordersCacheValid = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for Firebase to be ready, then load orders
    await waitForFirebaseAndLoadOrders();
});

// Wait for Firebase and load orders
async function waitForFirebaseAndLoadOrders() {
    try {
        // Show loading state
        showOrdersLoading();

        // Wait for Firebase to be available
        let attempts = 0;
        const maxAttempts = 20;
        
        while (!window.OrderAPI || typeof window.OrderAPI.getOrders !== 'function') {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            
            if (attempts >= maxAttempts) {
                console.error('Firebase API not available after', maxAttempts, 'attempts');
                throw new Error('Firebase API not available');
            }
        }

        console.log('Firebase API available after', attempts, 'attempts');

        // Initialize Firebase if needed
        if (typeof window.initFirebase === 'function') {
            window.initFirebase();
        }

        // Give Firebase a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Load admin info and orders
        loadAdminInfo();
        await loadOrders();
        setupFilters();
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing orders system:', error);
        showNotification('حدث خطأ في تحميل الطلبات', 'error');
        // Fallback to localStorage if Firebase fails
        loadAdminInfo();
        loadOrdersFromLocalStorage();
        setupFilters();
        setupEventListeners();
    }
}

// Show loading state for orders
function showOrdersLoading() {
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
    }
}

// Load admin info from localStorage
function loadAdminInfo() {
    const adminEmail = localStorage.getItem('admin_email') || localStorage.getItem('user_email') || 'admin@tiqtaqo.ma';
    const adminEmailElement = document.getElementById('adminEmail');
    if (adminEmailElement) {
        adminEmailElement.textContent = adminEmail;
    }
}

// Load all orders from Firebase
async function loadOrders() {
    try {
        console.log('=== LOAD ORDERS DEBUG ===');
        console.log('window.OrderAPI:', window.OrderAPI);
        console.log('typeof window.OrderAPI:', typeof window.OrderAPI);
        
        const OrderAPI = window.OrderAPI;
        
        if (!OrderAPI) {
            console.error('OrderAPI is undefined!');
            loadOrdersFromLocalStorage();
            return;
        }
        
        if (typeof OrderAPI.getOrders !== 'function') {
            console.error('OrderAPI.getOrders is not a function!');
            console.error('OrderAPI contents:', OrderAPI);
            loadOrdersFromLocalStorage();
            return;
        }
        
        console.log('Calling OrderAPI.getOrders()...');
        const orders = await OrderAPI.getOrders();
        console.log('Orders received:', orders);
        console.log('Orders length:', orders?.length);
        
        ordersCache = orders || [];
        ordersCacheValid = true;
        updateStats(ordersCache);
        displayOrders(ordersCache, 'all');

    } catch (error) {
        console.error('=== ERROR IN LOAD ORDERS ===');
        console.error('Error loading orders from Firebase:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        // Fallback to localStorage on error
        loadOrdersFromLocalStorage();
    }
}

// Load orders from localStorage (fallback)
function loadOrdersFromLocalStorage() {
    try {
        const orders = localStorage.getItem('tiqtaqo_orders');
        ordersCache = orders ? JSON.parse(orders) : [];
        ordersCacheValid = true;
        updateStats(ordersCache);
        displayOrders(ordersCache, 'all');
    } catch (e) {
        console.error('Error loading orders from localStorage:', e);
        ordersCache = [];
        updateStats([]);
        displayOrders([], 'all');
    }
}

// Get all orders (from cache or Firebase)
async function getOrders() {
    // Return cached orders if valid
    if (ordersCacheValid && ordersCache.length > 0) {
        return ordersCache;
    }

    const OrderAPI = window.OrderAPI;
    
    // Try Firebase if cache is empty
    if (OrderAPI && typeof OrderAPI.getOrders === 'function') {
        try {
            const orders = await OrderAPI.getOrders();
            ordersCache = orders || [];
            ordersCacheValid = true;
            return ordersCache;
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    // Fallback to localStorage
    return loadOrdersFromLocalStorage() || [];
}

// Update statistics
function updateStats(orders) {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    // Count today's orders
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => {
        const orderDate = o.createdAt ? new Date(o.createdAt).toDateString() : '';
        return orderDate === today;
    }).length;

    // Update DOM
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
function displayOrders(orders, filter = 'all') {
    const tableBody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('ordersTable');

    if (!tableBody) return;

    // Filter orders
    let filteredOrders = orders;
    if (filter !== 'all') {
        filteredOrders = orders.filter(o => o.status === filter);
    }

    // Sort by date (newest first) - handle both Firebase server timestamps and regular dates
    filteredOrders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    if (filteredOrders.length === 0) {
        if (table) table.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            const emptyMessage = emptyState.querySelector('p');
            if (emptyMessage) {
                if (filter === 'all') {
                    emptyMessage.textContent = 'لا توجد طلبات حالياً';
                } else if (filter === 'pending') {
                    emptyMessage.textContent = 'لا توجد طلبات معلقة';
                } else if (filter === 'completed') {
                    emptyMessage.textContent = 'لا توجد طلبات مكتملة';
                } else if (filter === 'cancelled') {
                    emptyMessage.textContent = 'لا توجد طلبات ملغاة';
                }
            }
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

        // Get display ID (handle both Firebase IDs and custom IDs)
        const displayId = order.id.substring(0, 8).toUpperCase();

        // Get customer name safely
        const customerName = order.customerName || order.name || 'عميل';

        // Get product name safely
        const productName = order.productName || order.product_name || 'منتج';

        // Get city safely
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
                            <button class="btn-cancel" onclick="markOrderCancelled('${order.id}')" title="إلغاء الطلب">
                                <i class="fas fa-times"></i>
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
}

// Setup filter buttons
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;
            const orders = await getOrders();
            displayOrders(orders, filter);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Close details modal
    const closeDetailsBtn = document.getElementById('closeDetails');
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', function() {
            document.getElementById('orderDetailsModal').classList.remove('active');
        });
    }

    // Close modal when clicking outside
    const orderDetailsModal = document.getElementById('orderDetailsModal');
    if (orderDetailsModal) {
        orderDetailsModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }
}

// View order details
async function viewOrderDetails(orderId) {
    const orders = await getOrders();
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

    // Safely get order data
    const customerName = order.customerName || order.name || 'عميل';
    const customerPhone = order.customerPhone || order.phone || '';
    const city = order.city || order.customerCity || 'غير محدد';
    const address = order.address || order.customerAddress || '';
    const productName = order.productName || order.product_name || 'منتج';
    const productPrice = order.productPrice || order.price || 0;
    const notes = order.notes || order.customerNotes || '';
    const selectedColor = order.selectedColor || order.color || '';

    // Build cart items HTML if available
    let cartItemsHTML = '';
    if (order.cartItems && order.cartItems.length > 0) {
        cartItemsHTML = order.cartItems.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span>${escapeHtml(item.name)} x${item.quantity}${item.color ? ` - ${item.color}` : ''}</span>
                <span style="color: var(--gold); font-weight: 600;">${Math.round(item.price * item.quantity)} DH</span>
            </div>
        `).join('');

        cartItemsHTML = `
            <div style="margin-bottom: 15px;">
                <span class="detail-label" style="display: block; margin-bottom: 10px;">المنتجات:</span>
                ${cartItemsHTML}
            </div>
            <div class="detail-row" style="border-top: 2px solid var(--gold); padding-top: 10px; margin-top: 10px;">
                <span class="detail-label" style="font-weight: 600;">المجموع الكلي</span>
                <span class="detail-value" style="color: var(--gold); font-weight: 700; font-size: 18px;">${productPrice} DH</span>
            </div>
        `;
    } else {
        cartItemsHTML = `
            <div class="detail-row">
                <span class="detail-label">اسم المنتج</span>
                <span class="detail-value">${escapeHtml(productName)}${selectedColor ? ` - ${selectedColor}` : ''}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">سعر المنتج</span>
                <span class="detail-value" style="color: var(--gold); font-weight: 700;">${productPrice} DH</span>
            </div>
        `;
    }

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
            ${cartItemsHTML}
        </div>

        ${notes ? `
        <div class="detail-section">
            <h4><i class="fas fa-comment-alt"></i> ملاحظات</h4>
            <div class="detail-row">
                <span class="detail-value" style="background: var(--light-gray); padding: 15px; border-radius: 8px;">${escapeHtml(notes)}</span>
            </div>
        </div>
        ` : ''}

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
    const orders = await getOrders();
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
        const OrderAPI = window.OrderAPI;
        
        // Try Firebase first
        if (OrderAPI && typeof OrderAPI.updateOrderStatus === 'function') {
            const success = await OrderAPI.updateOrderStatus(orderId, 'completed');
            if (success) {
                // Update local cache
                const orderIndex = ordersCache.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    ordersCache[orderIndex].status = 'completed';
                    ordersCache[orderIndex].completedAt = new Date().toISOString();
                }

                updateStats(ordersCache);
                displayOrders(ordersCache, getCurrentFilter());
                showNotification('تم إكمال الطلب بنجاح');
                return;
            }
        }

        // Fallback to localStorage
        updateOrderInLocalStorage(orderId, { status: 'completed', completedAt: new Date().toISOString() });
        await loadOrders();
        showNotification('تم إكمال الطلب بنجاح');

    } catch (error) {
        console.error('Error completing order:', error);
        showNotification('حدث خطأ أثناء إكمال الطلب', 'error');
    }
}

// Mark order as cancelled
async function markOrderCancelled(orderId) {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
        return;
    }

    try {
        const OrderAPI = window.OrderAPI;
        
        // Try Firebase first
        if (OrderAPI && typeof OrderAPI.updateOrderStatus === 'function') {
            const success = await OrderAPI.updateOrderStatus(orderId, 'cancelled');
            if (success) {
                // Update local cache
                const orderIndex = ordersCache.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    ordersCache[orderIndex].status = 'cancelled';
                    ordersCache[orderIndex].cancelledAt = new Date().toISOString();
                }

                updateStats(ordersCache);
                displayOrders(ordersCache, getCurrentFilter());
                showNotification('تم إلغاء الطلب');
                return;
            }
        }

        // Fallback to localStorage
        updateOrderInLocalStorage(orderId, { status: 'cancelled', cancelledAt: new Date().toISOString() });
        await loadOrders();
        showNotification('تم إلغاء الطلب');

    } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification('حدث خطأ أثناء إلغاء الطلب', 'error');
    }
}

// Update order in localStorage (fallback)
function updateOrderInLocalStorage(orderId, updates) {
    try {
        const orders = JSON.parse(localStorage.getItem('tiqtaqo_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex] = { ...orders[orderIndex], ...updates };
            localStorage.setItem('tiqtaqo_orders', JSON.stringify(orders));
        }
    } catch (error) {
        console.error('Error updating order in localStorage:', error);
    }
}

// Delete order
async function deleteOrder(orderId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }

    try {
        const OrderAPI = window.OrderAPI;
        
        // Try Firebase first
        if (OrderAPI && typeof OrderAPI.deleteOrder === 'function') {
            const success = await OrderAPI.deleteOrder(orderId);
            if (success) {
                // Update local cache
                ordersCache = ordersCache.filter(o => o.id !== orderId);

                updateStats(ordersCache);
                displayOrders(ordersCache, getCurrentFilter());
                showNotification('تم حذف الطلب بنجاح');
                return;
            }
        }

        // Fallback to localStorage
        deleteOrderFromLocalStorage(orderId);
        await loadOrders();
        showNotification('تم حذف الطلب بنجاح');

    } catch (error) {
        console.error('Error deleting order:', error);
        showNotification('حدث خطأ أثناء حذف الطلب', 'error');
    }
}

// Delete order from localStorage (fallback)
function deleteOrderFromLocalStorage(orderId) {
    try {
        const orders = JSON.parse(localStorage.getItem('tiqtaqo_orders') || '[]');
        const filteredOrders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('tiqtaqo_orders', JSON.stringify(filteredOrders));
    } catch (error) {
        console.error('Error deleting order from localStorage:', error);
    }
}

// Get current active filter
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

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export orders to CSV
async function exportOrdersToCSV() {
    const orders = await getOrders();

    if (orders.length === 0) {
        alert('لا توجد طلبات للتصدير');
        return;
    }

    let csv = 'رقم الطلب,الاسم,الهاتف,المدينة,العنوان,المنتج,السعر,الحالة,التاريخ,الملاحظات\n';

    orders.forEach(order => {
        const customerName = order.customerName || order.name || '';
        const customerPhone = order.customerPhone || order.phone || '';
        const city = order.city || order.customerCity || '';
        const address = (order.address || order.customerAddress || '').replace(/"/g, '""');
        const productName = order.productName || order.product_name || '';
        const productPrice = order.productPrice || order.price || 0;
        const status = order.status || '';
        const createdAt = order.createdAt || '';
        const notes = (order.notes || order.customerNotes || '').replace(/"/g, '""');

        csv += `${order.id},${customerName},${customerPhone},${city},"${address}","${productName}",${productPrice},${status},${createdAt},"${notes}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Refresh orders (can be called from parent window)
window.refreshOrders = async function() {
    ordersCacheValid = false; // Force refresh from Firebase
    await loadOrders();
};

// Sync local orders to Firebase (one-time migration)
window.syncOrdersToFirebase = async function() {
    try {
        const OrderAPI = window.OrderAPI;
        
        const orders = JSON.parse(localStorage.getItem('tiqtaqo_orders') || '[]');
        if (orders.length === 0) {
            showNotification('لا توجد طلبات للمزامنة', 'warning');
            return;
        }

        showNotification('جاري مزامنة الطلبات...', 'info');

        let synced = 0;
        for (const order of orders) {
            if (OrderAPI && typeof OrderAPI.createOrder === 'function') {
                // Check if order already exists in Firebase
                const existingOrder = ordersCache.find(o => o.id === order.id);
                if (!existingOrder) {
                    const orderId = await OrderAPI.createOrder(order);
                    if (orderId) synced++;
                } else {
                    synced++; // Already synced
                }
            }
        }

        ordersCacheValid = false;
        await loadOrders();
        showNotification(`تم مزامنة ${synced} طلب بنجاح`);

    } catch (error) {
        console.error('Error syncing orders:', error);
        showNotification('حدث خطأ أثناء المزامنة', 'error');
    }
};
