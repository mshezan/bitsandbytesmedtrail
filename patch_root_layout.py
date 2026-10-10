with open("web/app/layout.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import "./globals.css";',
    'import "./globals.css";\nimport DemoShortcut from "@/components/DemoShortcut";'
)

content = content.replace(
    '<body className={inter.className}>',
    '<body className={inter.className}>\n        <DemoShortcut />'
)

with open("web/app/layout.tsx", "w") as f:
    f.write(content)
