/**
 * Tiqtaqo - Dual Color Variant Support
 * Support for products with two-tone colors
 */

// Dual Color Circle CSS Generator
const DualColorUtils = {
    // Generate CSS for dual-color circle with diagonal split
    generateDualColorCSS(hex1, hex2, isSelected = false) {
        // Use conic-gradient for diagonal split effect
        const gradient = `conic-gradient(${hex1} 0deg 180deg, ${hex2} 180deg 360deg)`;
        return {
            background: gradient,
            borderColor: isSelected ? 'var(--gold)' : '#ddd',
            boxShadow: isSelected ? '0 0 0 3px rgba(212, 175, 55, 0.3)' : 'none'
        };
    },

    // Generate inline style for dual-color circle
    getDualColorStyle(hex1, hex2, isSelected = false) {
        const gradient = `conic-gradient(${hex1} 0deg 180deg, ${hex2} 180deg 360deg)`;
        const borderColor = isSelected ? 'var(--gold)' : '#ddd';
        const boxShadow = isSelected ? '0 0 0 3px rgba(212, 175, 55, 0.3)' : 'none';
        
        return `background: ${gradient}; border-color: ${borderColor}; box-shadow: ${boxShadow};`;
    },

    // Check if a color object is dual-color
    isDualColor(color) {
        return color && color.hex2 && color.hex2 !== '';
    },

    // Get display name for dual color
    getDisplayName(color) {
        if (this.isDualColor(color)) {
            return color.name || `${color.hex1} / ${color.hex2}`;
        }
        return color.name || color.hex || '';
    }
};

// Extend color selection in product page
function renderColorOptions(colors, selectedColorName) {
    if (!colors || colors.length === 0) return '';

    return `
        <div class="product-colors-section">
            <h4 style="margin-bottom: 12px; font-size: 14px; color: #666;">
                <i class="fas fa-palette"></i> Couleurs disponibles:
            </h4>
            <div class="color-options" id="colorOptions">
                ${colors.map((color, index) => {
                    const isSelected = selectedColorName === color.name;
                    const isDual = DualColorUtils.isDualColor(color);
                    
                    if (isDual) {
                        // Dual-color circle (diagonal split)
                        return `
                            <button type="button" 
                                    class="color-option ${isSelected ? 'selected' : ''}" 
                                    data-color="${color.name}" 
                                    data-hex="${color.hex1}"
                                    data-hex2="${color.hex2}"
                                    data-image="${color.image || ''}"
                                    onclick="selectProductColor(this, '${color.name}', '${color.hex1}', '${color.hex2}', '${color.image || ''}')"
                                    style="${DualColorUtils.getDualColorStyle(color.hex1, color.hex2, isSelected)}"
                                    title="${DualColorUtils.getDisplayName(color)}">
                                ${isSelected ? '<span style="position: absolute; bottom: -2px; right: -2px; background: var(--gold); color: var(--black); font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">✓</span>' : ''}
                            </button>
                        `;
                    } else {
                        // Single-color circle (existing logic)
                        return `
                            <button type="button" 
                                    class="color-option ${isSelected ? 'selected' : ''}" 
                                    data-color="${color.name}" 
                                    data-hex="${color.hex}"
                                    data-image="${color.image || ''}"
                                    onclick="selectProductColor(this, '${color.name}', '${color.hex}', null, '${color.image || ''}')"
                                    style="background: ${color.hex};
                                            border-color: ${isSelected ? 'var(--gold)' : '#ddd'};
                                            ${color.image ? `background-image: url('${color.image}'); background-size: cover; background-position: center;` : ''}"
                                    title="${color.name}">
                                ${isSelected ? '<span style="position: absolute; bottom: -2px; right: -2px; background: var(--gold); color: var(--black); font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">✓</span>' : ''}
                            </button>
                        `;
                    }
                }).join('')}
            </div>
            ${colors[0] ? `<span id="selectedColorDisplay" style="display: block; margin-top: 10px; font-size: 14px; color: #333;">
                <i class="fas fa-check-circle" style="color: var(--gold);"></i> ${DualColorUtils.getDisplayName(colors[0])}
            </span>` : ''}
        </div>
    `;
}

// Enhanced color selection function
// IMPORTANT: This function must have 5 parameters to match onclick handlers in renderColorOptions
async function selectProductColor(btn, colorName, hex1, hex2 = null, colorImage = '') {
    const isDual = hex2 && hex2 !== '' && hex2 !== null && hex2 !== 'null';
    
    console.log('selectProductColor called:', { colorName, hex1, hex2, colorImage });
    
    document.querySelectorAll('.color-option').forEach(b => {
        b.classList.remove('selected');
        b.style.borderColor = '#ddd';
        b.style.boxShadow = 'none';
        b.innerHTML = '';
        
        // Reset dual color style if needed
        const storedHex2 = b.dataset.hex2;
        if (storedHex2 && storedHex2 !== '' && storedHex2 !== null && storedHex2 !== 'null') {
            b.style.background = `conic-gradient(${b.dataset.hex} 0deg 180deg, ${storedHex2} 180deg 360deg)`;
        } else if (b.dataset.hex) {
            b.style.background = b.dataset.hex;
        }
    });
    
    btn.classList.add('selected');
    
    if (isDual) {
        // Dual-color styling
        btn.style.borderColor = 'var(--gold)';
        btn.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.3)';
        btn.innerHTML = '<span style="position: absolute; bottom: -2px; right: -2px; background: var(--gold); color: var(--black); font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">✓</span>';
    } else {
        // Single-color styling
        btn.style.borderColor = hex1 || 'var(--gold)';
        btn.innerHTML = '<span style="position: absolute; bottom: -2px; right: -2px; background: var(--gold); color: var(--black); font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">✓</span>';
    }

    const colorDisplay = document.getElementById('selectedColorDisplay');
    if (colorDisplay) {
        colorDisplay.innerHTML = `<i class="fas fa-check-circle" style="color: var(--gold);"></i> ${colorName}`;
    }

    // Update product image if valid color image is provided
    console.log('Checking colorImage for update:', colorImage);
    
    if (colorImage && colorImage.trim() !== '' && colorImage !== 'null' && colorImage !== 'undefined') {
        console.log('Changing product image to:', colorImage);
        
        // Try to find mainImage element directly
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.src = colorImage;
            mainImage.style.transform = 'scale(1.05)';
            setTimeout(() => {
                mainImage.style.transform = 'scale(1)';
            }, 200);
            console.log('Product image updated successfully via direct DOM manipulation');
        } else {
            console.warn('mainImage element not found in DOM');
        }
        
        // Also try to call changeImage if available
        if (typeof window.changeImage === 'function') {
            window.changeImage(colorImage, null);
            console.log('changeImage function called');
        } else {
            console.warn('window.changeImage function not available');
        }
    } else {
        console.log('No valid color image to change. colorImage:', colorImage);
    }

    window.selectedProductColor = colorName;
    window.selectedProductColorHex = hex1;
    window.selectedProductColorHex2 = hex2;
    window.selectedProductColorImage = colorImage;
}

// Export for global use
window.DualColorUtils = DualColorUtils;
window.renderColorOptions = renderColorOptions;
window.selectProductColor = selectProductColor;
