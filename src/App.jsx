import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import TaskDetailDrawer from './components/common/TaskDetailDrawer';
import RoleGuard from './components/common/RoleGuard';
import { dataService } from './services/dataService';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import TaskBoard from './pages/TaskBoard';
import Backlog from './pages/Backlog';
import SprintPlanning from './pages/SprintPlanning';
import SprintBoard from './pages/SprintBoard';
import Resources from './pages/Resources';
import Hiring from './pages/Hiring';
import Reports from './pages/Reports';
import Budget from './pages/Budget';
import Users from './pages/Users';
import { useAuthStore } from './store/authStore';

function AppContent() {
  const { isAuthenticated, reloadUsers } = useAuthStore();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const [isSyncing, setIsSyncing] = useState(true);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    const syncData = async () => {
      await dataService.syncFromSupabase();
      await dataService.syncUsersFromSupabase();
      reloadUsers();
      setIsSyncing(false);
    };
    syncData();
  }, [reloadUsers]);

  if (isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center p-8 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm w-full text-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-850"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold mb-2">Connecting to Database</h2>
          <p className="text-sm text-slate-400">Synchronizing tracker changes across devices...</p>
        </div>
      </div>
    );
  }

  // Enforce redirection to login screen if not authenticated
  if (!isAuthenticated && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  // Enforce redirection to home if already authenticated and accessing login screen
  if (isAuthenticated && isLoginPage) {
    return <Navigate to="/" replace />;
  }

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-200 transition-colors duration-150">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Topbar: Handles role switching, theme toggle, notifications, global search */}
        <Topbar onOpenTaskDrawer={setActiveTask} />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-7xl mx-auto h-full">
            <Routes>
              {/* Core directories */}
              <Route path="/" element={<Dashboard onOpenTaskDrawer={setActiveTask} />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/task-board" element={<TaskBoard onOpenTaskDrawer={setActiveTask} />} />
              <Route path="/backlog" element={<Backlog onOpenTaskDrawer={setActiveTask} />} />
              <Route path="/sprint-planning" element={<SprintPlanning />} />
              <Route path="/sprint-board" element={<SprintBoard onOpenTaskDrawer={setActiveTask} />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/hiring" element={<Hiring />} />
              <Route path="/reports" element={<Reports />} />
              
              {/* Strictly Admin + Stakeholder guarded route */}
              <Route 
                path="/budget" 
                element={
                  <RoleGuard allowedRoles={['Admin', 'Stakeholder']}>
                    <Budget />
                  </RoleGuard>
                } 
              />

              {/* Strictly Admin guarded route */}
              <Route 
                path="/users" 
                element={
                  <RoleGuard allowedRoles={['Admin']}>
                    <Users />
                  </RoleGuard>
                } 
              />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Global Task details side drawer */}
      <TaskDetailDrawer 
        task={activeTask} 
        isOpen={activeTask !== null} 
        onClose={() => setActiveTask(null)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
