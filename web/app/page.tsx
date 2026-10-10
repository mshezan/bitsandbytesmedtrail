"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Activity, FileText, Database, ShieldCheck, HeartPulse, RefreshCw } from "lucide-react";
import { fetchAPI } from "@/lib/api";

type Status = {
  patients: number;
  records: number;
  sources: number;
  insights_generated: number;
};

export default function LandingPage() {
  const [status, setStatus] = useState<Status | null>(null);
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/demo/status`)
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-700">
            <HeartPulse className="h-6 w-6" />
            <span className="font-bold text-xl tracking-tight">MedTrail</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
            <Link href="/patients" className="hover:text-emerald-700 transition">For Patients</Link>
            <Link href="/hospitals" className="hover:text-emerald-700 transition">For Hospitals</Link>
            <Link href="/how-it-works" className="hover:text-emerald-700 transition">How it works</Link>
            <Link href="/api" className="hover:text-emerald-700 transition">Unified API</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-emerald-700 hover:text-emerald-800 transition">Login</Link>
            <Link href="/login" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          ABDM-Aligned Unified Health Record
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
          One health record that follows you across every doctor, lab and hospital.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          MedTrail unifies fragmented medical history into a single, secure timeline. Built for Indian healthcare.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link href="/login" className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-emerald-700 transition flex items-center justify-center">
            I'm a patient <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/login" className="w-full sm:w-auto bg-white text-slate-700 border border-slate-300 px-8 py-4 rounded-xl font-medium hover:bg-slate-50 transition flex items-center justify-center">
            I'm a hospital <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 2. The Problem */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">The Continuity Gap</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { title: "Scattered Records", desc: "Prescriptions lost in WhatsApp photos and paper files." },
              { title: "Unreliable Recall", desc: "Patients can't remember exact doses or past test dates." },
              { title: "Repeated Tests", desc: "Redoing MRIs because the CD from another city won't open." },
              { title: "Insecure Sharing", desc: "Emailing PDFs with no access control or expiry." },
              { title: "Broken Continuity", desc: "Arriving at an ER with no context of chronic conditions." }
            ].map((p, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  {i+1}
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How it works */}
      <section className="py-20 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How MedTrail Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <Database className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">1. Connect & Upload</h3>
              <p className="text-slate-600 text-sm">Link hospitals via ABHA or upload raw PDFs and lab reports.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <RefreshCw className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">2. Unify via FHIR</h3>
              <p className="text-slate-600 text-sm">We normalize messy data into one structured timeline.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <Activity className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">3. Smart Insights</h3>
              <p className="text-slate-600 text-sm">Flag repeated tests and dangerous drug interactions.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <ShieldCheck className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">4. Secure Access</h3>
              <p className="text-slate-600 text-sm">Share securely with clinicians or open in emergencies.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE UNIFIED API */}
      <section className="py-20 bg-slate-900 text-white px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-4">The Unified API</h2>
            <p className="text-slate-400 mb-6">
              Hospitals, labs, and pharmacies integrate via our API. We ingest HL7, CSV, or PDFs, map them to FHIR R4, and deliver a unified JSON payload to both Patient and Hospital portals.
            </p>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 font-mono text-xs overflow-x-auto text-emerald-400 mb-6">
              <pre>{`POST /v1/ingest/bundle
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    { "resource": { "resourceType": "Patient", "id": "91-4821-..." } },
    { "resource": { "resourceType": "Observation", "code": "HbA1c" } }
  ]
}`}</pre>
            </div>
            <Link href="/api" className="inline-flex bg-white text-slate-900 px-6 py-3 rounded-xl font-medium hover:bg-slate-200 transition items-center">
              Try it Live <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="flex-1">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center flex flex-col items-center justify-center space-y-6">
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="bg-slate-700 p-3 rounded-lg text-sm font-medium">Hospital System</div>
                <div className="bg-slate-700 p-3 rounded-lg text-sm font-medium">Lab LIMS</div>
                <div className="bg-slate-700 p-3 rounded-lg text-sm font-medium">Pharmacy</div>
              </div>
              <ArrowRight className="h-6 w-6 text-slate-500 transform rotate-90" />
              <div className="bg-emerald-600 text-white w-full p-4 rounded-xl font-bold">
                MedTrail Normalization Engine
              </div>
              <ArrowRight className="h-6 w-6 text-slate-500 transform rotate-90" />
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-emerald-900 border border-emerald-700 text-emerald-100 p-3 rounded-lg text-sm font-medium">Patient App</div>
                <div className="bg-blue-900 border border-blue-700 text-blue-100 p-3 rounded-lg text-sm font-medium">Hospital Portal</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. For Patients vs For Hospitals */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-emerald-50 p-10 rounded-3xl">
            <h2 className="text-3xl font-bold text-emerald-900 mb-6">For Patients</h2>
            <ul className="space-y-4 mb-8 text-emerald-800">
              <li className="flex items-center"><ShieldCheck className="mr-3 h-5 w-5 text-emerald-600"/> Own your data, always</li>
              <li className="flex items-center"><ShieldCheck className="mr-3 h-5 w-5 text-emerald-600"/> Never forget a prescription</li>
              <li className="flex items-center"><ShieldCheck className="mr-3 h-5 w-5 text-emerald-600"/> Handover to new doctors easily</li>
              <li className="flex items-center"><ShieldCheck className="mr-3 h-5 w-5 text-emerald-600"/> Emergency QR card</li>
            </ul>
            <Link href="/login" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition">
              Patient Portal
            </Link>
          </div>
          <div className="bg-blue-50 p-10 rounded-3xl">
            <h2 className="text-3xl font-bold text-blue-900 mb-6">For Hospitals</h2>
            <ul className="space-y-4 mb-8 text-blue-800">
              <li className="flex items-center"><ShieldCheck className="mr-3 h-5 w-5 text-blue-600"/> Point-of-care history</li>
              <li className="flex items-center"><ShieldCheck className="mr-3 h-5 w-5 text-blue-600"/> Avoid repeated tests</li>
              <li className="flex items-center"><ShieldCheck className="mr-3 h-5 w-5 text-blue-600"/> Medication interaction checks</li>
              <li className="flex items-center"><ShieldCheck className="mr-3 h-5 w-5 text-blue-600"/> FHIR integration</li>
            </ul>
            <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition">
              Hospital Portal
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Trust & Privacy */}
      <section className="py-16 bg-slate-100 text-center px-6">
        <div className="max-w-4xl mx-auto">
          <ShieldCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">DPDP Act-Aware Privacy</h2>
          <p className="text-slate-600 mb-2">
            Built with strict consent-based access. We do not store Aadhaar numbers natively, only ABHA addresses.
            All shares expire, and every view is logged in the patient's Audit Trail.
          </p>
          <p className="text-xs text-slate-400 italic">Note: This is a prototype operating with strictly synthetic data for demonstration purposes.</p>
        </div>
      </section>

      {/* 7. Numbers Strip */}
      <section className="bg-emerald-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-black mb-2">{status?.patients || "-"}</div>
            <div className="text-emerald-200 text-sm font-medium uppercase tracking-wider">Patients Unified</div>
          </div>
          <div>
            <div className="text-4xl font-black mb-2">{status?.records || "-"}</div>
            <div className="text-emerald-200 text-sm font-medium uppercase tracking-wider">Records Processed</div>
          </div>
          <div>
            <div className="text-4xl font-black mb-2">{status?.sources || "-"}</div>
            <div className="text-emerald-200 text-sm font-medium uppercase tracking-wider">Connected Sources</div>
          </div>
          <div>
            <div className="text-4xl font-black mb-2">{status?.insights_generated || "-"}</div>
            <div className="text-emerald-200 text-sm font-medium uppercase tracking-wider">Insights Flagged</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-center text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 text-white mb-4 md:mb-0">
            <HeartPulse className="h-5 w-5" />
            <span className="font-bold tracking-tight">MedTrail</span>
          </div>
          <div className="space-x-6">
            <a href="#" className="hover:text-white transition">About</a>
            <a href="/api" className="hover:text-white transition">API Docs</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
