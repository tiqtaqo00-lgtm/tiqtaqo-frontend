import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        // First, login to set the session
        console.log('Logging in...');
        await page.goto('http://localhost:8888/admin/login.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        // Set the login session in localStorage
        await page.evaluate(() => {
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_email', 'tiqtaqo00@gmail.com');
        });
        
        // Now go to dashboard
        console.log('Going to dashboard...');
        await page.goto('http://localhost:8888/admin/dashboard.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        // Check window functions
        const state = await page.evaluate(() => {
            return {
                hasCheckAuth: typeof window.checkAuth === 'function',
                hasGetProducts: typeof window.getProducts === 'function',
                hasSaveProduct: typeof window.saveProduct === 'function',
                hasGetDb: typeof window.getDb === 'function',
                hasInitializeDashboard: typeof window.initializeDashboard === 'function',
            };
        });
        
        console.log('\n=== WINDOW FUNCTIONS AFTER LOGIN ===');
        console.log('window.checkAuth:', state.hasCheckAuth);
        console.log('window.getProducts:', state.hasGetProducts);
        console.log('window.saveProduct:', state.hasSaveProduct);
        console.log('window.getDb:', state.hasGetDb);
        console.log('window.initializeDashboard:', state.hasInitializeDashboard);
        
        // Try to get products
        const products = await page.evaluate(async () => {
            if (typeof window.getProducts === 'function') {
                return await window.getProducts();
            }
            return [];
        });
        
        console.log('\nProducts count:', products.length);
        
        // Get console logs
        const consoleContent = await page.evaluate(() => {
            const panel = document.getElementById('diagnostic-content');
            return panel ? panel.innerText : 'No diagnostic panel';
        });
        
        console.log('\n=== DIAGNOSTIC PANEL ===');
        console.log(consoleContent);
        
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await browser.close();
    }
})();
