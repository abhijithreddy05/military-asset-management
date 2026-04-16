import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, ArrowRightLeft, ClipboardList, LogOut } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/purchases', label: 'Purchases', icon: <ShoppingCart size={20} />, roles: ['Admin', 'Logistics Officer'] },
    { to: '/transfers', label: 'Transfers', icon: <ArrowRightLeft size={20} />, roles: ['Admin', 'Base Commander'] },
    { to: '/assignments', label: 'Assignments', icon: <ClipboardList size={20} />, roles: ['Admin', 'Base Commander', 'Logistics Officer'] }
  ];

  return (
    <div className="w-64 bg-slate-800 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-700">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-2">
          Kristal<span className="text-blue-500">Ball</span>
        </h1>
        <p className="text-xs text-slate-500 mt-2 font-medium uppercase">{user?.role} Portal</p>
      </div>

      <nav className="flex-1 mt-6">
        {links.map((link) => {
          if (link.roles && !link.roles.includes(user?.role)) return null;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 font-medium transition-colors ${
                  isActive ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500' : 'hover:bg-slate-700/50 hover:text-white'
                }`
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-700">
        <div className="mb-4 text-sm text-slate-400">
          <p>Logged in as: <span className="text-slate-200">{user?.username}</span></p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
