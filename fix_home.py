import os

with open("web/app/home/page.tsx", "r") as f:
    content = f.read()

# I will inject fetchAPI into the component
content = content.replace("export default function Home() {", """
import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';

export default function Home() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetchAPI('/overview').then(setData).catch(console.error);
  }, []);
  
  if (!data) return <div className="p-8 text-slate-500">Loading...</div>;
""")

content = content.replace('value="42"', 'value={data.counts.records.toString()}')
content = content.replace('value="5"', 'value={data.counts.sources.toString()}')
content = content.replace('value="3"', 'value={data.needs_attention.length.toString()}')
content = content.replace('value="1"', 'value="0"')

with open("web/app/home/page.tsx", "w") as f:
    f.write(content)

