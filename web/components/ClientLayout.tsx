'use client';
import { usePathname } from 'next/navigation';
import { Shell } from './Shell';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }
  
  return <Shell>{children}</Shell>;
}
