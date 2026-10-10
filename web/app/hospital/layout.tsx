"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAPI, clearToken } from "@/lib/api";
import { Users, Search, Activity, Settings, LayoutDashboard, LogOut, FilePlus } from "lucide-react";

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchAPI('/me').then(res => {
      if (res && res.user) {
        if (res.user.role !== 'hospital_staff') {
          router.push('/home');
        } else {
          setUser(res.user);
        }
      }
    }).catch(() => {
      clearToken();
      router.push('/login');
    });
  }, [pathname, router]);

  const nav = [
    { name: "Dashboard", href: "/hospital/dashboard", icon: LayoutDashboard },
    { name: "Patient Search", href: "/hospital/search", icon: Search },
    { name: "Add Records", href: "/hospital/add", icon: FilePlus },
    { name: "Access History", href: "/hospital/access", icon: Activity },
    { name: "Integrations", href: "/hospital/settings", icon: Settings },
  ];

  if (!user) return <div className="min-h-screen bg-slate-50 animate-pulse" />;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-white tracking-tight">
          Hospital Portal
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {nav.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => { clearToken(); router.push('/login'); }}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm z-10 justify-between">
           <div className="font-medium text-slate-700">Kaveri Multispeciality Hospital</div>
           <div className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-semibold">Live System</div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
