"use client";

import { Server, Database, Activity, FileJson, FileText, Globe } from "lucide-react";

export default function NetworkMap({ nodes, scale = 1 }: { nodes: any[], scale?: number }) {
  if (!nodes || nodes.length === 0) return null;
  
  return (
    <div className="relative w-full flex flex-col">
      {/* Legend */}
      <div className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur border border-slate-200 rounded-xl p-3 shadow-sm text-xs font-medium space-y-2">
         <h4 className="font-bold text-slate-800 uppercase mb-2">Legend</h4>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div> Online & Syncing</div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div> Needs Attention</div>
         <div className="flex items-center gap-2"><FileJson className="w-4 h-4 text-slate-400"/> FHIR / HL7</div>
         <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400"/> CSV / Batch</div>
         <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-slate-400"/> API Push</div>
      </div>

      <div className="relative flex items-center justify-center bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-100 min-h-[700px] w-full" style={{ height: 700 * scale }}>
        
        {/* Central MedTrail Node */}
        <div className="absolute z-20 flex flex-col items-center" style={{ transform: `scale(${scale})` }}>
          <div className="w-28 h-28 bg-emerald-700 rounded-full shadow-2xl flex items-center justify-center border-4 border-white animate-[pulse_4s_ease-in-out_infinite]">
            <Database className="w-12 h-12 text-white" />
          </div>
          <div className="mt-4 bg-white px-5 py-2 rounded-full shadow-md border border-slate-200 font-black text-emerald-900 text-sm tracking-wide">
            MedTrail Unified Core
          </div>
        </div>

        {/* SVG Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <radialGradient id="grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)" />
          {nodes.map((node, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI;
            const radiusX = 300;
            const radiusY = 250;
            // Center is roughly 50%
            return (
              <g key={node.id}>
                <line 
                  x1="50%" y1="50%" 
                  x2={`calc(50% + ${Math.cos(angle) * radiusX * scale}px)`} 
                  y2={`calc(50% + ${Math.sin(angle) * radiusY * scale}px)`} 
                  stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" 
                />
                {node.status === 'online' && (
                  <circle 
                    cx={`calc(50% + ${Math.cos(angle) * (radiusX * 0.6) * scale}px)`} 
                    cy={`calc(50% + ${Math.sin(angle) * (radiusY * 0.6) * scale}px)`} 
                    r="4" fill="#10b981" className="animate-ping" 
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Orbiting Mock Systems */}
        {nodes.map((node, i) => {
          const angle = (i / nodes.length) * 2 * Math.PI;
          const radiusX = 300;
          const radiusY = 250;
          const left = `calc(50% + ${Math.cos(angle) * radiusX * scale}px)`;
          const top = `calc(50% + ${Math.sin(angle) * radiusY * scale}px)`;
          
          let Icon = Server;
          if (node.format?.includes('FHIR') || node.format?.includes('HL7')) Icon = FileJson;
          else if (node.format?.includes('CSV')) Icon = FileText;
          else if (node.format?.includes('API')) Icon = Globe;

          return (
            <div key={node.id} className="absolute z-10 flex flex-col items-center w-48 group" style={{ left, top, transform: `translate(-50%, -50%) scale(${scale})` }}>
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center relative cursor-pointer hover:border-emerald-500 hover:shadow-xl transition-all group-hover:scale-110 duration-300">
                <Icon className="w-7 h-7 text-slate-600" />
                <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${node.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <div className="mt-4 bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-sm border border-slate-200 text-center w-full group-hover:border-emerald-300 transition-colors">
                <p className="text-sm font-bold text-slate-900 leading-tight">{node.name}</p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">{node.city || 'Regional'}</p>
                <div className="inline-block mt-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                  {node.format}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
