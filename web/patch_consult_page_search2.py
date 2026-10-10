with open("app/hospital/patient/[id]/consult/page.tsx", "r") as f:
    content = f.read()

content = content.replace('import { Search, useState', 'import { useState')
content = content.replace('import { \n  AlertTriangle,', 'import { Search, \n  AlertTriangle,')

with open("app/hospital/patient/[id]/consult/page.tsx", "w") as f:
    f.write(content)
