/**
 * Tiqtaqo - Dual Color Variant Support
 * Support for products with two-tone colors
 * NOTE: This file only contains utilities. The main selectProductColor function
 * is defined in product.html to avoid conflicts.
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
        console.log('getDualColorStyle called with:', { hex1, hex2, isSelected });
        
        // Validate colors - use fallback if missing
        const validHex1 = hex1 && hex1.trim() !== '' && hex1 !== 'undefined' ? hex1 : '#ff0000';
        const validHex2 = hex2 && hex2.trim() !== '' && hex2 !== 'undefined' ? hex2 : '#0000ff';
        
        const gradient = `conic-gradient(${validHex1} 0deg 180deg, ${validHex2} 180deg 360deg)`;
        console.log('Generated gradient:', gradient);
        
        const borderColor = isSelected ? 'var(--gold)' : '#ddd';
        const boxShadow = isSelected ? '0 0 0 3px rgba(212, 175, 55, 0.3)' : 'none';
        
        return `background: ${gradient}; border-color: ${borderColor}; box-shadow: ${boxShadow};`;
    },

    // Check if a color object is dual-color
    isDualColor(color) {
        if (!color) return false;
        // Check if hex2 exists and is not empty
        const hasHex2 = color.hex2 && color.hex2.trim() !== '' && color.hex2 !== 'null' && color.hex2 !== 'undefined';
        // Also check if hex1 exists for dual colors
        const hasHex1 = color.hex1 && color.hex1.trim() !== '' && color.hex1 !== 'null' && color.hex1 !== 'undefined';
        return hasHex2 && hasHex1;
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
    
    console.log('renderColorOptions called with colors:', colors);
    console.log('First color object keys:', Object.keys(colors[0] || {}));

    return `
        <div class="product-colors-section">
            <h4 style="margin-bottom: 12px; font-size: 14px; color: #666;">
                <i class="fas fa-palette"></i> Couleurs disponibles:
            </h4>
            <div class="color-options" id="colorOptions">
                ${colors.map((color, index) => {
                    const isSelected = selectedColorName === color.name;
                    
                    // Log ALL properties of the color object
                    console.log(`Color ${index} raw data:`, JSON.parse(JSON.stringify(color)));
                    console.log(`Color ${index} all values:`, {
                        name: color.name,
                        hex: color.hex,
                        hex1: color.hex1,
                        hex2: color.hex2,
                        color1: color.color1,
                        color2: color.color2,
                        image: color.image
                    });
                    
                    // Try different possible field names for dual colors
                    const hex1 = color.hex1 || color.color1 || null;
                    const hex2 = color.hex2 || color.color2 || null;
                    const isDual = hex1 && hex2 && 
                                   hex1.trim() !== '' && 
                                   hex2.trim() !== '' &&
                                   hex1 !== 'null' && hex1 !== 'undefined' &&
                                   hex2 !== 'null' && hex2 !== 'undefined';
                    
                    console.log(`Color ${index} isDual:`, isDual, { hex1, hex2 });
                    
                    if (isDual) {
                        // Dual-color circle (diagonal split)
                        // Use the detected hex1 and hex2 values
                        const finalHex1 = hex1 || '#ff0000';
                        const finalHex2 = hex2 || '#0000ff';
                        
                        console.log(`Rendering dual color ${index}:`, { finalHex1, finalHex2 });
                        
                        return `
                            <button type="button" 
                                    class="color-option ${isSelected ? 'selected' : ''}" 
                                    data-color="${color.name}" 
                                    data-hex="${finalHex1}"
                                    data-hex2="${finalHex2}"
                                    data-image="${color.image || ''}"
                                    onclick="selectProductColor(this, '${color.name}', '${finalHex1}', '${finalHex2}', '${color.image || ''}')"
                                    style="background: conic-gradient(${finalHex1} 0deg 180deg, ${finalHex2} 180deg 360deg); border-color: ${isSelected ? 'var(--gold)' : '#ddd'}; ${isSelected ? 'box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.3);' : ''}"
                                    title="${color.name || finalHex1 + ' / ' + finalHex2}">
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

// Export utilities only - do NOT define selectProductColor here
// The main function is defined in product.html module script
window.DualColorUtils = DualColorUtils;
window.renderColorOptions = renderColorOptions;
