with open("web/app/hospital/patient/[id]/consult/page.tsx", "r") as f:
    content = f.read()

import re

# Add import
if "import PrescriptionComposer" not in content:
    content = content.replace('import { useRouter } from "next/navigation";', 'import { useRouter } from "next/navigation";\nimport PrescriptionComposer from "@/components/PrescriptionComposer";')

# Add state for composer
if "const [showRxComposer, setShowRxComposer] = useState(false);" not in content:
    content = content.replace("const [briefLoading, setBriefLoading] = useState(false);", "const [briefLoading, setBriefLoading] = useState(false);\n  const [showRxComposer, setShowRxComposer] = useState(false);")

# Attach click to the "Add Rx" button in the Medications tab
content = content.replace('<button className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition">', 
                          '<button onClick={() => setShowRxComposer(true)} className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition">')

# Attach click to the "New prescription" quick action in Zone 4 (if we have it, wait we didn't add the quick actions explicitly. I added "Before you order". Let's inject it into the footer or right before the closing div.)

composer_injection = """
      {/* PRESCRIPTION COMPOSER MODAL */}
      {showRxComposer && (
        <PrescriptionComposer 
          patientId={params.id} 
          onClose={() => setShowRxComposer(false)} 
          activeConditions={conditions} 
          activeAllergies={allergies} 
          activeMeds={medications}
        />
      )}
    </div>
  );
"""

content = re.sub(r'    </div>\n  \);\n}', composer_injection + "}", content)

with open("web/app/hospital/patient/[id]/consult/page.tsx", "w") as f:
    f.write(content)
