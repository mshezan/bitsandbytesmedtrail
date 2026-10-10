with open("web/app/profile/page.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<div><label className="text-xs text-slate-500">Emergency Contact</label><div className="font-medium text-slate-800">{user.patient.emergency}</div></div>',
    '<div><label className="text-xs text-slate-500">Emergency Contact</label><div className="font-medium text-slate-800">{user.patient.emergency}</div></div>\n               <div><label className="text-xs text-slate-500">ABHA Number</label><div className="font-medium text-slate-800">{user.patient.abha_number}</div></div>\n               <div><label className="text-xs text-slate-500">ABHA Address</label><div className="font-medium text-slate-800">{user.patient.abha_address}</div></div>\n               <div><label className="text-xs text-slate-500">Insurance</label><div className="font-medium text-slate-800">{user.patient.insurance}</div></div>'
)

with open("web/app/profile/page.tsx", "w") as f:
    f.write(content)
