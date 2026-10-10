with open("web/app/hospital/patient/[id]/consult/page.tsx", "r") as f:
    content = f.read()

import re

# Add import
if "import ReferralComposer" not in content:
    content = content.replace('import NoteEditor from "@/components/NoteEditor";', 'import NoteEditor from "@/components/NoteEditor";\nimport ReferralComposer from "@/components/ReferralComposer";')

# Add state
if "const [showReferralComposer, setShowReferralComposer] = useState(false);" not in content:
    content = content.replace("const [showNoteEditor, setShowNoteEditor] = useState(false);", "const [showNoteEditor, setShowNoteEditor] = useState(false);\n  const [showReferralComposer, setShowReferralComposer] = useState(false);")

# Find Quick Actions block and patch it to have a clickable "Refer"
quick_actions_stub = """
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Quick Actions</label>
              <div className="flex gap-2">
                <button onClick={() => setShowReferralComposer(true)} className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-xs font-semibold hover:bg-indigo-100">Refer Patient</button>
              </div>
            </div>
"""

content = content.replace('<div>\n              <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Before you prescribe</label>', quick_actions_stub + '\n            <div>\n              <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Before you prescribe</label>')

ref_injection = """
      {/* REFERRAL COMPOSER MODAL */}
      {showReferralComposer && (
        <ReferralComposer 
          patientId={params.id} 
          onClose={() => setShowReferralComposer(false)} 
        />
      )}
"""

content = re.sub(r'    </div>\n  \);\n}', ref_injection + "    </div>\n  );\n}", content)

with open("web/app/hospital/patient/[id]/consult/page.tsx", "w") as f:
    f.write(content)
