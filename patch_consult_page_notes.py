with open("web/app/hospital/patient/[id]/consult/page.tsx", "r") as f:
    content = f.read()

import re

# Add import
if "import NoteEditor" not in content:
    content = content.replace('import OrderComposer from "@/components/OrderComposer";', 'import OrderComposer from "@/components/OrderComposer";\nimport NoteEditor from "@/components/NoteEditor";')

# Add state
if "const [showNoteEditor, setShowNoteEditor] = useState(false);" not in content:
    content = content.replace("const [showOrderComposer, setShowOrderComposer] = useState(false);", "const [showOrderComposer, setShowOrderComposer] = useState(false);\n  const [showNoteEditor, setShowNoteEditor] = useState(false);")

# Find Notes & Visits tab
notes_ui = """
            {activeTab === "Notes & Visits" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Clinical Notes</h3>
                  <button onClick={() => setShowNoteEditor(true)} className="flex items-center gap-1 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                    <FileText className="w-4 h-4" /> Add Note
                  </button>
                </div>
                <div className="p-6 text-slate-500 text-center py-8">
                  Unified notes and discharge summaries appear here.
                </div>
              </div>
            )}
"""

content = content.replace('["Timeline", "Problems", "Notes & Visits"].includes(activeTab)', '["Timeline", "Problems"].includes(activeTab)')

content = content.replace('{["Timeline", "Problems"].includes(activeTab)', notes_ui + '\n            {["Timeline", "Problems"].includes(activeTab)')

note_injection = """
      {/* NOTE EDITOR MODAL */}
      {showNoteEditor && (
        <NoteEditor 
          patientId={params.id} 
          onClose={() => setShowNoteEditor(false)} 
          activeVitals={vitals}
          activeMeds={medications}
        />
      )}
"""

content = re.sub(r'    </div>\n  \);\n}', note_injection + "    </div>\n  );\n}", content)

with open("web/app/hospital/patient/[id]/consult/page.tsx", "w") as f:
    f.write(content)
