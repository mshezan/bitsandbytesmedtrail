with open("web/app/hospital/layout.tsx", "r") as f:
    content = f.read()

# Replace the generic "Inbox" or add it if missing
nav_replacement = """
  const nav = [
    { name: "Dashboard", href: "/hospital/home", icon: LayoutDashboard },
    { name: "Patient Search", href: "/hospital/search", icon: Search },
    { name: "Inbox & Orders", href: "/hospital/inbox", icon: Bell },
    { name: "Access History", href: "/hospital/access", icon: History },
    { name: "Integrations", href: "/hospital/settings", icon: Settings },
  ];
"""

import re
content = re.sub(r'const nav = \[.*?\];', nav_replacement.strip(), content, flags=re.DOTALL)

# Need to make sure Bell is imported
if "import { LayoutDashboard, Search, History, Settings, LogOut, Menu, Activity" not in content:
    content = content.replace('import { LayoutDashboard, Search, History, Settings, LogOut, Menu, Activity } from "lucide-react";', 'import { LayoutDashboard, Search, History, Settings, LogOut, Menu, Activity, Bell } from "lucide-react";')

with open("web/app/hospital/layout.tsx", "w") as f:
    f.write(content)
