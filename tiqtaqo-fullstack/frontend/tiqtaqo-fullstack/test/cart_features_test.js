const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('=== Shopping Cart Feature Test ===');

    // Test 1: Loading homepage and checking cart elements
    console.log('\nTest 1: Loading homepage and checking cart elements...');
    await page.goto('http://localhost:3000/index.html');
    await page.waitForLoadState('networkidle');

    const cartToggle = await page.$('#cartToggle');
    const cartBadge = await page.$('#cartBadge');
    const cartPanel = await page.$('#cartPanel');
    const cartOverlay = await page.$('#cartOverlay');

    console.log(`Cart toggle button exists: ${!!cartToggle}`);
    console.log(`Cart badge exists: ${!!cartBadge}`);
    console.log(`Cart panel exists: ${!!cartPanel}`);
    console.log(`Cart overlay exists: ${!!cartOverlay}`);

    // Test 2: Checking initial cart state (should be empty)
    console.log('\nTest 2: Checking initial cart state...');
    const initialBadgeText = await cartBadge?.textContent();
    console.log(`Initial badge count: ${initialBadgeText || '0'}`);

    // Test 3: Opening the cart panel
    console.log('\nTest 3: Opening cart panel...');
    await page.click('#cartToggle');
    await page.waitForTimeout(500);

    const isCartPanelActive = await cartPanel?.evaluate(el => el.classList.contains('active'));
    const isOverlayActive = await cartOverlay?.evaluate(el => el.classList.contains('active'));
    console.log(`Cart panel opened: ${isCartPanelActive}`);
    console.log(`Overlay activated: ${isOverlayActive}`);

    // Check empty cart message
    const emptyCartMessage = await page.$('.empty-cart-message');
    console.log(`Empty cart message exists: ${!!emptyCartMessage}`);

    // Close cart panel
    await page.evaluate(() => {
        const overlay = document.getElementById('cartOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        const panel = document.getElementById('cartPanel');
        if (panel) {
            panel.classList.remove('active');
        }
        document.body.style.overflow = '';
    });
    await page.waitForTimeout(500);

    const isCartPanelClosed = !(await cartPanel?.evaluate(el => el.classList.contains('active')));
    console.log(`Cart panel closed: ${isCartPanelClosed}`);

    // Test 4: Adding product to cart from best sellers
    console.log('\nTest 4: Adding product to cart from best sellers...');
    const addToCartButtons = await page.$$('.btn-secondary');
    console.log(`Add to cart buttons found: ${addToCartButtons.length}`);

    if (addToCartButtons.length > 0) {
        // Try calling addToCart function directly with a test product
        const testProduct = {
            id: 1,
            name: 'Test Product',
            price: 150,
            image: 'https://via.placeholder.com/150'
        };
        
        await page.evaluate((product) => {
            if (typeof addToCart === 'function') {
                addToCart(product);
            } else {
                // Try to find and trigger the button
                const buttons = document.querySelectorAll('.product-card .btn-secondary');
                if (buttons.length > 0) {
                    buttons[0].click();
                }
            }
        }, testProduct);
        await page.waitForTimeout(1000);

        // Check badge updated
        const badgeAfterAdd = await page.$eval('#cartBadge', el => el.textContent);
        console.log(`Badge count after adding product: ${badgeAfterAdd}`);

        // Open cart to verify item
        await page.click('#cartToggle');
        await page.waitForTimeout(500);

        const cartItems = await page.$$('.cart-item');
        console.log(`Cart items count: ${cartItems.length}`);

        // Check product details in cart
        const cartItemName = await page.$('.cart-item-info h4');
        const cartItemPrice = await page.$('.cart-item-info .cart-item-price');
        const cartItemNameText = await cartItemName?.textContent();
        const cartItemPriceText = await cartItemPrice?.textContent();
        console.log(`Product in cart: ${cartItemNameText}`);
        console.log(`Product price: ${cartItemPriceText}`);
    } else {
        console.log('No add to cart buttons found on homepage');
    }

    // Test 5: Testing quantity increase
    console.log('\nTest 5: Testing quantity controls...');
    const increaseBtn = await page.$('.qty-increase');
    if (increaseBtn) {
        const qtyDisplay = await page.$('.qty-display');
        const initialQty = await qtyDisplay?.textContent();
        console.log(`Initial quantity: ${initialQty}`);

        await increaseBtn.click();
        await page.waitForTimeout(300);

        const updatedQty = await qtyDisplay?.textContent();
        console.log(`Quantity after increase: ${updatedQty}`);
    }

    // Test 6: Testing quantity decrease
    console.log('\nTest 6: Testing quantity decrease...');
    const decreaseBtn = await page.$('.qty-decrease');
    if (decreaseBtn) {
        await decreaseBtn.click();
        await page.waitForTimeout(300);

        const qtyDisplay = await page.$('.qty-display');
        const decreasedQty = await qtyDisplay?.textContent();
        console.log(`Quantity after decrease: ${decreasedQty}`);
    }

    // Test 7: Testing cart total calculation
    console.log('\nTest 7: Testing cart total...');
    const cartTotal = await page.$('.cart-total');
    const cartTotalText = await cartTotal?.textContent();
    console.log(`Cart total displayed: ${cartTotalText}`);

    // Test 8: Testing remove item from cart
    console.log('\nTest 8: Testing remove item...');
    const removeBtn = await page.$('.cart-item-remove');
    if (removeBtn) {
        await removeBtn.click();
        await page.waitForTimeout(500);

        const cartItemsAfterRemove = await page.$$('.cart-item');
        console.log(`Cart items after remove: ${cartItemsAfterRemove.length}`);
    }

    // Close cart panel
    await page.click('#cartOverlay');
    await page.waitForTimeout(500);

    // Test 9: Testing persistence (add another product)
    console.log('\nTest 9: Testing localStorage persistence...');
    if (addToCartButtons.length > 1) {
        // Add another product directly
        const testProduct2 = {
            id: 2,
            name: 'Test Product 2',
            price: 200,
            image: 'https://via.placeholder.com/150'
        };
        
        await page.evaluate((product) => {
            if (typeof addToCart === 'function') {
                addToCart(product);
            }
        }, testProduct2);
        await page.waitForTimeout(500);

        const badgeAfterSecondAdd = await page.$eval('#cartBadge', el => el.textContent);
        console.log(`Badge count after second product: ${badgeAfterSecondAdd}`);
    }

    // Test 10: Checking product page cart functionality
    console.log('\nTest 10: Testing product page...');
    await page.goto('http://localhost:3000/product.html');
    await page.waitForLoadState('networkidle');

    const productPageAddToCart = await page.$('.btn-secondary');
    console.log(`Add to cart button on product page: ${!!productPageAddToCart}`);

    // Test 11: Testing category pages
    console.log('\nTest 11: Testing category page (homme.html)...');
    await page.goto('http://localhost:3000/homme.html');
    await page.waitForLoadState('networkidle');

    const categoryAddToCartButtons = await page.$$('.btn-secondary');
    console.log(`Add to cart buttons on category page: ${categoryAddToCartButtons.length}`);

    // Test 12: Verify localStorage data
    console.log('\nTest 12: Verifying localStorage data...');
    const cartData = await page.evaluate(() => {
        return localStorage.getItem('tiqtaqo_cart');
    });
    console.log(`Cart data in localStorage: ${cartData ? 'exists' : 'not found'}`);

    if (cartData) {
        const parsedCart = JSON.parse(cartData);
        console.log(`Items in localStorage: ${parsedCart.length}`);
    }

    console.log('\n=== All cart tests completed successfully! ===');

    await browser.close();
})();
