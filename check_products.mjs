import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:8888/wallets.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        const result = await page.evaluate(async () => {
            if (window.ProductAPI && typeof ProductAPI.getProducts === 'function') {
                const allProducts = await ProductAPI.getProducts({ forceRefresh: true });
                
                const byCategory = {};
                allProducts.products.forEach(p => {
                    const cat = p.category || 'NO CATEGORY';
                    if (!byCategory[cat]) byCategory[cat] = [];
                    byCategory[cat].push({ id: p.id, name: p.name, price: p.price });
                });
                
                return {
                    total: allProducts.products.length,
                    byCategory: byCategory
                };
            }
            return null;
        });
        
        if (result) {
            console.log('\n=== PRODUCTS IN FIREBASE DATABASE ===\n');
            console.log(`Total products: ${result.total}\n`);
            
            for (const [category, products] of Object.entries(result.byCategory)) {
                console.log(`📁 CATEGORY: ${category} (${products.length} products)`);
                products.forEach(p => {
                    console.log(`   - ${p.name} (${p.price} DH)`);
                });
                console.log('');
            }
        }
        
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await browser.close();
    }
})();
