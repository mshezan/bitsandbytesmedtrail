with open("app/hospital/patient/[id]/consult/page.tsx", "r") as f:
    content = f.read()

import re
content = re.sub(r'import \{', 'import { Search,', content, count=1)

with open("app/hospital/patient/[id]/consult/page.tsx", "w") as f:
    f.write(content)
