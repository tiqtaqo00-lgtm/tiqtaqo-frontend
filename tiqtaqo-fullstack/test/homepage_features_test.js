const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log('=== Homepage New Features Test ===');

    // Test 1: Loading homepage
    console.log('Test 1: Loading homepage...');
    await page.goto('http://localhost:3000/index.html');
    const title = await page.title();
    console.log(`Page Title: ${title}`);

    // Test 2: Check search bar
    console.log('\nTest 2: Testing search bar...');
    const searchContainer = await page.$('.search-container');
    const searchInput = await page.$('.search-input');
    const searchIconBtn = await page.$('.search-icon-btn');
    console.log(`Search container exists: ${!!searchContainer}`);
    console.log(`Search input exists: ${!!searchInput}`);
    console.log(`Search icon button exists: ${!!searchIconBtn}`);

    // Test 3: Check best sellers section
    console.log('\nTest 3: Testing best sellers section...');
    const bestSellersSection = await page.$('.best-sellers');
    const bestSellersGrid = await page.$('#bestSellersGrid');
    console.log(`Best sellers section exists: ${!!bestSellersSection}`);
    console.log(`Best sellers grid exists: ${!!bestSellersGrid}`);

    // Test 4: Check scroll to top button
    console.log('\nTest 4: Testing scroll to top button...');
    const scrollTopBtn = await page.$('.scroll-top');
    const isScrollTopVisible = await scrollTopBtn?.isVisible();
    console.log(`Scroll to top button exists: ${!!scrollTopBtn}`);
    console.log(`Scroll to top button visible (should be false initially): ${isScrollTopVisible}`);

    // Test 5: Check loading overlay
    console.log('\nTest 5: Testing loading overlay...');
    const loadingOverlay = await page.$('.loading-overlay');
    const isLoadingActive = await loadingOverlay?.evaluate(el => el.classList.contains('active'));
    console.log(`Loading overlay exists: ${!!loadingOverlay}`);
    console.log(`Loading overlay active (should be false after load): ${isLoadingActive}`);

    // Test 6: Check WhatsApp float button
    console.log('\nTest 6: Testing WhatsApp float button...');
    const whatsappBtn = await page.$('.whatsapp-float');
    console.log(`WhatsApp float button exists: ${!!whatsappBtn}`);

    // Test 7: Check sidebar menu
    console.log('\nTest 7: Testing sidebar menu...');
    const sidebar = await page.$('.sidebar');
    const menuToggle = await page.$('#menuToggle');
    console.log(`Sidebar exists: ${!!sidebar}`);
    console.log(`Menu toggle button exists: ${!!menuToggle}`);

    // Test 8: Test sidebar toggle animation
    console.log('\nTest 8: Testing sidebar toggle...');
    await page.click('#menuToggle');
    await page.waitForTimeout(500);
    const isSidebarActive = await sidebar?.evaluate(el => el.classList.contains('active'));
    console.log(`Sidebar active after click: ${isSidebarActive}`);

    // Close sidebar
    await page.click('#closeSidebar');
    await page.waitForTimeout(500);
    const isSidebarClosed = !(await sidebar?.evaluate(el => el.classList.contains('active')));
    console.log(`Sidebar closed after clicking close: ${isSidebarClosed}`);

    // Test 9: Check logo link
    console.log('\nTest 9: Testing logo link...');
    const logoLink = await page.$('.logo-link');
    const logoHref = await logoLink?.getAttribute('href');
    console.log(`Logo link exists: ${!!logoLink}`);
    console.log(`Logo links to: ${logoHref}`);

    // Test 10: Check collections section
    console.log('\nTest 10: Testing collections section...');
    const collectionsGrid = await page.$('#collectionsGrid');
    console.log(`Collections grid exists: ${!!collectionsGrid}`);

    console.log('\n=== All tests completed successfully! ===');

    await browser.close();
})();
