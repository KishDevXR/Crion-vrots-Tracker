import React, { useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useResourceStore } from '../store/resourceStore';
import { useAuthStore } from '../store/authStore';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';

export default function Budget() {
  const currentRole = useAuthStore(state => state.currentRole);
  const currentUser = useAuthStore(state => state.currentUser);

  const { tasks, fetchTasks } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { resources, fetchResources } = useResourceStore();

  useEffect(() => {
    fetchTasks(currentRole, currentUser);
    fetchProjects(currentRole);
    fetchResources(currentRole);
  }, [currentRole, currentUser]);

  // Aggregate project costs
  const projectSummary = projects.map(proj => {
    const projTasks = tasks.filter(t => t.projectId === proj.id);
    
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
      name: proj.name,
      'Planned Cost (₹)': plannedCost,
      'Actual Cost (₹)': actualCost,
      variance: plannedCost - actualCost
    };
  });

  // Calculate totals
  const totalPlannedCost = projectSummary.reduce((sum, p) => sum + p['Planned Cost (₹)'], 0);
  const totalActualCost = projectSummary.reduce((sum, p) => sum + p['Actual Cost (₹)'], 0);
  const totalVariance = totalPlannedCost - totalActualCost;

  // Monthly burn data (demo timeline)
  const burnRateData = [
    { month: 'Jan 2026', 'Burn Rate (₹)': 25000 },
    { month: 'Feb 2026', 'Burn Rate (₹)': 28500 },
    { month: 'Mar 2026', 'Burn Rate (₹)': 34000 },
    { month: 'Apr 2026', 'Burn Rate (₹)': 31200 },
    { month: 'May 2026', 'Burn Rate (₹)': 36700 },
    { month: 'Jun 2026', 'Burn Rate (₹)': 38400 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">Budget & Cost Operations</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Perform financial audit tracking on developer utilization rates, billing hours, and project cost variance.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* KPI 1: Planned Budget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Planned Budget</span>
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg font-bold text-slate-400">
              ₹
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">₹{totalPlannedCost.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 2: Actual Cost */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Actual Costs Spent</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg font-bold">
              ₹
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">₹{totalActualCost.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 3: Variance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Budget Variance</span>
            <div className={`p-1.5 rounded-lg ${totalVariance >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-red-50 dark:bg-red-950/40 text-red-600'}`}>
              {totalVariance >= 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold ${totalVariance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {totalVariance >= 0 ? '+' : ''}₹{totalVariance.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{totalVariance >= 0 ? 'Under budget' : 'Over budget'}</span>
          </div>
        </div>

        {/* KPI 4: Burn Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Monthly Burn</span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">₹38,400</span>
            <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">
              +4.6%
            </span>
          </div>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cost Variance per Project */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[280px] transition-colors duration-150">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">Planned vs Actual Cost per Project</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectSummary}
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
                <Bar dataKey="Planned Cost (₹)" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual Cost (₹)" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Burn Rate line graph */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[280px] transition-colors duration-150">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">Monthly Team Burn Rate trend</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={burnRateData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
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
                <Line type="monotone" dataKey="Burn Rate (₹)" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Itemized Projects Financial Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-150">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Itemized Project Budgets</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
                <th className="px-6 py-3.5">Project Name</th>
                <th className="px-6 py-3.5">Planned Cost</th>
                <th className="px-6 py-3.5">Actual Cost Spent</th>
                <th className="px-6 py-3.5">Variance</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {projectSummary.map((p, idx) => {
                const proj = projects[idx];
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {p.name}
                      <span className="text-[10px] text-slate-405 block font-normal">{proj?.client}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-400">₹{p['Planned Cost (₹)'].toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">₹{p['Actual Cost (₹)'].toLocaleString()}</td>
                    <td className={`px-6 py-4 font-bold ${p.variance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {p.variance >= 0 ? '+' : ''}₹{p.variance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.variance < 0 
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        {p.variance < 0 ? 'Overrun' : 'On Track'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
