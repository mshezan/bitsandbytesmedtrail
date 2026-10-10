with open("web/app/hospital/layout.tsx", "r") as f:
    content = f.read()

content = content.replace("if (!user) return <div className=\"min-h-screen bg-slate-50 animate-pulse\" />;", 
"""if (!user) return <div className="min-h-screen bg-slate-50 animate-pulse" />;
  
  if (pathname.includes('/consult')) {
    return <>{children}</>;
  }""")

with open("web/app/hospital/layout.tsx", "w") as f:
    f.write(content)
