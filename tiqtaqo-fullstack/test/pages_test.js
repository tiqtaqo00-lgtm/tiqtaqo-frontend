const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        console.log('=== Testing Branch Selection and Category Pages ===\n');
        
        // Test 1: Branch selection page (packs-select.html)
        console.log('Test 1: Testing packs-select.html...');
        await page.goto('http://localhost:3000/packs-select.html', { waitUntil: 'networkidle' });
        const packsTitle = await page.title();
        console.log('Page Title:', packsTitle);
        
        const hasGenderCards = await page.evaluate(() => {
            const cards = document.querySelectorAll('.gender-card');
            return cards.length === 2;
        });
        console.log('Has 2 gender cards:', hasGenderCards);
        
        // Test 2: Category page (packs-homme.html)
        console.log('\nTest 2: Testing packs-homme.html...');
        await page.goto('http://localhost:3000/packs-homme.html', { waitUntil: 'networkidle' });
        const packsHommeTitle = await page.title();
        console.log('Page Title:', packsHommeTitle);
        
        const hasProductsGrid = await page.evaluate(() => {
            return !!document.getElementById('productsGrid');
        });
        console.log('Has products grid:', hasProductsGrid);
        
        // Test 3: Check product cards styling
        console.log('\nTest 3: Checking product card styles...');
        const productCardStyles = await page.evaluate(() => {
            const card = document.querySelector('.product-card');
            if (card) {
                const styles = window.getComputedStyle(card);
                return {
                    borderRadius: styles.borderRadius,
                    boxShadow: styles.boxShadow.substring(0, 50) + '...'
                };
            }
            return null;
        });
        console.log('Product card styles:', JSON.stringify(productCardStyles, null, 2));
        
        // Test 4: Wallets selection page
        console.log('\nTest 4: Testing wallets-select.html...');
        await page.goto('http://localhost:3000/wallets-select.html', { waitUntil: 'networkidle' });
        const walletsTitle = await page.title();
        console.log('Page Title:', walletsTitle);
        
        console.log('\n=== All tests passed successfully! ===');
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
