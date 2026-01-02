import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        // Login first
        console.log('Logging in...');
        await page.goto('http://localhost:8888/admin/login.html', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_email', 'tiqtaqo00@gmail.com');
        });
        
        // Go to dashboard
        console.log('Going to dashboard...');
        await page.goto('http://localhost:8888/admin/dashboard.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        // Check if we're on dashboard (not redirected)
        const url = page.url();
        console.log('Current URL:', url);
        
        if (url.includes('dashboard.html')) {
            console.log('\n✓ Successfully logged in to admin dashboard');
            
            // Check products
            const products = await page.evaluate(async () => {
                if (typeof window.getProducts === 'function') {
                    return await window.getProducts();
                }
                return [];
            });
            
            console.log('\n=== CURRENT PRODUCTS ===');
            console.log('Total products:', products.length);
            
            // Group by category
            const byCategory = {};
            products.forEach(p => {
                const cat = p.category || 'NO CATEGORY';
                if (!byCategory[cat]) byCategory[cat] = 0;
                byCategory[cat]++;
            });
            
            console.log('\nProducts by category:');
            for (const [cat, count] of Object.entries(byCategory)) {
                console.log(`  ${cat}: ${count} products`);
            }
            
            console.log('\n=== TEST ADD PRODUCT ===');
            console.log('To test saving products to Firebase:');
            console.log('1. Go to admin dashboard');
            console.log('2. Click "Ajouter un Produit"');
            console.log('3. Fill in product details');
            console.log('4. Select category "Wallets"');
            console.log('5. Save the product');
            console.log('6. Check wallets.html to see if product appears');
        } else {
            console.log('✗ Not on dashboard, might have been redirected');
        }
        
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await browser.close();
    }
})();
