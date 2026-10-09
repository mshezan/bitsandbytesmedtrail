import re

with open("web/components/Shell.tsx", "r") as f:
    content = f.read()

# Replace imports to include what we need
content = re.sub(
    r"import { usePathname } from 'next/navigation';",
    "import { usePathname, useRouter } from 'next/navigation';\nimport { fetchAPI, clearToken } from '@/lib/api';",
    content
)

# We need to inject user fetching and state into the Shell component.
# Let's find: export function Shell({ children }: { children: React.ReactNode }) {
shell_start = content.find("export function Shell")
# Actually, the signature might differ. Let's find the start of the function body.
search_str = "const pathname = usePathname();"
idx = content.find(search_str)

injection = """
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchAPI('/me').then(res => {
      if (res && res.user) {
        setUser(res.user);
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
"""
content = content.replace(search_str, injection)

# Fix Avatar and Search Button
avatar_html = """
            <button className="p-2 text-slate-400 hover:text-emerald-600 md:hidden" onClick={() => setCmdOpen(true)}><Search className="h-5 w-5" /></button>
            <div className="relative">
                <button onClick={() => setAvatarOpen(!avatarOpen)} className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold hover:ring-2 ring-emerald-300 transition outline-none">
                  {user ? (user.name || 'U').substring(0,2).toUpperCase() : 'SJ'}
                </button>
                {avatarOpen && (
                  <>
                  <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 z-50 py-1">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                       <div className="font-semibold text-slate-800 text-sm truncate">{user ? user.name : 'Sarah Jones'}</div>
                       <div className="text-xs text-slate-500 capitalize">{user ? user.role : 'Patient'}</div>
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600">My profile</Link>
                    <Link href="/share" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600">Sharing & access</Link>
                    <Link href="/emergency" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600">Emergency card</Link>
                    <button onClick={handleSignOut} className="w-full text-left block px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 border-t border-slate-50 mt-1">Sign out</button>
                  </div>
                  </>
                )}
            </div>
"""
# We replace the old hardcoded avatar div.
old_avatar = """<button className="p-2 text-slate-400 hover:text-emerald-600 md:hidden" onClick={() => setCmdOpen(true)}><Search className="h-5 w-5" /></button>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              SJ
            </div>"""
content = content.replace(old_avatar, avatar_html)

# Add Cmd+K Palette UI at the bottom of the Shell
cmd_palette_html = """
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
                    router.push('/timeline?q=' + encodeURIComponent(searchQuery));
                    setCmdOpen(false);
                  }
                }}
              />
              <div className="px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold text-slate-400">ESC</div>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
               <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Actions</div>
               <button onClick={() => { router.push('/handover'); setCmdOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-3">
                 <Send className="h-4 w-4 text-emerald-600" /> Generate Handover Packet
               </button>
               <button onClick={() => { router.push('/connect'); setCmdOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-3">
                 <PlusCircle className="h-4 w-4 text-blue-600" /> Connect New Source
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"""
content = content.replace("    </div>\n  );\n}", cmd_palette_html)

# Fix Greeting name
old_greeting = '<h1 className="text-2xl font-bold text-slate-900">Good morning, Sarah</h1>'
new_greeting = '<h1 className="text-2xl font-bold text-slate-900">Good morning, {user ? user.name.split(" ")[0] : "Sarah"}</h1>'
content = content.replace(old_greeting, new_greeting)

with open("web/components/Shell.tsx", "w") as f:
    f.write(content)
