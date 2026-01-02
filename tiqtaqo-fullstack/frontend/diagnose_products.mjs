import puppeteer from 'puppeteer';

async function diagnoseProducts() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Capture console messages
    page.on('console', msg => {
        console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
        console.log(`[PAGE ERROR] ${error.message}`);
    });

    try {
        console.log('Navigating to packs-femme.html...');
        await page.goto('http://localhost:8888/packs-femme.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for page to initialize
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check if products loaded
        const result = await page.evaluate(() => {
            const productsGrid = document.getElementById('productsGrid');
            return {
                productsGridExists: !!productsGrid,
                productsGridHTML: productsGrid ? productsGrid.innerHTML.substring(0, 500) : '',
                hasNoProducts: productsGrid ? productsGrid.innerHTML.includes('Aucun produit') : false,
                hasLoading: productsGrid ? productsGrid.innerHTML.includes('Chargement') : false
            };
        });

        console.log('\n=== DIAGNOSIS RESULTS ===');
        console.log('Products Grid Exists:', result.productsGridExists);
        console.log('Has Loading State:', result.hasLoading);
        console.log('Shows No Products:', result.hasNoProducts);
        console.log('Grid HTML:', result.productsGridHTML);

        // Check if Firebase has products directly
        const firebaseCheck = await page.evaluate(() => {
            if (typeof window.getProductsFromFirebase === 'function') {
                return window.getProductsFromFirebase();
            }
            return null;
        });

        if (firebaseCheck) {
            console.log('\n=== FIREBASE DIRECT CHECK ===');
            console.log('Products:', firebaseCheck.products?.length || 0);
            console.log('Sample products:', JSON.stringify(firebaseCheck.products?.slice(0, 3), null, 2));
        }

    } catch (error) {
        console.error('Error during diagnosis:', error);
    } finally {
        await browser.close();
    }
}

diagnoseProducts();
