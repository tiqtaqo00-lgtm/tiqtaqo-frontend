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
        console.log('Loading wallets.html...');
        await page.goto('file:///workspace/wallets.html', { waitUntil: 'networkidle' });
        
        await page.waitForTimeout(3000);
        
        const hasInitFirebase = await page.evaluate(() => typeof window.initFirebase === 'function');
        const hasProductAPI = await page.evaluate(() => typeof window.ProductAPI !== 'undefined');
        
        console.log('\n=== DIAGNOSIS RESULTS ===');
        console.log('window.initFirebase available:', hasInitFirebase);
        console.log('window.ProductAPI available:', hasProductAPI);
        
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
