#!/usr/bin/env python3
import os
import re

# Files to fix
files = [
    'packs-homme.html',
    'glasses-homme.html', 
    'glasses-femme.html',
    'wallets-homme.html',
    'wallets-femme.html',
    'accessoires-homme.html',
    'accessoires-femme.html'
]

old_pattern = r'''    <script src="js/main\.js"></script>
    <script>
        // Load products filtered by category and gender
        document\.addEventListener\('DOMContentLoaded', async function\(\) \{
            await loadCategoryProducts\('([^']+)', '([^']+)'\);
        \});</script>'''

new_script = '''    <!-- Load Firebase first as module -->
    <script type="module">
        // Initialize Firebase
        import('./js/firebase-config.js');
    </script>
    <script src="js/main.js"></script>
    <script type="module">
        // Make sure Firebase is ready before loading products
        import('./js/firebase-config.js').then(() => {
            setTimeout(async () => {
                await loadCategoryProducts('\\1', '\\2');
            }, 500);
        });

        async function loadCategoryProducts(category, gender) {'''

for filename in files:
    filepath = os.path.join('/workspace/tiqtaqo-fullstack/frontend', filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find and replace
        matches = re.findall(old_pattern, content)
        if matches:
            category, gender = matches[0]
            new_content = re.sub(old_pattern, new_script, content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"Fixed {filename}")
        else:
            print(f"Pattern not found in {filename}")
    else:
        print(f"File not found: {filepath}")

print("\nDone!")
