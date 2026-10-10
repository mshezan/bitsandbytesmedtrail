with open("web/app/hospital/patient/[id]/consult/page.tsx", "r") as f:
    content = f.read()

toggle_html = """
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button className="px-3 py-1.5 text-xs font-bold rounded-md bg-white shadow-sm text-emerald-800 border border-slate-200">
              Unified View
            </button>
            <button className="px-3 py-1.5 text-xs font-bold rounded-md text-slate-500 hover:text-slate-700">
              Kaveri Only
            </button>
          </div>
"""

# Insert near the top right of the header, next to "End Consult"
content = content.replace(
    '<button className="px-4 py-2 bg-rose-100 text-rose-700 font-bold text-sm rounded-lg hover:bg-rose-200 flex items-center gap-2">',
    toggle_html + '\n          <button className="px-4 py-2 bg-rose-100 text-rose-700 font-bold text-sm rounded-lg hover:bg-rose-200 flex items-center gap-2">'
)

with open("web/app/hospital/patient/[id]/consult/page.tsx", "w") as f:
    f.write(content)
