import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
        errors.push(`PAGE ERROR: ${error.message}`);
    });
    
    try {
        console.log('Loading admin dashboard...');
        await page.goto('http://localhost:8888/admin/dashboard.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        await page.waitForTimeout(5000);
        
        const hasProductAPI = await page.evaluate(() => typeof window.ProductAPI !== 'undefined');
        const hasAdminAPI = await page.evaluate(() => {
            return {
                getProducts: typeof window.getProducts === 'function',
                saveProduct: typeof window.saveProduct === 'function'
            };
        });
        
        console.log('\n=== ADMIN PANEL STATUS ===');
        console.log('ProductAPI available:', hasProductAPI);
        console.log('getProducts function:', hasAdminAPI.getProducts);
        console.log('saveProduct function:', hasAdminAPI.saveProduct);
        
        // Try to get products
        const products = await page.evaluate(async () => {
            if (typeof window.getProducts === 'function') {
                return await window.getProducts();
            }
            return [];
        });
        
        console.log('\nProducts in admin panel:', products.length);
        
        console.log('\n=== CONSOLE MESSAGES ===');
        consoleMessages.forEach(msg => console.log(msg));
        
        if (errors.length > 0) {
            console.log('\n=== PAGE ERRORS ===');
            errors.forEach(err => console.log(err));
        }
        
    } catch (e) {
        console.error('Test error:', e.message);
    } finally {
        await browser.close();
    }
})();
