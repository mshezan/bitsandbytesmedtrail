import re
with open("web/components/Shell.tsx", "r") as f:
    content = f.read()

# We need to remove the first occurrence or the second occurrence.
# Let's see the context around line 65
lines = content.split('\n')
for i, line in enumerate(lines):
    if "const [cmdOpen, setCmdOpen] = useState(false);" in line:
        print(f"Line {i}: {line}")
