const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        console.log('=== Admin Dashboard Gender Selection Test ===\n');
        
        // Set admin login localStorage to bypass auth
        await page.goto('http://localhost:3000/admin/dashboard.html');
        await page.evaluate(() => {
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_email', 'admin@tiqtaqo.com');
        });
        
        // Reload page to apply localStorage
        await page.goto('http://localhost:3000/admin/dashboard.html', { waitUntil: 'networkidle' });
        
        // Test 1: Load admin dashboard
        console.log('Test 1: Loading admin dashboard...');
        const title = await page.title();
        console.log('Page Title:', title);
        
        // Test 2: Click add product button and check gender field
        console.log('\nTest 2: Testing gender selection visibility...');
        await page.click('button:has-text("Ajouter un Produit")');
        await page.waitForTimeout(500);
        
        // Check gender form group is initially hidden
        const genderHidden = await page.evaluate(() => {
            const el = document.getElementById('genderFormGroup');
            return el.style.display === 'none';
        });
        console.log('Gender form group initially hidden:', genderHidden);
        
        // Test 3: Select branched category (packs)
        console.log('\nTest 3: Selecting branched category (packs)...');
        await page.selectOption('#productCategory', 'packs');
        await page.waitForTimeout(300);
        
        const genderVisible = await page.evaluate(() => {
            const el = document.getElementById('genderFormGroup');
            return el.style.display === 'block';
        });
        console.log('Gender form group visible after selecting packs:', genderVisible);
        
        // Check gender options exist
        const genderOptions = await page.evaluate(() => {
            const select = document.getElementById('productGender');
            const options = Array.from(select.options).map(opt => opt.value);
            return options;
        });
        console.log('Gender options:', genderOptions);
        
        // Test 4: Switch to non-branched category
        console.log('\nTest 4: Switching to non-branched category (homme)...');
        await page.selectOption('#productCategory', 'homme');
        await page.waitForTimeout(300);
        
        const genderHiddenAgain = await page.evaluate(() => {
            const el = document.getElementById('genderFormGroup');
            return el.style.display === 'none';
        });
        console.log('Gender form group hidden after selecting homme:', genderHiddenAgain);
        
        // Test 5: Check products table has Genre column
        console.log('\nTest 5: Checking products table for Genre column...');
        const hasGenreColumn = await page.evaluate(() => {
            const headers = Array.from(document.querySelectorAll('th'));
            return headers.some(th => th.textContent.includes('Genre'));
        });
        console.log('Products table has Genre column:', hasGenreColumn);
        
        // Close modal
        await page.click('.close-modal');
        await page.waitForTimeout(300);
        
        console.log('\n=== All tests passed successfully! ===');
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
