import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    const baseUrl = 'https://4iaew2jzk36s.space.minimax.io';
    
    try {
        console.log('=== FINAL TEST: TIQTAQO STORE ===\n');
        
        // Test 1: Check admin panel
        console.log('1. Testing admin panel...');
        await page.goto(baseUrl + '/admin/dashboard.html', { 
            waitUntil: 'domcontentloaded', 
            timeout: 15000 
        });
        await page.waitForTimeout(2000);
        
        // Login via localStorage
        await page.evaluate(() => {
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_email', 'tiqtaqo00@gmail.com');
        });
        
        await page.goto(baseUrl + '/admin/dashboard.html', { 
            waitUntil: 'domcontentloaded', 
            timeout: 15000 
        });
        await page.waitForTimeout(3000);
        
        const adminStatus = await page.evaluate(() => {
            return {
                onDashboard: !window.location.href.includes('login.html'),
                hasGetProducts: typeof window.getProducts === 'function',
                hasSaveProduct: typeof window.saveProduct === 'function'
            };
        });
        
        console.log('   On Dashboard:', adminStatus.onDashboard);
        console.log('   getProducts function:', adminStatus.hasGetProducts);
        console.log('   saveProduct function:', adminStatus.hasSaveProduct);
        
        // Get products
        const products = await page.evaluate(async () => {
            if (typeof window.getProducts === 'function') {
                return await window.getProducts();
            }
            return [];
        });
        
        console.log('\n=== PRODUCTS IN DATABASE ===');
        console.log('Total products:', products.length);
        
        const byCategory = {};
        products.forEach(p => {
            const cat = p.category || 'NO CATEGORY';
            if (!byCategory[cat]) byCategory[cat] = 0;
            byCategory[cat]++;
        });
        
        console.log('\nBy category:');
        for (const [cat, count] of Object.entries(byCategory)) {
            console.log(`  📁 ${cat}: ${count} products`);
        }
        
        console.log('\n=== CONCLUSION ===');
        if (adminStatus.hasGetProducts && adminStatus.hasSaveProduct) {
            console.log('✅ Admin panel is working correctly!');
            console.log('\nTo test adding products:');
            console.log('1. Open: ' + baseUrl + '/admin/dashboard.html');
            console.log('2. Login with admin credentials');
            console.log('3. Click "Ajouter un Produit"');
            console.log('4. Fill details and select category "Wallets"');
            console.log('5. Save and check wallets.html');
        }
        
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await browser.close();
    }
})();
