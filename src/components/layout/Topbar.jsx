import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { useTaskStore } from '../../store/taskStore';
import { useSprintStore } from '../../store/sprintStore';
import { useResourceStore } from '../../store/resourceStore';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  ChevronDown, 
  User, 
  Folder, 
  CheckSquare, 
  Users, 
  TrendingUp, 
  X,
  AlertTriangle,
  MessageSquare,
  Play
} from 'lucide-react';
import Avatar from '../common/Avatar';

export default function Topbar({ onOpenTaskDrawer }) {
  const navigate = useNavigate();
  const { currentRole, currentUser, setRole } = useAuthStore();
  const { projects } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { sprints } = useSprintStore();
  const { resources, fetchResources } = useResourceStore();

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const searchRef = useRef(null);
  const roleRef = useRef(null);
  const notifyRef = useRef(null);

  // Mock Notifications list
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'blocker',
      title: 'Blocker Flagged',
      desc: 'Jana flagged a blocker on "Verify control panel dial rotation values"',
      time: '10m ago',
      unread: true,
      icon: AlertTriangle,
      color: 'text-red-500 bg-red-50 dark:bg-red-950/20'
    },
    {
      id: 2,
      type: 'comment',
      title: 'New Comment',
      desc: 'Admin commented on "Debug latency spike"',
      time: '1h ago',
      unread: true,
      icon: MessageSquare,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20'
    },
    {
      id: 3,
      type: 'sprint',
      title: 'Sprint Started',
      desc: 'Sprint 12 has been set to Active',
      time: '2d ago',
      unread: false,
      icon: Play,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target)) {
        setShowRoleDropdown(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Global search filtering
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = [];

    // Projects
    projects.forEach(p => {
      if (p.name.toLowerCase().includes(query) || p.client.toLowerCase().includes(query)) {
        results.push({ id: p.id, type: 'project', title: p.name, subtitle: `Project • ${p.client}`, path: `/projects` });
      }
    });

    // Tasks
    tasks.forEach(t => {
      if (t.description.toLowerCase().includes(query) || t.id.toLowerCase().includes(query)) {
        results.push({ id: t.id, type: 'task', title: t.description, subtitle: `Task • ${t.id} (${t.status})`, rawData: t });
      }
    });

    // Resources
    resources.forEach(r => {
      if (r.name.toLowerCase().includes(query) || r.role.toLowerCase().includes(query)) {
        results.push({ id: r.id, type: 'resource', title: r.name, subtitle: `Resource • ${r.role}`, path: '/resources' });
      }
    });

    // Sprints
    sprints.forEach(s => {
      if (s.name.toLowerCase().includes(query)) {
        results.push({ id: s.id, type: 'sprint', title: s.name, subtitle: `Sprint • ${s.status}`, path: '/sprint-planning' });
      }
    });

    setSearchResults(results.slice(0, 8)); // Limit to 8 results
  }, [searchQuery, projects, tasks, resources, sprints]);

  const handleSelectResult = (res) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    if (res.type === 'task') {
      if (onOpenTaskDrawer) {
        onOpenTaskDrawer(res.rawData);
      }
    } else {
      navigate(res.path);
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
      
      {/* Left: Global Search */}
      <div ref={searchRef} className="relative w-96 max-w-lg">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search projects, tasks, resources..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 text-slate-900 dark:text-slate-200"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              Search Results
            </div>
            <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.map((res) => (
                <li key={`${res.type}-${res.id}`}>
                  <button
                    onClick={() => handleSelectResult(res)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-3 transition-colors text-slate-900 dark:text-slate-200"
                  >
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                      {res.type === 'project' && <Folder size={16} />}
                      {res.type === 'task' && <CheckSquare size={16} />}
                      {res.type === 'resource' && <Users size={16} />}
                      {res.type === 'sprint' && <TrendingUp size={16} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium truncate max-w-xs">{res.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{res.subtitle}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        
        {/* Mock Role Selector (Admin / Manager / Team Member / Stakeholder) */}
        <div ref={roleRef} className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/50 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-400 transition-colors"
          >
            <span>Role: {currentRole}</span>
            <ChevronDown size={14} />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 py-1 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
                Select user role to test permissions
              </div>
              <div className="py-1">
                {[
                  { name: 'Admin', user: 'Admin' },
                  { name: 'Manager', user: 'Manager' },
                  { name: 'Team Member', user: 'Team Member' },
                  { name: 'Stakeholder', user: 'Stakeholder' }
                ].map((roleObj) => (
                  <button
                    key={roleObj.name}
                    onClick={() => {
                      setRole(roleObj.name, roleObj.user);
                      setShowRoleDropdown(false);
                      // Trigger data reload depending on components
                      fetchTasks(roleObj.name, roleObj.user);
                      fetchResources(roleObj.name);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${
                      currentRole === roleObj.name ? 'text-blue-600 font-semibold dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{roleObj.name}</span>
                    <span className="text-[10px] text-slate-400 italic">({roleObj.user})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifyRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              // Mark all read when opening
              if (!showNotifications) markAllAsRead();
            }}
            className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
                <div className="flex gap-2">
                  <button 
                    onClick={clearNotifications}
                    className="text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => {
                    const IconComp = n.icon;
                    return (
                      <div 
                        key={n.id} 
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex gap-3 ${n.unread ? 'bg-blue-50/20' : ''}`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${n.color}`}>
                          <IconComp size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {n.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <Avatar name={currentUser} size="sm" />
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[100px]" title={currentUser}>
              {currentUser}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
              {currentRole}
            </div>
          </div>
        </div>

      </div>

    </header>
  );
}
