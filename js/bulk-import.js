/**
 * Tiqtaqo - Bulk Product Import System
 * Add multiple products quickly using CSV/Excel files
 */

// CSV Import functionality
const BulkImport = {
    // Parse CSV file
    async parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n').filter(line => line.trim() !== '');
                    
                    // Parse header
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
                    
                    // Parse data rows
                    const products = [];
                    for (let i = 1; i < lines.length; i++) {
                        const values = this.parseCSVLine(lines[i]);
                        if (values.length === headers.length) {
                            const product = {};
                            headers.forEach((header, index) => {
                                product[header] = values[index].trim().replace(/['"]/g, '');
                            });
                            
                            // Convert numeric fields
                            if (product.price) product.price = parseFloat(product.price) || 0;
                            if (product.oldPrice) product.oldPrice = parseFloat(product.oldPrice) || 0;
                            if (product.stock) product.stock = parseInt(product.stock) || 0;
                            
                            // Parse colors as array
                            if (product.colors) {
                                product.colors = product.colors.split('|').map(c => ({
                                    name: c.trim(),
                                    image: ''
                                }));
                            }
                            
                            products.push(product);
                        }
                    }
                    
                    resolve({ headers, products });
                } catch (error) {
                    reject(error);
                }
            }.bind(this);
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },
    
    // Parse single CSV line (handles quoted values)
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        
        return result;
    },
    
    // Import products to Firebase or localStorage
    async importProducts(products) {
        const results = {
            success: [],
            failed: [],
            skipped: []
        };
        
        // Check if Firebase is available
        const useFirebase = window.ProductAPI && window.LocalStorageManager.getDataInfo().source !== 'empty';
        
        for (const product of products) {
            // Validation
            if (!product.name || !product.category) {
                results.skipped.push({
                    name: product.name || 'Unknown',
                    reason: 'Missing name or category'
                });
                continue;
            }
            
            // Prepare product data
            const productData = {
                ...product,
                visible: true,
                showInCanOffers: product.canOffer === 'true' || product.canOffer === true,
                bestSeller: product.bestSeller === 'true' || product.bestSeller === true,
                keywords: [
                    product.name?.toLowerCase() || '',
                    product.category || '',
                    ...(product.colors?.map(c => c.name?.toLowerCase()) || []),
                    ...(product.name?.split(' ').map(w => w.toLowerCase()) || [])
                ].filter(w => w.length > 2)
            };
            
            try {
                if (useFirebase && window.ProductAPI) {
                    const id = await window.ProductAPI.addProduct(productData);
                    if (id) {
                        results.success.push({ name: product.name, id });
                    } else {
                        // Fallback to localStorage
                        this.addToLocalStorage(productData);
                        results.success.push({ name: product.name, storage: 'localStorage' });
                    }
                } else {
                    this.addToLocalStorage(productData);
                    results.success.push({ name: product.name, storage: 'localStorage' });
                }
            } catch (error) {
                results.failed.push({
                    name: product.name,
                    error: error.message
                });
            }
        }
        
        return results;
    },
    
    // Add to localStorage
    addToLocalStorage(product) {
        const products = window.LocalStorageManager.loadProducts();
        products.push({
            ...product,
            id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString()
        });
        window.LocalStorageManager.saveProducts(products);
    }
};

