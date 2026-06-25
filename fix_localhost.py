import os
import re

def walk(dir_path):
    results = []
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                results.append(os.path.join(root, file))
    return results

files = walk('src')
count = 0

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'http://localhost:5000' not in content:
        continue

    # Skip files that already use import.meta.env.PROD for localhost:5000
    if "? '' : 'http://localhost:5000'" in content or "? \"\" : \"http://localhost:5000\"" in content:
        continue
        
    original = content

    # Handle template literals: `http://localhost:5000/api/...`
    content = re.sub(r'`http://localhost:5000/?', r'`${import.meta.env.PROD ? "" : "http://localhost:5000"}/', content)
    
    # Handle single quotes: 'http://localhost:5000'
    content = re.sub(r"'http://localhost:5000/?", r"(import.meta.env.PROD ? '' : 'http://localhost:5000') + '/", content)
    
    # Handle double quotes: "http://localhost:5000"
    content = re.sub(r'"http://localhost:5000/?', r'(import.meta.env.PROD ? "" : "http://localhost:5000") + "/', content)

    # Some might now end up with + '/"' or + "/'", let's fix the trailing quotes issue if there's no path
    content = content.replace(" + '/'", "")
    content = content.replace(' + "/"', '')
    
    if content != original:
        # Avoid breaking api.ts logic
        if file.endswith('api.ts') or file.endswith('apiClient.ts'):
            # Just do manual replacement for those
            pass
        else:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            count += 1

print(f"Modified {count} files.")
