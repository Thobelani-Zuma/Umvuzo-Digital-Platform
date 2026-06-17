import React from 'react';
import { AdminIcon, LogoutIcon, LogoIcon } from './icons/Icons';

interface AdminSidebarProps {
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AdminSidebar({ onLogout, isOpen, setIsOpen }: AdminSidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>
      <aside
        className={`w-64 bg-brand-green text-white flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
    </>
  );
}