// Quick Add Form (Simplified)
const QuickAdd = {
    showForm() {
        const modal = document.createElement('div');
        modal.id = 'quickAddModal';
        modal.innerHTML = `
            <div class="quick-add-overlay" onclick="QuickAdd.closeForm(event)"></div>
            <div class="quick-add-content">
                <div class="quick-add-header">
                    <h3>⚡ إضافة سريعة</h3>
                    <button onclick="QuickAdd.closeForm()">&times;</button>
                </div>
                <form id="quickAddForm" onsubmit="QuickAdd.submit(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>اسم المنتج *</label>
                            <input type="text" name="name" required placeholder="اسم المنتج">
                        </div>
                        <div class="form-group">
                            <label>الفئة *</label>
                            <select name="category" required>
                                <option value="">اختر الفئة</option>
                                <option value="montres">ساعات</option>
                                <option value="packs">باقات</option>
                                <option value="glasses">نظارات</option>
                                <option value="wallets">محافظ</option>
                                <option value="accessoires">إكسسوارات</option>
                                <option value="belts">أحزمة</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>السعر (درهم) *</label>
                            <input type="number" name="price" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>سعر قديم (اختياري)</label>
                            <input type="number" name="oldPrice" min="0" step="0.01">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>الألوان (مفصولة بـ |)</label>
                        <input type="text" name="colors" placeholder="ذهبي | فضي | أسود">
                    </div>
                    <div class="form-group">
                        <label>رابط الصورة</label>
                        <input type="url" name="image" placeholder="https://example.com/image.jpg">
                    </div>
                    <div class="form-group">
                        <label>الوصف</label>
                        <textarea name="description" rows="2"></textarea>
                    </div>
                    <div class="form-row">
                        <label class="checkbox-label">
                            <input type="checkbox" name="canOffer"> عرض في CAN Offers
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="bestSeller"> الأكثر مبيعاً
                        </label>
                    </div>
                    <button type="submit" class="btn-quick-add">إضافة المنتج</button>
                </form>
                <div class="quick-add-divider">
                    <span>أو</span>
                </div>
                <div class="bulk-import-section">
                    <button onclick="document.getElementById('csvInput').click()" class="btn-bulk">
                        📁 استيراد من CSV
                    </button>
                    <input type="file" id="csvInput" accept=".csv" style="display:none" 
                           onchange="BulkImport.handleFile(this.files[0])">
                    <p class="help-text">ملف CSV فقط - سطر واحد للعناوين</p>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #quickAddModal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; }
            .quick-add-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); }
            .quick-add-content { position: relative; background: white; padding: 25px; border-radius: 12px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
            .quick-add-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .quick-add-header h3 { color: var(--gold); margin: 0; }
            .quick-add-header button { background: none; border: none; font-size: 28px; cursor: pointer; color: #666; }
            .form-row { display: flex; gap: 15px; }
            .form-row .form-group { flex: 1; }
            .form-group { margin-bottom: 15px; }
            .form-group label { display: block; margin-bottom: 5px; font-weight: 500; color: #333; }
            .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
            .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
            .btn-quick-add { width: 100%; padding: 12px; background: linear-gradient(135deg, var(--gold), #b8860b); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
            .btn-quick-add:hover { opacity: 0.9; }
            .quick-add-divider { text-align: center; margin: 20px 0; color: #999; }
            .bulk-import-section { text-align: center; }
            .btn-bulk { padding: 12px 25px; background: #333; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
            .help-text { font-size: 12px; color: #999; margin-top: 8px; }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);
    },
    
    closeForm(event) {
        if (!event || event.target.classList.contains('quick-add-overlay') || event.type === 'click') {
            const modal = document.getElementById('quickAddModal');
            if (modal) {
                modal.remove();
                document.querySelector('style:last-child')?.remove();
            }
        }
    },
    
    async submit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const product = {
            name: formData.get('name'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')) || 0,
            oldPrice: parseFloat(formData.get('oldPrice')) || 0,
            image: formData.get('image'),
            description: formData.get('description'),
            colors: formData.get('colors') ? formData.get('colors').split('|').map(c => ({ name: c.trim(), image: '' })) : [],
            canOffer: formData.get('canOffer'),
            bestSeller: formData.get('bestSeller')
        };
        
        const results = await BulkImport.importProducts([product]);
        
        if (results.success.length > 0) {
            alert('✅ تم إضافة المنتج بنجاح!');
            this.closeForm();
            // Refresh page if needed
            if (typeof loadProducts === 'function') loadProducts();
        } else {
            alert('❌ فشل في إضافة المنتج');
        }
    }
};

// CSV File handler
BulkImport.handleFile = async function(file) {
    if (!file) return;
    
    const status = await FirebaseHealthCheck.checkStatus();
    
    if (status.status !== 'connected' && !confirm('⚠️ Firebase غير متصل. هل تريد الحفظ في localStorage فقط؟')) {
        return;
    }
    
    try {
        const { headers, products } = await this.parseCSV(file);
        
        if (products.length === 0) {
            alert('❌ لم يتم العثور على منتجات في الملف');
            return;
        }
        
        const confirmMsg = `سيتم إضافة ${products.length} منتج${products.length > 1 ? 'ات' : ''}. هل تريد المتابعة؟`;
        if (!confirm(confirmMsg)) return;
        
        const results = await this.importProducts(products);
        
        let message = `✅ نجح: ${results.success.length}\n`;
        if (results.skipped.length > 0) message += `⏭️ تخطي: ${results.skipped.length}\n`;
        if (results.failed.length > 0) message += `❌ فشل: ${results.failed.length}`;
        
        alert(message);
        
        // Close modal if open
        QuickAdd.closeForm();
        
        // Refresh products display
        if (typeof loadProducts === 'function') loadProducts();
        
    } catch (error) {
        alert('❌ خطأ في قراءة الملف: ' + error.message);
    }
};

// Add button to admin pages
document.addEventListener('DOMContentLoaded', function() {
    // Add quick add button to navbar or admin area
    const navContainer = document.querySelector('.nav-container') || document.querySelector('.admin-nav');
    if (navContainer && !document.getElementById('quickAddBtn')) {
        const btn = document.createElement('button');
        btn.id = 'quickAddBtn';
        btn.innerHTML = '⚡ إضافة منتج';
        btn.style.cssText = 'padding: 8px 15px; background: linear-gradient(135deg, var(--gold), #b8860b); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;';
        btn.onclick = QuickAdd.showForm;
        navContainer.appendChild(btn);
    }
});

// Export for global use
window.BulkImport = BulkImport;
window.QuickAdd = QuickAdd;
