"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

export default function AuditLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI("/audit")
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sage border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-10 flex items-center gap-4">
        <button
          onClick={() => router.push("/patient/share")}
          className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200"
        >
          &larr; Back
        </button>
        <div>
          <h1 className="text-3xl font-semibold">Access Log</h1>
          <p className="mt-1 text-neutral-500">Track who viewed your records and when.</p>
        </div>
      </header>

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-neutral-600">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-6 py-4 font-medium">Date & Time</th>
              <th className="px-6 py-4 font-medium">Actor</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-neutral-50">
                <td className="whitespace-nowrap px-6 py-4">
                  {format(parseISO(log.created_at), "MMM d, yyyy h:mm a")}
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-neutral-900">{log.actor_label}</span>
                  <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] uppercase">{log.actor_type}</span>
                </td>
                <td className="px-6 py-4 font-medium text-sage">{log.action}</td>
                <td className="px-6 py-4 text-xs text-neutral-500">{log.detail || "-"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-neutral-500">
                  No access logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
