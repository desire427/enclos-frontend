import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import AppHeader from '../common/AppHeader';
import AppFooter from '../common/AppFooter';
import api from '../../API/api';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!api.hasSession()) return <Navigate to="/connexion" replace />;

  return (
    <div className="w-full min-h-screen bg-white text-[#171310]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:ml-[220px] min-h-screen flex flex-col">
        <AppHeader onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
