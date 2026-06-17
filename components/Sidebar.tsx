import React from 'react';
import { Page } from '../types';
import { DashboardIcon, TransactionIcon, ReportIcon, LogoutIcon, LogoIcon } from './icons/Icons';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
  { id: Page.Dashboard, label: 'Dashboard', icon: DashboardIcon },
  { id: Page.Transactions, label: 'Log Transaction', icon: TransactionIcon },
  { id: Page.Reports, label: 'Reports', icon: ReportIcon },
];

export function Sidebar({ activePage, setActivePage, onLogout, isOpen, setIsOpen }: SidebarProps) {
  const handleNavigation = (page: Page) => {
    setActivePage(page);
    setIsOpen(false);
  };

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
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.id)}
                  className={`flex items-center w-full text-left p-3 my-1 rounded-lg transition-colors duration-200 ${
                    activePage === item.id
                      ? 'bg-brand-orange text-white shadow-md'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <item.icon className="h-6 w-6 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
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