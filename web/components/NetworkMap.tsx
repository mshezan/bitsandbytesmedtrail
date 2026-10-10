"use client";

import { Server, Database } from "lucide-react";

export default function NetworkMap({ nodes, scale = 1 }: { nodes: any[], scale?: number }) {
  if (!nodes || nodes.length === 0) return null;
  
  return (
    <div className="relative flex items-center justify-center bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-100" style={{ height: 600 * scale }}>
      {/* Central MedTrail Node */}
      <div className="absolute z-20 flex flex-col items-center" style={{ transform: `scale(${scale})` }}>
        <div className="w-24 h-24 bg-emerald-600 rounded-full shadow-xl flex items-center justify-center border-4 border-white animate-pulse">
          <Database className="w-10 h-10 text-white" />
        </div>
        <div className="mt-4 bg-white px-4 py-1.5 rounded-full shadow border border-slate-200 font-bold text-emerald-900 text-sm">
          MedTrail Unified API
        </div>
      </div>

      {/* Orbiting Mock Systems */}
      {nodes.map((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        const radius = 220;
        const left = `calc(50% + ${Math.cos(angle) * radius * scale}px)`;
        const top = `calc(50% + ${Math.sin(angle) * radius * scale}px)`;
        
        return (
          <div key={node.id} className="absolute z-10 flex flex-col items-center w-32" style={{ left, top, transform: `translate(-50%, -50%) scale(${scale})` }}>
            <svg className="absolute pointer-events-none -z-10" style={{ width: 440*scale, height: 440*scale, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <line x1={220*scale} y1={220*scale} x2={(220 - Math.cos(angle)*radius)*scale} y2={(220 - Math.sin(angle)*radius)*scale} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />
              <circle cx={(220 - Math.cos(angle)*(radius/2))*scale} cy={(220 - Math.sin(angle)*(radius/2))*scale} r="4" fill="#10b981" className="animate-ping" />
            </svg>

            <div className="w-14 h-14 bg-white rounded-2xl shadow-md border border-slate-200 flex items-center justify-center relative cursor-pointer hover:border-emerald-500 hover:shadow-lg transition">
              <Server className="w-6 h-6 text-slate-600" />
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${node.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs font-bold text-slate-800 leading-tight">{node.name}</p>
              <span className="inline-block mt-1 bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-mono">{node.format}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
