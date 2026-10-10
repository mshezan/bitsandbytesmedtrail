with open("web/app/hospital/layout.tsx", "r") as f:
    content = f.read()

import re

# Fix lucide-react import
content = re.sub(r'import \{\n  Stethoscope, LayoutDashboard, Search, Inbox, Settings, Command,\n\} from "lucide-react";', 
                 'import { Stethoscope, LayoutDashboard, Search, Inbox, Settings, Command, Bell, Activity, UserPlus, BarChart2, Zap, History } from "lucide-react";', 
                 content)

with open("web/app/hospital/layout.tsx", "w") as f:
    f.write(content)
