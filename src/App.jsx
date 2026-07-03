import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import TaskDetailDrawer from './components/common/TaskDetailDrawer';
import RoleGuard from './components/common/RoleGuard';

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
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // State to manage the active task shown in the side drawer globally
  const [activeTask, setActiveTask] = useState(null);

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
