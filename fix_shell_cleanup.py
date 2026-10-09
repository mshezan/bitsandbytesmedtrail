import re

with open("web/components/Shell.tsx", "r") as f:
    content = f.read()

# 1. Remove the subagent's cmdOpen state and useEffect
subagent_code = """  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);"""
content = content.replace(subagent_code, "")

# 2. Remove the subagent's Cmd+K Modal Placeholder
subagent_modal = """      {/* Cmd+K Modal Placeholder */}
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
      )}"""
content = content.replace(subagent_modal, "")

with open("web/components/Shell.tsx", "w") as f:
    f.write(content)
