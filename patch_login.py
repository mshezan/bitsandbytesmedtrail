with open("web/app/login/page.tsx", "r") as f:
    content = f.read()

content = content.replace('"5550101"', '"+919876543210"')
content = content.replace('e.g. 5550101', 'e.g. +919876543210')

with open("web/app/login/page.tsx", "w") as f:
    f.write(content)
