"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+919876543210");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [code, setCode] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent) {
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

  async function handleVerify(e: React.FormEvent) {
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

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-semibold">Welcome to MedTrail</h1>
        <p className="mt-2 text-neutral-500">Your medical timeline.</p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === "request" ? (
        <form onSubmit={handleRequest} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Phone Number</span>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-sage focus:ring-1 focus:ring-sage"
              placeholder="e.g. +919876543210"
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
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col gap-5">
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
    </main>
  );
}
