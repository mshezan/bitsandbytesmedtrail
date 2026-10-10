'use client';
import { usePathname } from 'next/navigation';
import { Shell } from './Shell';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/login' || pathname === '/' || pathname.startsWith('/hospital') || pathname.startsWith('/api')) {
    return <>{children}</>;
  }
  
  return <Shell>{children}</Shell>;
}
