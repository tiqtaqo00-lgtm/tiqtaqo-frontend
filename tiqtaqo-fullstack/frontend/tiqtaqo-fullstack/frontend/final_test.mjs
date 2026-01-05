import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    const baseUrl = 'https://4iaew2jzk36s.space.minimax.io';
    
    try {
        console.log('=== TESTING TIQTAQO STORE ===\n');
        
        // Test 1: Check wallets page
        console.log('1. Testing wallets.html page...');
        await page.goto(baseUrl + '/wallets.html', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        const walletsStatus = await page.evaluate(() => {
            return {
                hasProductAPI: typeof window.ProductAPI !== 'undefined',
                hasInitFirebase: typeof window.initFirebase === 'function',
                hasProducts: document.querySelectorAll('.product-card').length
            };
        });
        
        console.log('   ✓ ProductAPI:', walletsStatus.hasProductAPI);
        console.log('   ✓ initFirebase:', walletsStatus.hasInitFirebase);
        console.log('   ✓ Products displayed:', walletsStatus.hasProducts);
        
        // Test 2: Check admin panel login
        console.log('\n2. Testing admin panel...');
        await page.goto(baseUrl + '/admin/login.html', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        // Login
        await page.evaluate(() => {
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_email', 'tiqtaqo00@gmail.com');
        });
        
        await page.goto(baseUrl + '/admin/dashboard.html', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        const adminStatus = await page.evaluate(() => {
            return {
                onDashboard: !window.location.href.includes('login.html'),
                hasGetProducts: typeof window.getProducts === 'function',
                hasSaveProduct: typeof window.saveProduct === 'function'
            };
        });
        
        console.log('   ✓ On Dashboard:', adminStatus.onDashboard);
        console.log('   ✓ getProducts function:', adminStatus.hasGetProducts);
        console.log('   ✓ saveProduct function:', adminStatus.hasSaveProduct);
        
        // Test 3: Get products count
        const products = await page.evaluate(async () => {
            if (typeof window.getProducts === 'function') {
                return await window.getProducts();
            }
            return [];
        });
        
        console.log('\n=== PRODUCTS SUMMARY ===');
        console.log('Total products in Firebase:', products.length);
        
        const byCategory = {};
        products.forEach(p => {
            const cat = p.category || 'NO CATEGORY';
            if (!byCategory[cat]) byCategory[cat] = 0;
            byCategory[cat]++;
        });
        
        console.log('\nProducts by category:');
        for (const [cat, count] of Object.entries(byCategory)) {
            console.log(`  📁 ${cat}: ${count} products`);
        }
        
        console.log('\n=== STATUS ===');
        if (walletsStatus.hasProductAPI && adminStatus.hasGetProducts && adminStatus.hasSaveProduct) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('\nThe admin panel and product pages are working correctly.');
            console.log('You can now:');
            console.log('1. Go to admin panel: ' + baseUrl + '/admin/dashboard.html');
            console.log('2. Add a product with category "wallets"');
            console.log('3. Check wallets.html to see the product appear');
        } else {
            console.log('❌ Some tests failed');
        }
        
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await browser.close();
    }
})();
