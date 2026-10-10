with open("web/components/ClientLayout.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "if (pathname === '/login' || pathname === '/') {",
    "if (pathname === '/login' || pathname === '/' || pathname.startsWith('/hospital') || pathname.startsWith('/api')) {"
)

with open("web/components/ClientLayout.tsx", "w") as f:
    f.write(content)
