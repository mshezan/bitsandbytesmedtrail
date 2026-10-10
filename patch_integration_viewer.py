with open("web/app/hospital/integration/page.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import { fetchAPI } from "@/lib/api";',
    'import { fetchAPI } from "@/lib/api";\nimport RawVsUnifiedViewer from "@/components/RawVsUnifiedViewer";'
)

content = content.replace(
    'const [activeTab, setActiveTab] = useState("network");',
    'const [activeTab, setActiveTab] = useState("network");\n  const [viewerOpen, setViewerOpen] = useState(false);'
)

viewer_btn = """
        <div className="flex justify-end mb-4">
          <button onClick={() => setViewerOpen(true)} className="px-4 py-2 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-lg border border-emerald-200 hover:bg-emerald-200 flex items-center gap-2 shadow-sm">
            <Search className="w-4 h-4" /> Open Pipeline Inspector Demo
          </button>
        </div>
"""

content = content.replace(
    '<div className="max-w-7xl mx-auto p-6">',
    '<div className="max-w-7xl mx-auto p-6">\n' + viewer_btn
)

content = content.replace(
    'return (\n    <div className="flex-1 bg-slate-50 min-h-screen">',
    'return (\n    <div className="flex-1 bg-slate-50 min-h-screen">\n      <RawVsUnifiedViewer isOpen={viewerOpen} onClose={() => setViewerOpen(false)} />'
)

with open("web/app/hospital/integration/page.tsx", "w") as f:
    f.write(content)
