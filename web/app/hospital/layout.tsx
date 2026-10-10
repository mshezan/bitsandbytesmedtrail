"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAPI, clearToken } from "@/lib/api";
import {
  Stethoscope, LayoutDashboard, Search, Inbox, Settings, Command,
} from "lucide-react";

const nav = [
  { name: "Overview", href: "/hospital/home", icon: LayoutDashboard },
  { name: "Patient search", href: "/hospital/search", icon: Search },
  { name: "Correction inbox", href: "/hospital/inbox", icon: Inbox },
  { name: "Integrations", href: "/hospital/settings", icon: Settings },
];

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchAPI("/me").then((res) => {
      if (!res?.user) return;
      if (!["hospital_staff", "org_admin"].includes(res.user.role)) {
        router.push("/patient/home");
        return;
      }
      setUser(res.user);
    }).catch(() => {
      clearToken();
      router.push("/login");
    });
  }, [pathname, router]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        router.push("/hospital/search");
      }
      if (event.key === "Escape") setAvatarOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  const signOut = () => {
    clearToken();
    router.push("/login");
  };

  if (!user) return <div className="min-h-screen animate-pulse bg-[#f8f9fa]" />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] text-slate-900">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center space-x-2 border-b border-slate-200 p-4 text-emerald-700 md:p-6">
          <Stethoscope className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight">MedTrail</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center rounded-lg px-3 py-2.5 transition-colors ${active ? "bg-emerald-50 font-medium text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}>
                <item.icon className={`mr-3 h-5 w-5 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white p-4">
          <Link href="/hospital/dashboard" className="flex items-center font-bold text-emerald-700 md:hidden">
            <Stethoscope className="mr-1 h-5 w-5" /> MedTrail
          </Link>
          <form className="hidden max-w-xl flex-1 items-center md:flex" onSubmit={(event) => {
            event.preventDefault();
            router.push(`/hospital/search${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
          }}>
            <div className="flex w-full items-center rounded-lg bg-slate-100 px-4 py-2 text-slate-500 transition hover:bg-slate-200 focus-within:bg-slate-200">
              <Search className="mr-2 h-4 w-4 shrink-0" />
              <input value={search} onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patients..." aria-label="Search patients"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500" />
              <span className="ml-3 flex items-center gap-1 text-xs font-medium"><Command className="h-3 w-3" /> K</span>
            </div>
          </form>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={() => router.push("/hospital/search")} aria-label="Search patients" className="p-2 text-slate-400 hover:text-emerald-600 md:hidden">
              <Search className="h-5 w-5" />
            </button>
            <div className="relative">
              <button type="button" onClick={() => setAvatarOpen(!avatarOpen)} aria-label="Open account menu"
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-emerald-100 font-bold text-emerald-700 outline-none transition hover:ring-2 hover:ring-emerald-300">
                {(user.name || "D").slice(0, 2).toUpperCase()}
              </button>
              {avatarOpen && <>
                <button type="button" aria-label="Close account menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setAvatarOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-100 bg-white py-1 shadow-lg">
                  <div className="mb-1 border-b border-slate-50 px-4 py-2">
                    <div className="truncate text-sm font-semibold text-slate-800">{user.name}</div>
                    <div className="truncate text-xs text-slate-500">{user.email}</div>
                    <div className="mt-1 text-xs capitalize text-slate-500">{user.role.replaceAll("_", " ")}</div>
                  </div>
                  <Link href="/hospital/settings" onClick={() => setAvatarOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600">Organization settings</Link>
                  <button onClick={signOut} className="mt-1 block w-full border-t border-slate-50 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">Sign out</button>
                </div>
              </>}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-slate-200 bg-white p-2 pb-safe md:hidden">
        {nav.slice(0, 4).map((item) => {
          const active = pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={`flex flex-col items-center rounded-lg p-2 ${active ? "text-emerald-600" : "text-slate-500"}`}>
            <item.icon className="mb-1 h-5 w-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>;
        })}
      </nav>
    </div>
  );
}
