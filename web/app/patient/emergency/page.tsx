"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";

export default function EmergencyQRPage() {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCard, setShowCard] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError(""); setMessage("");
    try {
      const res = await fetchAPI("/emergency", { method: "POST" });
      setUrl(res.url);
      setShowCard(true);
      setMessage("Your emergency card is ready. Anyone with the QR code can view the emergency details shown on it until you revoke access.");
    } catch (err: any) {
      setError(err.message || "Could not create the emergency card.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    setLoading(true); setError(""); setMessage("");
    try {
      await fetchAPI("/emergency/revoke", { method: "POST" });
      setUrl(null);
      setShowCard(true);
      setMessage("Emergency card access has been revoked.");
    } catch (err: any) {
      setError(err.message || "Could not revoke the emergency card.");
    } finally { setLoading(false); }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12 text-center">
      <header className="mb-10 flex items-center justify-between">
        <button onClick={() => router.push("/patient/home")} className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200">
          &larr; Back
        </button>
      </header>

      <h1 className="mb-2 text-3xl font-bold text-red-600">Emergency Card</h1>
      <p className="mb-8 text-neutral-500">
        Generate a secure QR code for ER staff to scan. It provides instant access to your blood type, allergies, conditions, and emergency contact.
      </p>

      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-left text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-left text-sm text-emerald-900">{message}</p>}

      {url && showCard ? (
        <div className="flex flex-col items-center">
          <div className="rounded-3xl border-4 border-red-100 bg-white p-6 shadow-lg">
            <QRCodeSVG value={url} size={256} />
          </div>
          <p className="mt-6 text-sm text-neutral-500">Scan with any smartphone camera.</p>
          <a href={url} target="_blank" rel="noreferrer" className="mt-4 break-all text-sm text-emerald-800 underline">
            Open emergency view
          </a>
          <button 
            onClick={() => setShowCard(false)}
            className="mt-6 rounded-xl border border-neutral-200 px-6 py-3 font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Hide QR Code
          </button>
          <button disabled={loading} onClick={handleRevoke} className="mt-3 text-sm font-medium text-red-700 underline disabled:opacity-50">{loading ? "Revoking…" : "Revoke this card"}</button>
        </div>
      ) : (
        <div className="space-y-3">
        {url && <button onClick={() => setShowCard(true)} className="w-full rounded-xl border border-slate-300 bg-white py-3 font-medium text-slate-700">Show current QR code</button>}
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-2xl bg-red-600 py-4 text-lg font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate QR Code"}
        </button>
        {url && <button disabled={loading} onClick={handleRevoke} className="w-full py-2 text-sm font-medium text-red-700 underline disabled:opacity-50">Revoke this card</button>}
        </div>
      )}
    </main>
  );
}
