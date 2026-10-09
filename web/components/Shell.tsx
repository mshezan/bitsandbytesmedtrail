'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Clock, Pill, FlaskConical, Stethoscope, Search, Command, Share2, ShieldAlert, FileText, Send, Lightbulb
} from 'lucide-react';

const navItems = [
  { name: 'Overview', href: '/home', icon: Home },
  { name: 'Timeline', href: '/timeline', icon: Clock },
  { name: 'Records', href: '/records', icon: FileText },
  { name: 'Medications', href: '/medications', icon: Pill },
  { name: 'Labs', href: '/labs', icon: FlaskConical },
  { name: 'Providers', href: '/providers', icon: Stethoscope },
  { name: 'Insights', href: '/insights', icon: Lightbulb },
  { name: 'Share & Access', href: '/share', icon: Share2 },
  { name: 'Emergency Card', href: '/emergency', icon: ShieldAlert },
  { name: 'Handover', href: '/handover', icon: Send },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white">
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center space-x-2 text-emerald-700">
          <Stethoscope className="h-6 w-6" />
          <span className="font-bold text-xl tracking-tight">MedTrail</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${active ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <item.icon className={`h-5 w-5 mr-3 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-4 md:hidden">
             <span className="font-bold text-emerald-700 flex items-center"><Stethoscope className="h-5 w-5 mr-1" /> MedTrail</span>
          </div>
          <div className="flex-1 max-w-xl hidden md:flex items-center">
            <button 
              onClick={() => setCmdOpen(true)}
              className="flex items-center w-full bg-slate-100 text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-200 transition"
            >
              <Search className="h-4 w-4 mr-2" />
              <span>Search everything...</span>
              <div className="ml-auto flex items-center space-x-1 text-xs font-medium">
                <Command className="h-3 w-3" />
                <span>K</span>
              </div>
            </button>
          </div>
          <div className="flex items-center space-x-3 ml-auto">
            <button className="p-2 text-slate-400 hover:text-emerald-600 md:hidden" onClick={() => setCmdOpen(true)}><Search className="h-5 w-5" /></button>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              SJ
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 pb-safe z-20">
        {navItems.slice(0, 5).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href}
              className={`flex flex-col items-center p-2 rounded-lg ${active ? 'text-emerald-600' : 'text-slate-500'}`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Cmd+K Modal Placeholder */}
      {cmdOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]" onClick={() => setCmdOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center border-b border-slate-100 p-3">
              <Search className="h-5 w-5 text-slate-400 mr-3" />
              <input type="text" autoFocus placeholder="Search conditions, meds, or notes..." className="flex-1 bg-transparent outline-none text-lg placeholder-slate-400" />
            </div>
            <div className="p-2 text-sm text-slate-500 text-center">
              No results found. (Mock search)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
