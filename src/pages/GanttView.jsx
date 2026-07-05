import React, { useEffect, useRef, useState } from 'react';
import Gantt from 'frappe-gantt';
import 'frappe-gantt/dist/frappe-gantt.css';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { CalendarRange, Layers, Info } from 'lucide-react';
import Button from '../components/common/Button';

export default function GanttView() {
  const { projects, fetchProjects } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();
  const currentRole = useAuthStore(state => state.currentRole);
  const currentUser = useAuthStore(state => state.currentUser);

  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [viewMode, setViewMode] = useState('Week'); // Day, Week, Month
  const ganttContainerRef = useRef(null);
  const ganttInstance = useRef(null);

  useEffect(() => {
    fetchProjects(currentRole);
    fetchTasks(currentRole, currentUser);
  }, [currentRole, currentUser, fetchProjects, fetchTasks]);

  // Filter tasks based on selected project
  const filteredTasks = tasks.filter(t => {
    if (selectedProjectId === 'all') return true;
    return t.projectId === selectedProjectId;
  });

  useEffect(() => {
    if (!ganttContainerRef.current || filteredTasks.length === 0) {
      if (ganttInstance.current) {
        ganttContainerRef.current.innerHTML = '';
        ganttInstance.current = null;
      }
      return;
    }

    // Clear previous gantt elements
    ganttContainerRef.current.innerHTML = '';

    // Map tasks to frappe-gantt format
    const ganttTasks = filteredTasks.map(t => {
      // Ensure we have valid start/end dates
      const start = t.startDate || new Date().toISOString().split('T')[0];
      const end = t.endDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      return {
        id: t.id,
        name: t.description || 'Unnamed Task',
        start: start,
        end: end,
        progress: t.progressPercent || 0,
        dependencies: (t.dependencies || []).map(d => d.depends_on_id).join(','),
        custom_class: t.status === 'Done' ? 'gantt-done' : t.status === 'Blocked' ? 'gantt-blocked' : 'gantt-active'
      };
    });

    try {
      ganttInstance.current = new Gantt(ganttContainerRef.current, ganttTasks, {
        header_height: 50,
        column_width: 30,
        step: 24,
        view_modes: ['Day', 'Week', 'Month'],
        view_mode: viewMode,
        bar_height: 20,
        bar_corner_radius: 4,
        arrow_curve: 5,
        padding: 18,
        date_format: 'YYYY-MM-DD',
        custom_popup_html: function(task) {
          const t = tasks.find(x => x.id === task.id);
          return `
            <div class="p-3 bg-slate-900 border border-slate-800 text-white rounded-lg shadow-xl text-xs space-y-1">
              <p class="font-bold">${task.name}</p>
              <p class="text-slate-400">Progress: ${task.progress}%</p>
              <p class="text-slate-400">Assignee: ${t?.resourceName || 'Unassigned'}</p>
              <p class="text-slate-400">Status: ${t?.status || 'Not Started'}</p>
            </div>
          `;
        }
      });
    } catch (e) {
      console.error("Gantt rendering error:", e);
    }

    return () => {
      if (ganttInstance.current && ganttContainerRef.current) {
        ganttContainerRef.current.innerHTML = '';
      }
    };
  }, [filteredTasks, viewMode, tasks]);

  const changeViewMode = (mode) => {
    setViewMode(mode);
    if (ganttInstance.current) {
      ganttInstance.current.change_view_mode(mode);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarRange className="text-blue-500" />
            Project Gantt Chart
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visualize project timelines, task dependencies, and milestones.
          </p>
        </div>

        {/* View Mode controls */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-850">
          {['Day', 'Week', 'Month'].map(mode => (
            <button
              key={mode}
              onClick={() => changeViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === mode 
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between transition-colors duration-150">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Layers size={18} className="text-slate-400 shrink-0" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-sm font-semibold bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Info size={14} className="text-blue-500 shrink-0" />
          <span>Double-click or drag bars to manage dates inside the task drawer.</span>
        </div>
      </div>

      {/* Gantt Canvas Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-x-auto min-h-[400px] transition-colors duration-150">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic space-y-2">
            <Layers size={40} className="stroke-[1.5]" />
            <p>No tasks scheduled with start and due dates for this selection.</p>
          </div>
        ) : (
          <div className="gantt-wrapper w-full">
            <svg ref={ganttContainerRef} className="w-full"></svg>
          </div>
        )}
      </div>

      {/* Custom Styles for Frappe Gantt Dark Mode & colors */}
      <style>{`
        .gantt .grid-header {
          fill: transparent !important;
          stroke: var(--gantt-border, #e2e8f0) !important;
        }
        .gantt .grid-row {
          fill: transparent !important;
          stroke: var(--gantt-border, #e2e8f0) !important;
        }
        .dark .gantt .grid-header,
        .dark .gantt .grid-row,
        .dark .gantt .tick,
        .dark .gantt .row {
          stroke: #1e293b !important;
        }
        .dark .gantt .date {
          fill: #94a3b8 !important;
        }
        .gantt-done .bar {
          fill: #10b981 !important;
        }
        .gantt-blocked .bar {
          fill: #ef4444 !important;
        }
        .gantt-active .bar {
          fill: #3b82f6 !important;
        }
        .gantt .bar-progress {
          fill: rgba(255,255,255,0.3) !important;
        }
        .gantt .bar-label {
          fill: #fff !important;
          font-weight: 600;
          font-size: 11px;
        }
        .gantt .handle {
          fill: #ffffff99 !important;
        }
        .gantt .today-highlight {
          fill: rgba(59, 130, 246, 0.08) !important;
        }
        .gantt .arrow {
          fill: none !important;
          stroke: #94a3b8 !important;
          stroke-width: 1.5 !important;
        }
        .dark .gantt .arrow {
          stroke: #475569 !important;
        }
        .gantt .popup-wrapper {
          display: none !important; /* using our custom tooltip hover or let frappe handle but custom styled */
        }
      `}</style>
    </div>
  );
}
