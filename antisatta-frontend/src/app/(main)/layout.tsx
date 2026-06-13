'use client';

import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, setUser } = useAuthStore();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/auth/me').then(res => {
        if (res.data?.data) {
          setUser(res.data.data);
        }
      }).catch(console.error);
    }
  }, [isAuthenticated, setUser]);

  if (isLoading || !isAuthenticated) return <div className="min-h-screen bg-white" />;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
      <div className="flex flex-1 pt-14">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <main className="flex-1 md:ml-56 px-4 md:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
