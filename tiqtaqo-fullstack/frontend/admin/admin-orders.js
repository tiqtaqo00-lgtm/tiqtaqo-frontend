// Admin Orders Management System

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadAdminInfo();
    loadOrders();
    setupFilters();
    setupEventListeners();
});

// Load admin info from localStorage
function loadAdminInfo() {
    const adminEmail = localStorage.getItem('admin_email') || localStorage.getItem('user_email') || 'admin@tiqtaqo.ma';
    const adminEmailElement = document.getElementById('adminEmail');
    if (adminEmailElement) {
        adminEmailElement.textContent = adminEmail;
    }
}

// Load all orders from localStorage
function loadOrders() {
    const orders = getOrders();
    updateStats(orders);
    displayOrders(orders, 'all');
}

// Get all orders from localStorage
function getOrders() {
    try {
        const orders = localStorage.getItem('tiqtaqo_orders');
        return orders ? JSON.parse(orders) : [];
    } catch (e) {
        console.error('Error loading orders:', e);
        return [];
    }
}

// Update statistics
function updateStats(orders) {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    
    // Count today's orders
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today).length;
    
    // Update DOM
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('todayOrders').textContent = todayOrders;
}

// Display orders in table
function displayOrders(orders, filter = 'all') {
    const tableBody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('ordersTable');
    
    // Filter orders
    let filteredOrders = orders;
    if (filter !== 'all') {
        filteredOrders = orders.filter(o => o.status === filter);
    }
    
    // Sort by date (newest first)
    filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (filteredOrders.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    // Generate table rows
    tableBody.innerHTML = filteredOrders.map(order => {
        const date = new Date(order.createdAt);
        const formattedDate = formatDate(date);
        const formattedTime = formatTime(date);
        
        const statusClass = order.status === 'completed' ? 'completed' : 
                           order.status === 'cancelled' ? 'cancelled' : 'pending';
        
        const statusText = order.status === 'pending' ? 'معلقة' : 
                          order.status === 'completed' ? 'مكتملة' : 'ملغاة';
        
        return `
            <tr data-order-id="${order.id}">
                <td class="order-id">#${order.id.substring(0, 8).toUpperCase()}</td>
                <td class="customer-name">${escapeHtml(order.customerName)}</td>
                <td>${escapeHtml(order.productName)}</td>
                <td>${escapeHtml(order.city)}</td>
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
}

// Setup filter buttons
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            const orders = getOrders();
            displayOrders(orders, filter);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Close details modal
    document.getElementById('closeDetails').addEventListener('click', function() {
        document.getElementById('orderDetailsModal').classList.remove('active');
    });
    
    // Close modal when clicking outside
    document.getElementById('orderDetailsModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
}

// View order details
function viewOrderDetails(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('الطلب غير موجود');
        return;
    }
    
    const date = new Date(order.createdAt);
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(date);
    
    const statusClass = order.status === 'completed' ? 'completed' : 
                       order.status === 'cancelled' ? 'cancelled' : 'pending';
    
    const statusText = order.status === 'pending' ? 'معلقة' : 
                      order.status === 'completed' ? 'مكتملة' : 'ملغاة';
    
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
                <span class="detail-value">${escapeHtml(order.customerName)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الهاتف</span>
                <span class="detail-value">
                    <a href="tel:${order.customerPhone}" style="color: var(--gold);">${order.customerPhone}</a>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">المدينة</span>
                <span class="detail-value">${escapeHtml(order.city)}</span>
            </div>
            ${order.address ? `
            <div class="detail-row">
                <span class="detail-label">العنوان</span>
                <span class="detail-value">${escapeHtml(order.address)}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-shopping-bag"></i> تفاصيل الطلب</h4>
            ${order.cartItems && order.cartItems.length > 0 ? `
                <div style="margin-bottom: 15px;">
                    <span class="detail-label" style="display: block; margin-bottom: 10px;">المنتجات:</span>
                    ${order.cartItems.map(item => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                            <span>${escapeHtml(item.name)} x${item.quantity}${item.color ? ` - ${item.color}` : ''}</span>
                            <span style="color: var(--gold); font-weight: 600;">${Math.round(item.price * item.quantity)} DH</span>
                        </div>
                    `).join('')}
                </div>
                <div class="detail-row" style="border-top: 2px solid var(--gold); padding-top: 10px; margin-top: 10px;">
                    <span class="detail-label" style="font-weight: 600;">المجموع الكلي</span>
                    <span class="detail-value" style="color: var(--gold); font-weight: 700; font-size: 18px;">${order.productPrice} DH</span>
                </div>
            ` : `
                <div class="detail-row">
                    <span class="detail-label">اسم المنتج</span>
                    <span class="detail-value">${escapeHtml(order.productName)}${order.selectedColor ? ` - ${order.selectedColor}` : ''}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">سعر المنتج</span>
                    <span class="detail-value" style="color: var(--gold); font-weight: 700;">${order.productPrice} DH</span>
                </div>
                ${order.selectedColor ? `
                <div class="detail-row">
                    <span class="detail-label">اللون المختار</span>
                    <span class="detail-value">
                        <span style="display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; background: #f0f0f0; border-radius: 20px;">
                            <span style="width: 20px; height: 20px; border-radius: 50%; background: ${order.selectedColorHex || '#000'}; border: 2px solid #ddd;"></span>
                            ${order.selectedColor}
                        </span>
                    </span>
                </div>
                ` : ''}
            `}
        </div>
        
        ${order.notes ? `
        <div class="detail-section">
            <h4><i class="fas fa-comment-alt"></i> ملاحظات</h4>
            <div class="detail-row">
                <span class="detail-value" style="background: var(--light-gray); padding: 15px; border-radius: 8px;">${escapeHtml(order.notes)}</span>
            </div>
        </div>
        ` : ''}
        
        <div class="detail-actions">
            <button class="btn-whatsapp" onclick="contactCustomerWhatsApp('${order.id}')">
                <i class="fab fa-whatsapp"></i>
                مراسلة واتساب
            </button>
            <a href="tel:${order.customerPhone}" class="btn-complete" style="flex: 1; padding: 14px; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, var(--info) 0%, #138496 100%); color: var(--white); text-decoration: none;">
                <i class="fas fa-phone"></i>
                اتصال هاتفي
            </a>
        </div>
    `;
    
    document.getElementById('orderDetailsBody').innerHTML = detailsHTML;
    document.getElementById('orderDetailsModal').classList.add('active');
}

// Contact customer via WhatsApp
function contactCustomerWhatsApp(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('الطلب غير موجود');
        return;
    }
    
    const phone = order.customerPhone.replace(/[^0-9]/g, '');
    const message = `مرحباً ${order.customerName}،\n\nشكراً لطلبكم من TiqtaQo!\n\nطلبكم: ${order.productName}\nالسعر: ${order.productPrice} DH\n\nنحن نراجع طلبكم الآن وسنتواصل معكم قريباً.`;
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Mark order as completed
function markOrderCompleted(orderId) {
    if (!confirm('هل أنت متأكد من إكمال هذا الطلب؟')) {
        return;
    }
    
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
        alert('الطلب غير موجود');
        return;
    }
    
    orders[orderIndex].status = 'completed';
    orders[orderIndex].completedAt = new Date().toISOString();
    
    saveOrders(orders);
    loadOrders();
    
    // Show notification
    showNotification('تم إكمال الطلب بنجاح');
}

// Delete order
function deleteOrder(orderId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }
    
    const orders = getOrders();
    const filteredOrders = orders.filter(o => o.id !== orderId);
    
    saveOrders(filteredOrders);
    loadOrders();
    
    // Show notification
    showNotification('تم حذف الطلب بنجاح');
}

// Save orders to localStorage
function saveOrders(orders) {
    try {
        localStorage.setItem('tiqtaqo_orders', JSON.stringify(orders));
    } catch (e) {
        console.error('Error saving orders:', e);
        alert('حدث خطأ أثناء حفظ الطلب');
    }
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('orderNotification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Format date
function formatDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('ar-SA', options);
}

// Format time
function formatTime(date) {
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('ar-SA', options);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export orders to CSV
function exportOrdersToCSV() {
    const orders = getOrders();
    
    if (orders.length === 0) {
        alert('لا توجد طلبات للتصدير');
        return;
    }
    
    let csv = 'رقم الطلب,الاسم,الهاتف,المدينة,العنوان,المنتج,السعر,الحالة,التاريخ,الملاحظات\n';
    
    orders.forEach(order => {
        csv += `${order.id},${order.customerName},${order.customerPhone},${order.city},"${order.address || ''}","${order.productName}",${order.productPrice},${order.status},${order.createdAt},"${order.notes || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Refresh orders (can be called from parent window)
window.refreshOrders = function() {
    loadOrders();
};
