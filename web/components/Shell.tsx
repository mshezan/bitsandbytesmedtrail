'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { fetchAPI, clearToken } from '@/lib/api';
import { 
  Home, Clock, Calendar as CalendarIcon, Pill, FlaskConical, Stethoscope, Search, Command, Share2, ShieldAlert, FileText, Send, Lightbulb, PlusCircle, ClipboardList, LockKeyhole, Flag, Bell, Trash2
} from 'lucide-react';


const navGroups = [
  {
    title: "Care",
    items: [
      { name: 'Overview', href: '/patient/home', icon: Home },
      { name: 'Calendar', href: '/patient/calendar', icon: CalendarIcon },
      { name: 'Timeline', href: '/patient/timeline', icon: Clock },
      { name: 'Records', href: '/patient/records', icon: FileText },
      { name: 'Medications', href: '/patient/medications', icon: Pill },
      { name: 'Labs', href: '/patient/labs', icon: FlaskConical },
      { name: 'Providers', href: '/patient/providers', icon: Stethoscope },
    ]
  },
  {
    title: "Sharing & Care",
    items: [
      { name: 'Share & Access', href: '/patient/share', icon: Share2 },
      { name: 'Emergency Card', href: '/patient/emergency', icon: ShieldAlert },
      { name: 'Handover', href: '/patient/handover', icon: Send },
      { name: 'Request record removal', href: '/patient/privacy', icon: Trash2 },
    ]
  },
  {
    title: "Me",
    items: [
      { name: 'Self-reported', href: '/patient/self-reported', icon: ClipboardList },
      { name: 'Notifications', href: '/patient/notifications', icon: Bell },
    ]
  }
];


export function Shell({ children }: { children: React.ReactNode }) {
  
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  

  useEffect(() => {
    fetchAPI('/me').then(res => {
      if (res && res.user) {
        setUser({...res.user, profile_photo_url: res.patient?.profile_photo_url});
        if (res.user.role === 'hospital_staff' && !pathname.startsWith('/hospital') && !pathname.startsWith('/shared')) {
           router.push('/hospital/dashboard');
        }
      }
    }).catch(err => {
      if (pathname !== '/login') {
        clearToken();
        router.push('/login');
      }
    });
  }, [pathname]);

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setAvatarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = () => {
    clearToken();
    router.push('/login');
  };



  return (
    <div className="flex h-screen bg-[#f8f9fa] text-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white">
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center space-x-2 text-emerald-700">
          <Stethoscope className="h-6 w-6" />
          <span className="font-bold text-xl tracking-tight">MedTrail</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{group.title}</h3>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link key={item.name} href={item.href} className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between z-50 shrink-0 shadow-sm relative">
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
            <div className="relative">
                <button onClick={() => setAvatarOpen(!avatarOpen)} className="h-8 w-8 overflow-hidden rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold hover:ring-2 ring-emerald-300 transition outline-none">
                  {user?.profile_photo_url ? <img src={user.profile_photo_url} alt="Profile" className="h-full w-full object-cover"/> : user ? (user.name || 'U').substring(0,2).toUpperCase() : 'SJ'}
                </button>
                {avatarOpen && (
                  <>
                  <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 z-50 py-1">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                       <div className="font-semibold text-slate-800 text-sm truncate">{user ? user.name : 'Sarah Jones'}</div>
                       <div className="text-xs text-slate-500 capitalize">{user ? user.role : 'Patient'}</div>
                    </div>
                    <Link href="/patient/profile" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600">My profile</Link>
                    <Link href="/patient/share" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600">Sharing & access</Link>
                    <Link href="/patient/emergency" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600">Emergency card</Link>
                    <button onClick={handleSignOut} className="w-full text-left block px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 border-t border-slate-50 mt-1">Sign out</button>
                  </div>
                  </>
                )}
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
        {navGroups[0].items.slice(0, 5).map((item) => {
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



      {cmdOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setCmdOpen(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search records, medications, providers..." 
                className="flex-1 outline-none text-slate-800 bg-transparent placeholder:text-slate-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if(e.key === 'Enter' && searchQuery) {
                    router.push('/patient/timeline?q=' + encodeURIComponent(searchQuery));
                    setCmdOpen(false);
                  }
                }}
              />
              <div className="px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold text-slate-400">ESC</div>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
               <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Actions</div>
               <button onClick={() => { router.push('/patient/handover'); setCmdOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-3">
                 <Send className="h-4 w-4 text-emerald-600" /> Generate Handover Packet
               </button>
               <button onClick={() => { router.push('/patient/add'); setCmdOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-3">
                 <PlusCircle className="h-4 w-4 text-blue-600" /> Connect New Source
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
