"use client";
import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

export default function InsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    fetchAPI('/insights').then(setInsights).catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Health Insights</h1>
      <div className="space-y-4">
        {insights.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">No active insights generated.</div>
        ) : (
          insights.map((insight: any, i: number) => (
            <div key={i} className={`p-6 rounded-xl border ${insight.severity === 'high' ? 'bg-red-50 border-red-200 text-red-900' : insight.severity === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5" /> {insight.title}
              </h3>
              <p className="text-sm">{insight.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
