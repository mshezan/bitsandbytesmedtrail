with open("web/app/page.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import { ArrowRight, Activity, FileText, Database, ShieldCheck, HeartPulse, RefreshCw } from "lucide-react";',
    'import { ArrowRight, Activity, FileText, Database, ShieldCheck, HeartPulse, RefreshCw } from "lucide-react";\nimport NetworkMap from "@/components/NetworkMap";'
)

new_state = """
  const [stats, setStats] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/hospital/integration/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/hospital/integration/nodes`)
      .then(res => res.json())
      .then(data => setNodes(data))
      .catch(console.error);
  }, []);
"""

content = content.replace(
    'const [status, setStatus] = useState<Status | null>(null);\n  \n  useEffect(() => {\n    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/demo/status`)\n      .then(res => res.json())\n      .then(data => setStatus(data))\n      .catch(console.error);\n  }, []);',
    new_state
)

# Insert the NetworkMap section
network_html = """
      {/* 4.5 CONNECTED NETWORK */}
      <section className="py-20 bg-slate-50 px-6 border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center max-w-2xl mb-12">
            <h2 className="text-3xl font-bold mb-4">The Connected Network</h2>
            <p className="text-slate-600">MedTrail actively standardizes diverse incoming formats into one unified schema. The visualization below represents the live integration topology.</p>
          </div>
          <div className="w-full bg-white shadow-sm border border-slate-200 rounded-3xl p-4">
             <NetworkMap nodes={nodes} scale={0.7} />
          </div>
        </div>
      </section>
"""

content = content.replace(
    '</section>\n\n      {/* 5. For Patients vs For Hospitals */}',
    '</section>\n\n' + network_html + '\n\n      {/* 5. For Patients vs For Hospitals */}'
)

# Update the Numbers Strip
new_strip = """
      {/* 7. Numbers Strip */}
      <section className="bg-emerald-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-black mb-2">{stats?.organizations_connected || "-"}</div>
            <div className="text-emerald-200 text-sm font-medium uppercase tracking-wider">Connected Hospitals</div>
          </div>
          <div>
            <div className="text-4xl font-black mb-2">{stats?.records_unified || "-"}</div>
            <div className="text-emerald-200 text-sm font-medium uppercase tracking-wider">Records Unified</div>
          </div>
          <div>
            <div className="text-4xl font-black mb-2">{stats?.patients_matched_multiple || "-"}</div>
            <div className="text-emerald-200 text-sm font-medium uppercase tracking-wider">Cross-Matched Patients</div>
          </div>
          <div>
            <div className="text-4xl font-black mb-2">{stats?.mapping_coverage || "-"}%</div>
            <div className="text-emerald-200 text-sm font-medium uppercase tracking-wider">Mapping Coverage</div>
          </div>
        </div>
      </section>
"""

import re
content = re.sub(r'\{\/\* 7\. Numbers Strip \*\/\}.*?<\/section>', new_strip, content, flags=re.DOTALL)

with open("web/app/page.tsx", "w") as f:
    f.write(content)
