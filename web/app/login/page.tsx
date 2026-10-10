"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI, setToken } from "@/lib/api";
import { Building, UserRound, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "hospital">("patient");
  const [step, setStep] = useState<"request" | "verify">("request");
  
  // Patient fields
  const [phone, setPhone] = useState("+919876543210");
  const [code, setCode] = useState("123456");
  
  // Hospital fields
  const [hospitalId, setHospitalId] = useState("HOSP-KAV-001");
  const [email, setEmail] = useState("ramesh.iyer@kaveri.local");
  const [password, setPassword] = useState("password");
  const [hospitalCode, setHospitalCode] = useState("123456");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePatientRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await fetchAPI("/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setStep("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePatientVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, code }),
      });
      setToken(res.access_token);
      router.push("/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleHospitalLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI("/auth/hospital/login", {
        method: "POST",
        body: JSON.stringify({ hospital_id: hospitalId, email, password, otp: hospitalCode }),
      });
      setToken(res.access_token);
      router.push("/shared/demo"); // Or wherever clinician workspace is
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">Welcome to MedTrail</h1>
        <p className="mt-2 text-neutral-500">Log in to your portal.</p>
      </header>
      
      <div className="flex rounded-xl bg-slate-100 p-1 mb-8">
        <button 
          onClick={() => {setRole("patient"); setStep("request")}} 
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${role === "patient" ? "bg-white shadow-sm text-sage" : "text-slate-500 hover:text-slate-700"}`}
        >
          Patient
        </button>
        <button 
          onClick={() => {setRole("hospital"); setStep("request")}} 
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${role === "hospital" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
        >
          Hospital Staff
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {role === "patient" && step === "request" && (
        <form onSubmit={handlePatientRequest} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Phone or ABHA ID</span>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-sage focus:ring-1 focus:ring-sage"
              placeholder="e.g. +919876543210 or 91-4821-..."
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-sage px-4 py-3 font-medium text-white hover:bg-sage/90 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}

      {role === "patient" && step === "verify" && (
        <form onSubmit={handlePatientVerify} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Verification Code</span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-sage focus:ring-1 focus:ring-sage"
              placeholder="Enter 6-digit code"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-sage px-4 py-3 font-medium text-white hover:bg-sage/90 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>
      )}
      
      {role === "hospital" && (
        <form onSubmit={handleHospitalLogin} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Hospital ID</span>
            <input
              type="text"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              placeholder="e.g. HOSP-KAV-001"
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Staff Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              placeholder="ramesh.iyer@kaveri.local"
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Staff OTP</span>
            <input
              type="text"
              value={hospitalCode}
              onChange={(e) => setHospitalCode(e.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              placeholder="123456"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In to Hospital Portal"}
          </button>
        </form>
      )}

      {/* Demo Accounts Box */}
      <div className="mt-12 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <h3 className="text-sm font-semibold text-emerald-800 mb-2">Demo Credentials</h3>
        <div className="text-xs text-emerald-700 space-y-2">
          <div>
            <strong>Patient:</strong><br/>
            Phone: +919876543210 (Priya Sharma)<br/>
            ABHA: 91-4821-3921-1122<br/>
            OTP: 123456
          </div>
          <div className="pt-2 border-t border-emerald-200">
            <strong>Hospital Staff:</strong><br/>
            ID: HOSP-KAV-001<br/>
            Email: ramesh.iyer@kaveri.local<br/>
            Pass: password | OTP: 123456
          </div>
        </div>
      </div>
    </main>
  );
}
