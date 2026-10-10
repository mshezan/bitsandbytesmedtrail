with open("api/test_pipeline.py", "r") as f:
    content = f.read()

import re
content = re.sub(
    r'demo_ambiguous = \{.*?\}',
    'demo_ambiguous = {"name": existing_p.user.name.split()[0] + " X", "phone": existing_p.user.phone}',
    content
)

with open("api/test_pipeline.py", "w") as f:
    f.write(content)
