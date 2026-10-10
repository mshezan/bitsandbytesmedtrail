import os

filepath = "web/app/hospital/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Change /hospital/dashboard to /hospital/home
content = content.replace('href: "/hospital/dashboard"', 'href: "/hospital/home"')

# Replace blue colors with emerald/sage
content = content.replace("bg-blue-600", "bg-emerald-600")
content = content.replace("text-blue-600", "text-emerald-600")
content = content.replace("border-blue-600", "border-emerald-600")

with open(filepath, "w") as f:
    f.write(content)
