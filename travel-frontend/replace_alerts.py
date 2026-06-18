import os
import re

count = 0
for root, dirs, files in os.walk('/Users/doxuanquang/Documents/BioWraps/Hotel/travel-frontend/'):
    if 'node_modules' in root: continue
    for file in files:
        if file.endswith('.js'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            
            # Skip CustomAlert files
            if 'CustomAlert' in file: continue
            
            # replace alert(...) with window.CustomAlert.alert(...)
            new_content = re.sub(r'\balert\s*\(', 'window.CustomAlert.alert(', content)
            
            if new_content != content:
                with open(path, 'w') as f:
                    f.write(new_content)
                count += 1
                print(f"Updated alerts in {file}")

print(f"Done. Updated {count} files.")
