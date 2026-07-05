import React, { useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useResourceStore } from '../store/resourceStore';
import { useSprintStore } from '../store/sprintStore';
import { useAuthStore } from '../store/authStore';
import { canViewBudget } from '../utils/permissionUtils';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  BarChart3, 
  Table, 
  FileSpreadsheet, 
  TrendingUp, 
  Clock, 
  DollarSign 
} from 'lucide-react';

export default function Reports() {
  const currentRole = useAuthStore(state => state.currentRole);
  const currentUser = useAuthStore(state => state.currentUser);

  const { tasks, fetchTasks } = useTaskStore();
  const { projects, modules, fetchProjects } = useProjectStore();
  const { resources, fetchResources } = useResourceStore();
  const { sprints, fetchSprints } = useSprintStore();

  useEffect(() => {
    fetchTasks(currentRole, currentUser);
    fetchProjects(currentRole);
    fetchResources(currentRole);
    fetchSprints();
  }, [currentRole, currentUser]);

  const showBudget = canViewBudget(currentRole);

  // Chart Data: Dynamic Sprint Velocity (Completed Story Points in previous Sprints)
  const velocityData = sprints.map(s => {
    const sprintTasks = tasks.filter(t => t.sprintId === s.id);
    const completedSP = sprintTasks
      .filter(t => t.status === 'Done')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    
    return {
      name: s.name,
      'Story Points Completed': completedSP,
      'Velocity (Target)': 30
    };
  });

  // Dynamic Cumulative Flow Diagram Data (group by Project status)
  const cfdData = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.id);
    return {
      name: p.name,
      'Not Started': pTasks.filter(t => t.status === 'Not Started').length,
      'In Progress': pTasks.filter(t => t.status === 'In Progress').length,
      'Blocked': pTasks.filter(t => t.status === 'Blocked').length,
      'Done': pTasks.filter(t => t.status === 'Done').length,
    };
  });

  // Dynamic Capacity Load
  const capacityLoad = resources.map(res => {
    const resTasks = tasks.filter(t => t.resourceName === res.name);
    const totalPlanned = resTasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0);
    const percentage = Math.min(Math.round((totalPlanned / 40) * 100), 200);
    return {
      name: res.name,
      role: res.role,
      planned: totalPlanned,
      percentage
    };
  });

  // Resource Pivot Table Calculations
  const resourceSummary = resources.map(res => {
    // Filter tasks for this resource
    const resTasks = tasks.filter(t => t.resourceName === res.name);
    
    // Project-wise hours breakdown
    const projectHours = {};
    projects.forEach(p => {
      const pTasks = resTasks.filter(t => t.projectId === p.id);
      projectHours[p.id] = {
        planned: pTasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0),
        actual: pTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
      };
    });

    const totalPlanned = resTasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0);
    const totalActual = resTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    
    // Admin cost calculation
    const totalCost = totalActual * (res.hourlyRate || 50);

    return {
      id: res.id,
      name: res.name,
      role: res.role,
      projectHours,
      totalPlanned,
      totalActual,
      totalCost
    };
  });

  // Project Pivot Table Calculations
  const projectSummary = projects.map(proj => {
    const projModules = modules.filter(m => m.projectId === proj.id);
    const totalModules = projModules.length;
    const completedModules = projModules.filter(m => m.status === 'Complete').length;

    const projTasks = tasks.filter(t => t.projectId === proj.id);
    const totalSP = projTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedSP = projTasks.filter(t => t.status === 'Done').reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const totalPlannedHours = projTasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0);
    const totalActualHours = projTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    // Sum resource costs dynamically for admin
    const actualCost = projTasks.reduce((sum, t) => {
      const res = resources.find(r => r.name === t.resourceName);
      const rate = res ? (res.hourlyRate || 50) : 50;
      return sum + (t.actualHours || 0) * rate;
    }, 0);

    const plannedCost = projTasks.reduce((sum, t) => {
      const res = resources.find(r => r.name === t.resourceName);
      const rate = res ? (res.hourlyRate || 50) : 50;
      return sum + (t.plannedHours || 0) * rate;
    }, 0);

    return {
      id: proj.id,
      name: proj.name,
      client: proj.client,
      totalModules,
      completedModules,
      totalSP,
      completedSP,
      totalPlannedHours,
      totalActualHours,
      plannedCost,
      actualCost,
      variance: plannedCost - actualCost
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">Analytical Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor sprint velocity performance, resource load matrices, and project deliverables.
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sprint Velocity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[300px] transition-colors duration-150">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Sprint Velocity (Story Points)</h3>
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <TrendingUp size={12} className="text-blue-500" />
              Completed SP per Sprint
            </span>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={velocityData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#fff', 
                    fontSize: '12px' 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Story Points Completed" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Velocity (Target)" fill="#93c5fd" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deliverables Overview KPI Card */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-colors duration-150">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase tracking-wider mb-3">Velocity Summary</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Our target team velocity is stabilized at <strong>30 story points</strong> per 2-week sprint. Over the last few sprints, we achieved a peak output of completed story points driven by VR module completions.
            </p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Average Velocity:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {velocityData.length ? Math.round(velocityData.reduce((sum, v) => sum + v['Story Points Completed'], 0) / velocityData.length) : 0} SP
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Commitment Reliability:</span>
              <span className="font-bold text-green-600">96.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Resource Availability:</span>
              <span className="font-bold text-slate-900 dark:text-white">100% Staffed</span>
            </div>
          </div>
        </div>

        {/* Cumulative Flow Diagram */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[300px] transition-colors duration-150">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Cumulative Flow Diagram</h3>
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <TrendingUp size={12} className="text-blue-500" />
              Work Item Status Flow by Project
            </span>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={cfdData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#fff', 
                    fontSize: '12px' 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="Done" stackId="1" stroke="#10b981" fill="#10b981" opacity={0.6} />
                <Area type="monotone" dataKey="In Progress" stackId="1" stroke="#3b82f6" fill="#3b82f6" opacity={0.6} />
                <Area type="monotone" dataKey="Blocked" stackId="1" stroke="#ef4444" fill="#ef4444" opacity={0.6} />
                <Area type="monotone" dataKey="Not Started" stackId="1" stroke="#64748b" fill="#64748b" opacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity Heatmap card */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-colors duration-150">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3">Resource Capacity Heatmap</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Calculated load relative to a standard 40h work week. Red indicates over-allocation warnings.
            </p>
            
            <div className="space-y-3.5 max-h-[180px] overflow-y-auto pr-1">
              {capacityLoad.map(res => {
                const color = res.percentage > 100 
                  ? 'text-red-500 bg-red-500' 
                  : res.percentage >= 80 
                    ? 'text-amber-500 bg-amber-500' 
                    : 'text-emerald-500 bg-emerald-500';
                const textColor = res.percentage > 100 
                  ? 'text-red-500' 
                  : res.percentage >= 80 
                    ? 'text-amber-550' 
                    : 'text-emerald-600 dark:text-emerald-400';

                return (
                  <div key={res.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300">{res.name}</span>
                      <span className={`font-bold ${textColor}`}>{res.planned}h ({res.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden border border-slate-200/20">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${color.split(' ')[1]}`} 
                        style={{ width: `${Math.min(res.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Resource loading pivot matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-150">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Table size={15} className="text-blue-500" />
            Resource Workload Matrix (Pivot)
          </h3>
          <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold uppercase">Hours Allocated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
                <th className="px-6 py-3.5">Resource</th>
                {projects.map(p => (
                  <th key={p.id} className="px-4 py-3.5 text-center">{p.name} (Plan/Act)</th>
                ))}
                <th className="px-6 py-3.5 text-center">Total Planned</th>
                <th className="px-6 py-3.5 text-center">Total Actual</th>
                {showBudget && <th className="px-6 py-3.5">Total Cost</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {resourceSummary.map(res => (
                <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {res.name}
                    <span className="text-[10px] text-slate-405 block font-normal">{res.role}</span>
                  </td>
                  {projects.map(p => {
                    const hrs = res.projectHours[p.id] || { planned: 0, actual: 0 };
                    return (
                      <td key={p.id} className="px-4 py-4 text-center font-medium">
                        <span className="text-slate-500">{hrs.planned}h</span>
                        <span className="text-slate-300 dark:text-slate-700 mx-1">/</span>
                        <span className="font-bold text-slate-800 dark:text-slate-205">{hrs.actual}h</span>
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center font-semibold text-slate-600 dark:text-slate-400">{res.totalPlanned} hrs</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">{res.totalActual} hrs</td>
                  {showBudget && (
                    <td className="px-6 py-4 font-extrabold text-blue-600 dark:text-blue-400">
                      ₹{res.totalCost.toLocaleString()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Status summary matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-150">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Table size={15} className="text-blue-500" />
            Project Performance Summary
          </h3>
          <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold uppercase">Sprint & Story Point Aggregates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
                <th className="px-6 py-3.5">Project</th>
                <th className="px-6 py-3.5 text-center">Modules Done</th>
                <th className="px-6 py-3.5 text-center">Velocity SP</th>
                <th className="px-6 py-3.5 text-center">Hours Spent</th>
                {showBudget && (
                  <>
                    <th className="px-6 py-3.5">Planned Cost</th>
                    <th className="px-6 py-3.5">Actual Cost</th>
                    <th className="px-6 py-3.5">Variance</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {projectSummary.map(proj => (
                <tr key={proj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {proj.name}
                    <span className="text-[10px] text-slate-405 block font-normal">{proj.client}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-slate-800 dark:text-white">{proj.completedModules}</span>
                    <span className="text-slate-400"> / {proj.totalModules}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600 dark:text-blue-400">
                    {proj.completedSP} <span className="text-slate-400 font-normal">/ {proj.totalSP} SP</span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-950 dark:text-slate-300">
                    {proj.totalActualHours} hrs
                  </td>
                  {showBudget && (
                    <>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-400">₹{proj.plannedCost.toLocaleString()}</td>
                      <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">₹{proj.actualCost.toLocaleString()}</td>
                      <td className={`px-6 py-4 font-bold ${proj.variance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {proj.variance >= 0 ? '+' : ''}₹{proj.variance.toLocaleString()}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
