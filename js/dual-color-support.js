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
        // Use linear-gradient for diagonal split effect (45 degrees)
        const gradient = `linear-gradient(135deg, ${hex1} 50%, ${hex2} 50%)`;
        return {
            background: gradient,
            borderColor: isSelected ? 'var(--gold)' : '#ddd',
            boxShadow: isSelected ? '0 0 0 3px rgba(212, 175, 55, 0.3)' : 'none'
        };
    },

    // Generate inline style for dual-color circle
    getDualColorStyle(hex1, hex2, isSelected = false) {
        // Validate colors - use fallback if missing
        const validHex1 = hex1 && String(hex1).trim() !== '' ? hex1 : '#ff0000';
        const validHex2 = hex2 && String(hex2).trim() !== '' ? hex2 : '#0000ff';
        
        const gradient = `linear-gradient(135deg, ${validHex1} 50%, ${validHex2} 50%)`;
        const borderColor = isSelected ? 'var(--gold)' : '#ddd';
        const boxShadow = isSelected ? '0 0 0 3px rgba(212, 175, 55, 0.3)' : 'none';
        
        return `background: ${gradient}; border-color: ${borderColor}; box-shadow: ${boxShadow};`;
    },

    // Check if a color object is dual-color
    // Support both field naming conventions
    isDualColor(color) {
        if (!color) return false;
        
        // Get colorHex1 and colorHex2 (from Firebase data)
        const hex1 = color.colorHex1 || color.hex1 || color.color1 || null;
        const hex2 = color.colorHex2 || color.hex2 || color.color2 || null;
        
        // Both must exist and not be empty
        const hasHex1 = hex1 && String(hex1).trim() !== '' && String(hex1) !== 'null' && String(hex1) !== 'undefined';
        const hasHex2 = hex2 && String(hex2).trim() !== '' && String(hex2) !== 'null' && String(hex2) !== 'undefined';
        
        return hasHex1 && hasHex2;
    },

    // Get display name for dual color
    getDisplayName(color) {
        if (!color) {
            return '';
        }
        
        const name = getColorField(color, 'Name');
        
        // If no name, return empty string
        if (!name || typeof name !== 'string') {
            return '';
        }
        
        const trimmedName = name.trim();
        
        // If empty after trimming, return empty string
        if (trimmedName === '') {
            return '';
        }
        
        // If name contains hex codes (# followed by 6 hex digits), it's coordinates - don't show
        const hasHexCode = /#[0-9A-Fa-f]{6}/g.test(trimmedName);
        if (hasHexCode) {
            return '';
        }
        
        // If name starts with #, it's a hex value - don't show
        if (trimmedName.startsWith('#')) {
            return '';
        }
        
        // Otherwise, return the name
        return trimmedName;
    }
};

// Helper function to get color value supporting multiple field names
function getColorField(color, fieldName) {
    const possibleNames = [
        `color${fieldName}`,    // colorHex1, colorHex2, colorName, colorImage
        fieldName,              // hex1, hex2, name, image
        fieldName.toLowerCase() // hex1, hex2, name, image
    ];
    
    for (const name of possibleNames) {
        if (color[name] !== undefined && color[name] !== null) {
            return color[name];
        }
    }
    return null;
}

// Extend color selection in product page
function renderColorOptions(colors, selectedColorName) {
    if (!colors || colors.length === 0) return '';
    
    console.log('=== COLOR DEBUG INFO ===');
    console.log('Total colors:', colors.length);
    
    // Log first color with all details visible
    if (colors.length > 0) {
        const firstColor = colors[0];
        console.log('First color JSON:', JSON.stringify(firstColor, null, 2));
        console.log('First color keys:', Object.keys(firstColor));
    }
    
    console.log('========================');

    return `
        <div class="product-colors-section">
            <h4 style="margin-bottom: 12px; font-size: 14px; color: #666;">
                <i class="fas fa-palette"></i> Couleurs disponibles:
            </h4>
            <div class="color-options" id="colorOptions">
                ${colors.map((color, index) => {
                    // Get color values using flexible field name detection
                    const colorName = getColorField(color, 'Name');
                    const hex1 = getColorField(color, 'Hex1');
                    const hex2 = getColorField(color, 'Hex2');
                    const image = getColorField(color, 'Image');
                    
                    const isSelected = selectedColorName === colorName;
                    const isDual = DualColorUtils.isDualColor(color);
                    
                    console.log(`Color ${index}: name="${colorName}", hex1="${hex1}", hex2="${hex2}", isDual=${isDual}`);
                    
                    if (isDual) {
                        // Dual-color circle (diagonal split)
                        const finalHex1 = String(hex1).trim();
                        const finalHex2 = String(hex2).trim();
                        
                        console.log(`Rendering dual color ${index}: ${finalHex1} / ${finalHex2}`);
                        
                        // Don't show hex values in title - only show if name is a real name (not containing hex codes)
                        let displayTitle = '';
                        if (colorName && typeof colorName === 'string' && colorName.trim() !== '') {
                            // Check if name looks like hex codes (contains # and /)
                            const looksLikeHex = colorName.includes('#') || 
                                                (colorName.match(/#[0-9A-Fa-f]{6}/g) || []).length > 0;
                            if (!looksLikeHex) {
                                displayTitle = colorName;
                            }
                        }
                        
                        return `
                            <button type="button" 
                                    class="color-option ${isSelected ? 'selected' : ''}" 
                                    data-color="${colorName || ''}" 
                                    data-hex="${finalHex1}"
                                    data-hex2="${finalHex2}"
                                    data-image="${image || ''}"
                                    onclick="selectProductColor(this, '${colorName || ''}', '${finalHex1}', '${finalHex2}', '${image || ''}')"
                                    style="background: linear-gradient(135deg, ${finalHex1} 50%, ${finalHex2} 50%); border-color: ${isSelected ? 'var(--gold)' : '#ddd'}; ${isSelected ? 'box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.3);' : ''}"
                                    title="${displayTitle}">
                                ${isSelected ? '<span style="position: absolute; bottom: -2px; right: -2px; background: var(--gold); color: var(--black); font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">✓</span>' : ''}
                            </button>
                        `;
                    } else {
                        // Single-color circle
                        const hex = getColorField(color, 'Hex') || hex1 || '#000000';
                        
                        // Don't show hex values in title - only show if name is a real name
                        let displayTitle = '';
                        if (colorName && typeof colorName === 'string' && colorName.trim() !== '') {
                            const looksLikeHex = colorName.includes('#');
                            if (!looksLikeHex) {
                                displayTitle = colorName;
                            }
                        }
                        
                        return `
                            <button type="button" 
                                    class="color-option ${isSelected ? 'selected' : ''}" 
                                    data-color="${colorName || ''}" 
                                    data-hex="${hex}"
                                    data-image="${image || ''}"
                                    onclick="selectProductColor(this, '${colorName || ''}', '${hex}', null, '${image || ''}')"
                                    style="background: ${hex}; border-color: ${isSelected ? 'var(--gold)' : '#ddd'}; ${isSelected ? 'box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.3);' : ''}"
                                    title="${displayTitle}">
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
