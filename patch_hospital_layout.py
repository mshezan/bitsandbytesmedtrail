with open("web/app/hospital/layout.tsx", "r") as f:
    content = f.read()

import re

# Add the network icon import
content = content.replace('Command, Bell, Activity, UserPlus, BarChart2, Zap, History', 'Command, Bell, Activity, UserPlus, BarChart2, Zap, History, Network')

# Add the navigation item
new_nav = '{ name: "Integration Hub", href: "/hospital/integration", icon: Network },\n    { name: "Analytics", href: "/hospital/analytics", icon: BarChart2 },'
content = content.replace('{ name: "Analytics", href: "/hospital/analytics", icon: BarChart2 },', new_nav)

with open("web/app/hospital/layout.tsx", "w") as f:
    f.write(content)
