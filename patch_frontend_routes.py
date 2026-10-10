import os
import re

directories = ["web/components", "web/app"]

replacements = [
    ("'/home'", "'/patient/home'"),
    ('"/home"', '"/patient/home"'),
    ("'/timeline'", "'/patient/timeline'"),
    ('"/timeline"', '"/patient/timeline"'),
    ("'/medications'", "'/patient/medications'"),
    ('"/medications"', '"/patient/medications"'),
    ("'/labs'", "'/patient/labs'"),
    ('"/labs"', '"/patient/labs"'),
    ("'/providers'", "'/patient/providers'"),
    ('"/providers"', '"/patient/providers"'),
    ("'/share'", "'/patient/share'"),
    ('"/share"', '"/patient/share"'),
    ("'/emergency'", "'/patient/emergency'"),
    ('"/emergency"', '"/patient/emergency"'),
    ("'/handover'", "'/patient/handover'"),
    ('"/handover"', '"/patient/handover"'),
    ("'/profile'", "'/patient/profile'"),
    ('"/profile"', '"/patient/profile"'),
    ("'/connect'", "'/patient/connect'"),
    ('"/connect"', '"/patient/connect"'),
    ("href='/home'", "href='/patient/home'"),
    ('href="/home"', 'href="/patient/home"'),
]

for d in directories:
    for root, dirs, files in os.walk(d):
        for f in files:
            if f.endswith((".tsx", ".ts", ".js", ".jsx")):
                filepath = os.path.join(root, f)
                with open(filepath, "r") as file:
                    content = file.read()
                
                original_content = content
                for old, new in replacements:
                    content = content.replace(old, new)
                
                if content != original_content:
                    with open(filepath, "w") as file:
                        file.write(content)

# Patch Shell.tsx navigation
with open("web/components/Shell.tsx", "r") as file:
    content = file.read()
content = content.replace("pathname === '/login' || pathname === '/'", "pathname === '/login' || pathname === '/' || pathname.startsWith('/hospital')")
with open("web/components/Shell.tsx", "w") as file:
    file.write(content)
