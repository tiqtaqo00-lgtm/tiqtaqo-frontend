import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:8888/admin/dashboard.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(5000);
        
        // Check what's available
        const state = await page.evaluate(() => {
            return {
                // Check admin.js exports
                hasCheckAuth: typeof window.checkAuth === 'function',
                hasGetProducts: typeof window.getProducts === 'function',
                hasSaveProduct: typeof window.saveProduct === 'function',
                hasGetDb: typeof window.getDb === 'function',
                hasEnsureFirebase: typeof window.ensureFirebaseInitialized === 'function',
                // Check firebase-config.js
                hasInitFirebase: typeof window.initFirebase === 'function',
                hasProductAPI: typeof window.ProductAPI !== 'undefined',
                hasWindowDb: typeof window.getDb === 'function',
            };
        });
        
        console.log('=== WINDOW FUNCTIONS STATUS ===');
        console.log('window.checkAuth:', state.hasCheckAuth);
        console.log('window.getProducts:', state.hasGetProducts);
        console.log('window.saveProduct:', state.hasSaveProduct);
        console.log('window.getDb:', state.hasGetDb);
        console.log('window.ensureFirebaseInitialized:', state.hasEnsureFirebase);
        console.log('window.initFirebase:', state.hasInitFirebase);
        console.log('window.ProductAPI:', state.hasProductAPI);
        
        // Get console logs
        const logs = await page.evaluate(() => {
            // This won't work because console logs aren't stored, but let's try
            return 'Check browser console';
        });
        
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await browser.close();
    }
})();
