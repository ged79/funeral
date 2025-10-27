'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from './components/AdminDashboard';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('is_authenticated');
    const funeralHomeId = sessionStorage.getItem('funeral_home_id');

    if (!isAuthenticated || !funeralHomeId) {
      router.push('/login');
    }
  }, [router]);

  return <AdminDashboard />;
}
