import os

sweetalert_tag = '<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>'
select2_css = '<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />'
select2_js = '<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>'
choices_css = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css" />'
choices_js = '<script src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js"></script>'

custom_alert_user = '<script src="assets/js/CustomAlert.js"></script>'
custom_alert_admin = '<script src="js/CustomAlert.js"></script>'
custom_alert_staff = '<script type="module">import { CustomAlert } from "./services/CustomAlert.js"; window.CustomAlert = CustomAlert;</script>'

def patch_file(filepath, site_type):
    with open(filepath, 'r') as f:
        content = f.read()

    if sweetalert_tag in content:
        return

    # Add dependencies before closing body tag
    head_tags = ''
    body_tags = ''
    
    if site_type == 'user':
        body_tags = f"{sweetalert_tag}\n  {select2_js}\n  {custom_alert_user}\n"
        head_tags = f"{select2_css}\n"
    elif site_type == 'admin':
        body_tags = f"{sweetalert_tag}\n  {choices_js}\n  {custom_alert_admin}\n"
        head_tags = f"{choices_css}\n"
    elif site_type == 'staff':
        body_tags = f"{sweetalert_tag}\n  {choices_js}\n  {custom_alert_staff}\n"
        head_tags = f"{choices_css}\n"

    # Insert into head
    content = content.replace('</head>', f'  {head_tags}</head>')
    # Insert into body
    content = content.replace('</body>', f'  {body_tags}</body>')

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('/Users/doxuanquang/Documents/BioWraps/Hotel/travel-frontend'):
    if 'node_modules' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            path = os.path.join(root, file)
            site_type = 'user'
            if 'admin-dashboard' in path:
                site_type = 'admin'
            elif 'staff' in path:
                site_type = 'staff'
            
            patch_file(path, site_type)

print("Patch complete!")
