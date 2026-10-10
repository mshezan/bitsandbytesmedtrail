with open("web/app/hospital/patient/[id]/consult/page.tsx", "r") as f:
    content = f.read()

import re

# Add import
if "import OrderComposer" not in content:
    content = content.replace('import PrescriptionComposer from "@/components/PrescriptionComposer";', 'import PrescriptionComposer from "@/components/PrescriptionComposer";\nimport OrderComposer from "@/components/OrderComposer";')

# Add state
if "const [showOrderComposer, setShowOrderComposer] = useState(false);" not in content:
    content = content.replace("const [showRxComposer, setShowRxComposer] = useState(false);", "const [showRxComposer, setShowRxComposer] = useState(false);\n  const [showOrderComposer, setShowOrderComposer] = useState(false);")

# Find the generic stub for Labs and replace it with a Labs view containing the Order button.
labs_ui = """
            {activeTab === "Labs" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Unified Lab Results</h3>
                  <button onClick={() => setShowOrderComposer(true)} className="flex items-center gap-1 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                    <FilePlus className="w-4 h-4" /> Add Order
                  </button>
                </div>
                <div className="p-6">
                  {labs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {labs.map((l:any, i:number) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-800">{l.name}</div>
                            <div className="text-xs text-slate-500">{l.date}</div>
                          </div>
                          <div className="font-bold text-lg">{l.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-center py-8">No recent labs on record.</div>
                  )}
                </div>
              </div>
            )}
"""

# Replace `["Timeline", "Problems", "Labs", "Notes & Visits"].includes(activeTab)` with `["Timeline", "Problems", "Notes & Visits"].includes(activeTab)`
content = content.replace('["Timeline", "Problems", "Labs", "Notes & Visits"].includes(activeTab)', '["Timeline", "Problems", "Notes & Visits"].includes(activeTab)')

# Inject labs_ui before the stub
content = content.replace('{["Timeline", "Problems", "Notes & Visits"].includes(activeTab)', labs_ui + '\n            {["Timeline", "Problems", "Notes & Visits"].includes(activeTab)')

order_injection = """
      {/* ORDER COMPOSER MODAL */}
      {showOrderComposer && (
        <OrderComposer 
          patientId={params.id} 
          onClose={() => setShowOrderComposer(false)} 
          activeLabs={labs} 
        />
      )}
"""

content = re.sub(r'    </div>\n  \);\n}', order_injection + "    </div>\n  );\n}", content)

with open("web/app/hospital/patient/[id]/consult/page.tsx", "w") as f:
    f.write(content)
