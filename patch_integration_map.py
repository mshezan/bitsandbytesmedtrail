with open("web/app/hospital/integration/page.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import RawVsUnifiedViewer from "@/components/RawVsUnifiedViewer";',
    'import RawVsUnifiedViewer from "@/components/RawVsUnifiedViewer";\nimport NetworkMap from "@/components/NetworkMap";'
)

import re

# We want to replace the whole <div className="relative h-[600px] ... </div> block with <NetworkMap nodes={nodes} />
# I will use a regex to replace it.
pattern = re.compile(r'<div className="relative h-\[600px\] flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden border border-slate-100">.*?</svg>.*?</div>.*?</div>.*?</div>', re.DOTALL)

content = pattern.sub('<NetworkMap nodes={nodes} />', content)

with open("web/app/hospital/integration/page.tsx", "w") as f:
    f.write(content)
