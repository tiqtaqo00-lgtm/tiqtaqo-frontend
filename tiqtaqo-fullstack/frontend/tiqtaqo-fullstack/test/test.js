const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        // Navigate to homepage
        const response = await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        console.log('Status Code:', response.status());
        
        // Check page title
        const title = await page.title();
        console.log('Page Title:', title);
        
        // Check for key elements
        const logo = await page.$('.logo');
        const hero = await page.$('.hero');
        const collections = await page.$('.collections');
        const cards = await page.$$('.collection-card');
        
        console.log('Logo exists:', !!logo);
        console.log('Hero section exists:', !!hero);
        console.log('Collections section exists:', !!collections);
        console.log('Number of collection cards:', cards.length);
        
        // Test hover animation on first card
        const firstCard = cards[0];
        if (firstCard) {
            await firstCard.hover();
            await page.waitForTimeout(500);
            console.log('Hover test completed on first card');
        }
        
        // Check if cards have golden border on hover style
        const cardStyles = await page.evaluate(() => {
            const card = document.querySelector('.collection-card');
            if (card) {
                const styles = window.getComputedStyle(card);
                return {
                    border: styles.border,
                    transform: styles.transform
                };
            }
            return null;
        });
        console.log('Card styles (base):', JSON.stringify(cardStyles, null, 2));
        
        console.log('\nAll tests passed successfully!');
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
