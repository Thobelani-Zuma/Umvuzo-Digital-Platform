import React from 'react';
import { Page } from '../types';
import { DashboardIcon, TransactionIcon, ReportIcon, LogoutIcon, LogoIcon } from './icons/Icons';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  onLogout: () => void;
}

const navItems = [
  { id: Page.Dashboard, label: 'Dashboard', icon: DashboardIcon },
  { id: Page.Transactions, label: 'Log Transaction', icon: TransactionIcon },
  { id: Page.Reports, label: 'Reports', icon: ReportIcon },
];

export function Sidebar({ activePage, setActivePage, onLogout }: SidebarProps) {
  return (
    <aside className="w-full h-full bg-brand-green text-white flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-white/20">
        <LogoIcon className="h-10 w-10 text-brand-orange" />
        <h1 className="text-2xl font-bold">Umvuzo</h1>
      </div>
      <nav className="flex-1 px-2 py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActivePage(item.id)}
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
  );
}