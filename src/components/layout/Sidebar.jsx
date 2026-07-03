import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { canViewBudget } from '../../utils/permissionUtils';
import { 
  Home, 
  Folder, 
  LayoutGrid, 
  Layers, 
  CalendarRange, 
  Compass, 
  Users, 
  Briefcase, 
  BarChart2, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import Logo from './Logo';

export default function Sidebar() {
  const currentRole = useAuthStore(state => state.currentRole);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home, roles: ['Admin', 'Manager', 'Team Member', 'Stakeholder'] },
    { name: 'Projects', path: '/projects', icon: Folder, roles: ['Admin', 'Manager', 'Team Member', 'Stakeholder'] },
    { name: 'Task Board', path: '/task-board', icon: LayoutGrid, roles: ['Admin', 'Manager', 'Team Member', 'Stakeholder'] },
    { name: 'Backlog', path: '/backlog', icon: Layers, roles: ['Admin', 'Manager', 'Team Member', 'Stakeholder'] },
    { name: 'Sprint Planning', path: '/sprint-planning', icon: CalendarRange, roles: ['Admin', 'Manager', 'Team Member', 'Stakeholder'] },
    { name: 'Sprint Board', path: '/sprint-board', icon: Compass, roles: ['Admin', 'Manager', 'Team Member', 'Stakeholder'] },
    { name: 'Resources', path: '/resources', icon: Users, roles: ['Admin', 'Manager', 'Team Member', 'Stakeholder'] },
    { name: 'Hiring & Skills', path: '/hiring', icon: Briefcase, roles: ['Admin', 'Manager', 'Team Member', 'Stakeholder'] },
    { name: 'Reports', path: '/reports', icon: BarChart2, roles: ['Admin', 'Manager', 'Team Member', 'Stakeholder'] },
    // Budget & Cost is Admin + Stakeholder only, completely hidden from others
    { name: 'Budget & Cost', path: '/budget', icon: DollarSign, roles: ['Admin', 'Stakeholder'] },
    // User Control Panel is Admin only
    { name: 'Users Control', path: '/users', icon: Shield, roles: ['Admin'] }
  ];

  // Filter based on roles
  const filteredNavItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside 
      className={`relative flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 h-16 px-5 border-b border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
        <Logo className="shrink-0" size={32} />
        {!isCollapsed && (
          <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight whitespace-nowrap animate-fade-in">
            Crion <span className="text-blue-600 dark:text-blue-500">VROTS</span>
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto px-3">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => {
              const base = "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-150 relative group";
              const active = "bg-blue-50/80 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-500 rounded-l-none pl-2";
              const inactive = "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60";
              return `${base} ${isActive ? active : inactive}`;
            }}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon size={20} className="shrink-0" />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
            
            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
              <div className="absolute left-16 scale-0 group-hover:scale-100 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded shadow-lg z-50 font-normal transition-all duration-100 whitespace-nowrap pointer-events-none">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-6 -right-3.5 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-40"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
