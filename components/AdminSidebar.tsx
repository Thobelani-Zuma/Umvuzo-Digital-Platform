import React from 'react';
import { AdminIcon, LogoutIcon, LogoIcon } from './icons/Icons';

interface AdminSidebarProps {
  onLogout: () => Promise<void>;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  return (
    <aside className="w-full h-full bg-brand-green text-white flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-white/20">
        <LogoIcon className="h-10 w-10 text-brand-orange" />
        <h1 className="text-2xl font-bold">Umvuzo</h1>
      </div>
      <nav className="flex-1 px-2 py-4">
        <ul>
            <li>
              <div className="flex items-center w-full text-left p-3 my-1 rounded-lg bg-brand-orange text-white shadow-md">
                <AdminIcon className="h-6 w-6 mr-3" />
                <span className="font-medium">Admin Dashboard</span>
              </div>
            </li>
        </ul>
      </nav>
      <div className="p-2 border-t border-white/20">
        <button
          onClick={onLogout}
          className="flex items-center w-full text-left p-3 rounded-lg hover:bg-red-600 transition-colors duration-200"
        >
          <LogoutIcon className="h-6 w-6 mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}