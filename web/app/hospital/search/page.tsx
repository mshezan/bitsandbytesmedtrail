"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { Search as SearchIcon, User, MapPin, UserPlus, AlertTriangle, ShieldCheck } from "lucide-react";

// Mock debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return [debouncedValue];
}

export default function PatientSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loadError, setLoadError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") || "");
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    const endpoint = debouncedQuery ? `/hospital/search?q=${encodeURIComponent(debouncedQuery)}` : "/hospital/search";
    fetchAPI(endpoint)
      .then(res => {
        // Group near-duplicates (mock logic: same name)
        const grouped: Record<string, any[]> = {};
        res.forEach((p: any) => {
          const key = (p.name || "Unknown").toLowerCase();
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(p);
        });
        
        const finalResults: any[] = [];
        for (const [key, group] of Object.entries(grouped)) {
          if (group.length > 1) {
            finalResults.push({ type: 'duplicate_group', groupName: group[0].name, patients: group });
          } else {
            finalResults.push({ type: 'single', patient: group[0] });
          }
        }
        setResults(finalResults);
      })
      .catch((e: any) => { setResults([]); setLoadError(e.message || "Could not search patients."); })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Patient Search</h1>
          <button 
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-xl text-sm font-medium text-white hover:bg-emerald-700 transition"
          >
            <UserPlus className="w-4 h-4" /> Register New Patient
          </button>
        </div>
        
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-6 w-6 text-slate-400" />
          </div>
          <input 
            type="text" 
            autoFocus
            className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-300 rounded-2xl text-lg shadow-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
            placeholder="Search by Name, ABHA ID (91-...) or Phone (+91...)" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-md">/</kbd>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          {loadError ? <div role="alert" className="p-12 text-center text-rose-700">{loadError}</div> : loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
              Searching network...
            </div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {results.map((item, idx) => {
                if (item.type === 'single') {
                  const p = item.patient;
                  return (
                    <li 
                      key={p.id} 
                      className="p-6 hover:bg-slate-50 transition cursor-pointer flex items-center gap-6"
                      onClick={() => router.push(`/hospital/patient/${p.id}`)}
                    >
                      <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          {p.name} 
                          <span className="text-sm font-normal text-slate-500">{p.sex === 'female' ? 'F' : 'M'}, {p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : 'Unknown'}y</span>
                        </h3>
                        <div className="text-sm text-slate-600 mt-1 flex gap-4">
                          <span><strong className="text-slate-500 font-medium">ABHA:</strong> {p.abha}</span>
                          <span><strong className="text-slate-500 font-medium">Phone:</strong> {p.phone}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-1 text-slate-500 text-sm mb-2">
                          <MapPin className="h-4 w-4" /> {p.city || 'Unknown'}
                        </div>
                        <button className="text-emerald-600 font-medium text-sm hover:underline">
                          View Chart &rarr;
                        </button>
                      </div>
                    </li>
                  )
                } else {
                  return (
                    <li key={`dup-${idx}`} className="p-6 bg-amber-50/30">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <h3 className="font-bold text-amber-900">Possible Duplicates: {item.groupName}</h3>
                        <button className="ml-auto text-xs font-semibold bg-white border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-50">
                          Request Merge
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {item.patients.map((p: any) => (
                          <div 
                            key={p.id} 
                            onClick={() => router.push(`/hospital/patient/${p.id}`)}
                            className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm hover:border-amber-400 cursor-pointer transition"
                          >
                            <div className="font-bold text-slate-800">{p.name} <span className="text-sm font-normal text-slate-500">({p.sex === 'female' ? 'F' : 'M'}, {p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : 'Unknown'}y)</span></div>
                            <div className="text-sm text-slate-600 mt-2 space-y-1">
                              <div>ABHA: <span className="font-mono bg-slate-100 px-1 rounded">{p.abha}</span></div>
                              <div>Phone: {p.phone || 'N/A'}</div>
                              <div>City: {p.city || 'N/A'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </li>
                  )
                }
              })}
            </ul>
          ) : query ? (
            <div className="p-16 text-center text-slate-500">
              <User className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-700">No patients found</p>
              <p className="text-sm mt-1">Try checking the ABHA ID or phone number.</p>
              <button 
                onClick={() => setShowRegister(true)}
                className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition"
              >
                Register "{query}"
              </button>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-500">
              <SearchIcon className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-700">No recent patients yet</p>
              <p className="text-sm mt-1">Search by name, ABHA ID, or the beginning of a phone number.</p>
            </div>
          )}
        </div>
      </div>

      {/* Registration Slide-over / Form */}
      {showRegister && (
        <div className="sticky top-8 flex h-[calc(100vh-8rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:w-[400px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" /> Register Patient
            </h2>
            <button onClick={() => setShowRegister(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
          </div>
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">ABHA ID or Phone</label>
              <div className="flex gap-2">
                <input type="text" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-600 outline-none" placeholder="e.g. 91-..." />
                <button className="bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200">Lookup</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">First Name</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-600 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Last Name</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-600 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">DOB</label>
                <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-600 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Sex</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-600 outline-none bg-white">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm text-emerald-900">
                  <strong className="block font-semibold flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Consent Captured</strong>
                  Patient agrees to link this encounter to their ABDM health record.
                </span>
              </label>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <button className="w-full bg-emerald-600 text-white font-medium py-2.5 rounded-xl hover:bg-emerald-700 transition">
              Create & Start Consult
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
