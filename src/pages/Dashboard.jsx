import React, { useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';
import { useResourceStore } from '../store/resourceStore';
import { useAuthStore } from '../store/authStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Folder, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Users, 
  Briefcase, 
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import { formatDate } from '../utils/dateUtils';

export default function Dashboard({ onOpenTaskDrawer }) {
  const currentRole = useAuthStore(state => state.currentRole);
  const currentUser = useAuthStore(state => state.currentUser);
  
  const { projects, fetchProjects } = useProjectStore();
  const { tasks, fetchTasks, deliverables, fetchDeliverables } = useTaskStore();
  const { resources, fetchResources, hiringRequests, fetchHiringRequests } = useResourceStore();

  useEffect(() => {
    fetchProjects(currentRole);
    fetchTasks(currentRole, currentUser);
    fetchResources(currentRole);
    fetchHiringRequests();
    fetchDeliverables();
  }, [currentRole, currentUser]);

  // Calculations for KPIs
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  
  // Count modules that have blockers
  const blockedProjects = projects.filter(p => p.status === 'On Hold').length;

  const openHiringRequests = hiringRequests.filter(h => h.status !== 'Filled' && h.status !== 'Rejected').length;
  
  // Avg Resource Utilization
  const avgUtilization = resources.length > 0 
    ? Math.round(resources.reduce((sum, r) => sum + (r.utilizationPercent || 0), 0) / resources.length) 
    : 0;

  // Deliverables This Month
  const currentMonth = "July 2026"; // Mock Month
  const monthlyDeliverables = deliverables.filter(d => d.month === currentMonth).length;

  // Chart Data 1: Tasks by Status
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  const COLORS = {
    'Not Started': '#94a3b8', // slate-400
    'In Progress': '#3b82f6', // blue-500
    'Blocked': '#ef4444',     // red-500
    'Done': '#10b981'        // emerald-500
  };

  // Chart Data 2: Hours Planned vs Actual per Resource
  const barData = resources.map(res => {
    // Sum hours for this resource
    const resTasks = tasks.filter(t => t.resourceName === res.name);
    const planned = resTasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0);
    const actual = resTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    return {
      name: res.name,
      'Planned Hours': planned,
      'Actual Hours': actual
    };
  });

  // Chart Data 3: Project Progress (horizontal bar per project % complete)
  // Calculate average completion of modules under each project
  const projectProgressData = projects.map(proj => {
    return {
      name: proj.name,
      'Progress': proj.status === 'Completed' ? 100 : (proj.status === 'On Hold' ? 30 : 65) // Seed averages or dynamic calc
    };
  });

  // Recent activity: get tasks sorted by activity log timestamp
  const recentActivities = [];
  tasks.forEach(task => {
    if (task.activityLog) {
      task.activityLog.forEach(log => {
        recentActivities.push({
          taskId: task.id,
          taskDesc: task.description,
          task,
          ...log
        });
      });
    }
  });

  // Sort by timestamp desc
  const sortedActivities = recentActivities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm gap-4 transition-colors duration-150">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">
            Welcome back, <span className="text-blue-600 dark:text-blue-500">{currentUser}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's the VR/Unity operations status for today. You are viewing with the <strong>{currentRole}</strong> role.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-400">
          <Clock size={14} className="text-blue-500" />
          <span>Sprint 12 is Active</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* KPI 1: Active/Total Projects */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Projects</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Folder size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{activeProjects}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Active ({totalProjects} total)</span>
          </div>
        </div>

        {/* KPI 2: Completed / Blocked */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project Health</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{completedProjects}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Done / {blockedProjects} On Hold</span>
          </div>
        </div>

        {/* KPI 3: Avg Resource Utilization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Utilization</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold ${avgUtilization > 100 ? 'text-orange-600' : 'text-slate-900 dark:text-white'}`}>{avgUtilization}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Team Avg</span>
          </div>
        </div>

        {/* KPI 4: Hiring & Deliverables */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Operations</span>
            <div className="p-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-lg">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{monthlyDeliverables}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">July Deliverables ({openHiringRequests} Hires)</span>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Tasks by Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-1 flex flex-col h-[320px] transition-colors duration-150">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Tasks by Status</h2>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-slate-400 text-xs">No task data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none', 
                      borderRadius: '8px', 
                      color: '#fff', 
                      fontSize: '12px' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[entry.name] }} />
                <span className="text-slate-600 dark:text-slate-400 font-medium">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Resource Loading */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col h-[320px] transition-colors duration-150">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Weekly Effort Load per Resource</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#fff', 
                    fontSize: '12px' 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                <Bar dataKey="Planned Hours" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual Hours" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Row: Project Progress & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Project Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[360px] transition-colors duration-150">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Project Milestones Completed</h2>
          <div className="flex-1 overflow-y-auto space-y-4">
            {projectProgressData.map((p, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{p.Progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${p.Progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[360px] transition-colors duration-150">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Recent Operations Activity</h2>
          <div className="flex-1 overflow-y-auto pr-1">
            {sortedActivities.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 italic">No recent logs found</div>
            ) : (
              <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 pl-5 space-y-5">
                {sortedActivities.map((act, idx) => (
                  <div key={idx} className="relative group">
                    {/* Time icon dot */}
                    <span className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-50 dark:bg-blue-950 border-2 border-blue-500 flex items-center justify-center z-10 shrink-0">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    </span>
                    
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-white">{act.changedBy}</span>
                      <span className="text-slate-500 dark:text-slate-400"> updated </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{act.fieldChanged}</span>
                      <span className="text-slate-500 dark:text-slate-400"> to </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-300">"{act.newValue}"</span>
                    </div>

                    <button 
                      onClick={() => onOpenTaskDrawer(act.task)}
                      className="text-[11px] font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 mt-1 block truncate max-w-sm text-left hover:underline"
                    >
                      Task: {act.taskDesc}
                    </button>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {formatDate(act.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
