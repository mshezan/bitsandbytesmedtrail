"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { Search as SearchIcon, User, MapPin } from "lucide-react";



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
  const router = useRouter();

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetchAPI(`/hospital/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => setResults(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Patient Search</h1>
      
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-6 w-6 text-slate-400" />
        </div>
        <input 
          type="text" 
          autoFocus
          className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-300 rounded-2xl text-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
          placeholder="Search by Name, ABHA ID (91-...) or Phone (+91...)" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-md">/</kbd>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            Searching...
          </div>
        ) : results.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {results.map((p) => (
              <li 
                key={p.id} 
                className="p-6 hover:bg-blue-50 transition cursor-pointer flex items-center gap-6"
                onClick={() => router.push(`/hospital/patient/${p.id}`)}
              >
                <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
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
                <div className="text-right">
                  <div className="flex items-center gap-1 text-slate-500 text-sm justify-end mb-1">
                    <MapPin className="h-4 w-4" /> {p.city || 'Unknown'}
                  </div>
                  <button className="text-blue-600 font-medium text-sm hover:underline">
                    View Record &rarr;
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : query ? (
          <div className="p-16 text-center text-slate-500">
            <User className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700">No patients found</p>
            <p className="text-sm mt-1">Try checking the ABHA ID or phone number.</p>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-500">
            <SearchIcon className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700">Start typing to search</p>
            <p className="text-sm mt-1">Search the unified ABDM network.</p>
          </div>
        )}
      </div>
    </div>
  );
}
