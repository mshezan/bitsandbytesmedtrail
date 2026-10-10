with open("web/app/hospital/layout.tsx", "r") as f:
    content = f.read()

nav_replacement = """
  const nav = [
    { name: "Dashboard", href: "/hospital/home", icon: LayoutDashboard },
    { name: "Patient Search", href: "/hospital/search", icon: Search },
    { name: "Inbox & Orders", href: "/hospital/inbox", icon: Bell },
    { name: "ER Triage", href: "/hospital/er", icon: Activity },
    { name: "Inpatients", href: "/hospital/inpatients", icon: UserPlus },
    { name: "Analytics", href: "/hospital/analytics", icon: BarChart2 },
    { name: "Insights", href: "/hospital/insights", icon: Zap },
    { name: "Access History", href: "/hospital/access", icon: History },
    { name: "Integrations", href: "/hospital/settings", icon: Settings },
  ];
"""

import re
content = re.sub(r'const nav = \[.*?\];', nav_replacement.strip(), content, flags=re.DOTALL)

if "BarChart2" not in content:
    content = content.replace('import { LayoutDashboard, Search, History, Settings, LogOut, Menu, Activity, Bell, UserPlus } from "lucide-react";', 'import { LayoutDashboard, Search, History, Settings, LogOut, Menu, Activity, Bell, UserPlus, BarChart2, Zap } from "lucide-react";')

with open("web/app/hospital/layout.tsx", "w") as f:
    f.write(content)
