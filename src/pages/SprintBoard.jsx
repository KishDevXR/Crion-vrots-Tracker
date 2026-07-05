import React, { useState, useEffect } from 'react';
import { useSprintStore } from '../store/sprintStore';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { canEditSprints } from '../utils/permissionUtils';
import { formatDate } from '../utils/dateUtils';
import KanbanBoard from '../components/kanban/KanbanBoard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Compass, 
  CheckSquare, 
  TrendingDown, 
  Flag, 
  Award, 
  MessageSquareCode,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function SprintBoard({ onOpenTaskDrawer }) {
  const currentRole = useAuthStore(state => state.currentRole);
  const currentUser = useAuthStore(state => state.currentUser);

  const { sprints, fetchSprints, completeSprint } = useSprintStore();
  const { tasks, fetchTasks, changeTaskStatus, updateTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();

  const [activeSprintId, setActiveSprintId] = useState('');
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  
  // Retro Form States
  const [wentWell, setWentWell] = useState('');
  const [didNotGoWell, setDidNotGoWell] = useState('');
  const [actionItems, setActionItems] = useState('');

  useEffect(() => {
    fetchSprints();
    fetchTasks(currentRole, currentUser);
    fetchProjects(currentRole);
  }, [currentRole, currentUser]);

  // Find all active sprints
  const activeSprints = sprints.filter(s => s.status === 'Active');

  useEffect(() => {
    if (activeSprints.length > 0 && !activeSprintId) {
      setActiveSprintId(activeSprints[0].id);
    }
  }, [activeSprints, activeSprintId]);

  const activeSprint = sprints.find(s => s.id === activeSprintId);

  // If no active sprint is selected or found, render empty state
  if (!activeSprint) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">Active Sprint Board</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage tasks and monitor progress for the active sprint.
          </p>
        </div>

        {/* Project Selector for Active Sprints if they exist but aren't loaded */}
        {activeSprints.length > 0 && (
          <div className="flex gap-2 items-center bg-white dark:bg-slate-900 p-4 border rounded-xl">
            <span className="text-xs text-slate-500 font-semibold uppercase">Select Active Sprint:</span>
            <select
              value={activeSprintId}
              onChange={(e) => setActiveSprintId(e.target.value)}
              className="text-sm border p-1 rounded bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select a sprint...</option>
              {activeSprints.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {projects.find(p => p.id === s.projectId)?.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Award size={48} className="text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Active Sprint</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
            There are currently no active sprints. Go to the <strong>Sprint Planning</strong> view to start a planned sprint.
          </p>
        </div>
      </div>
    );
  }

  // Filter tasks belonging to the active sprint
  const sprintTasks = tasks.filter(t => t.sprintId === activeSprint.id);

  // Calculate story point totals
  const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completedPoints = sprintTasks.filter(t => t.status === 'Done').reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const remainingPoints = totalPoints - completedPoints;

  // Generate Burndown Chart Data — date-based for accuracy
  const generateBurndownData = () => {
    const data = [];
    const start = new Date(activeSprint.startDate);
    const end = new Date(activeSprint.endDate);
    const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
    const today = new Date();

    // Clamp today within sprint window
    const daysPassed = Math.min(
      totalDays,
      Math.max(0, Math.round((today - start) / (1000 * 60 * 60 * 24)))
    );

    const idealStep = totalPoints / (totalDays - 1 || 1);
    const donePercent = totalPoints > 0 ? completedPoints / totalPoints : 0;

    for (let i = 0; i < totalDays; i++) {
      const dayLabel = `Day ${i + 1}`;
      const idealRemaining = Math.max(0, Math.round((totalPoints - i * idealStep) * 10) / 10);

      // Plot actual only up to today
      let actualRemaining = null;
      if (i <= daysPassed) {
        const burnFraction = i === daysPassed ? donePercent : (i / daysPassed) * donePercent;
        actualRemaining = Math.max(0, Math.round((totalPoints - totalPoints * burnFraction) * 10) / 10);
      }

      data.push({
        name: dayLabel,
        'Ideal Remaining': idealRemaining,
        'Actual Remaining': actualRemaining
      });
    }
    return data;
  };

  const burndownData = generateBurndownData();

  const handleOpenRetro = () => {
    setWentWell('');
    setDidNotGoWell('');
    setActionItems('');
    setIsRetroModalOpen(true);
  };

  const handleCompleteSprintSubmit = (e) => {
    e.preventDefault();
    const retroNotes = {
      wentWell,
      didNotGoWell,
      actionItems
    };

    // Complete sprint in store, which cascades resetting incomplete tasks to backlog
    // and updates task state
    completeSprint(activeSprint.id, retroNotes, tasks, (updatedTask) => {
      // Update task in local Zustand store list
      updateTask(updatedTask, currentUser);
    });

    setIsRetroModalOpen(false);
    setActiveSprintId('');
  };

  const canEdit = canEditSprints(currentRole);
  const targetProj = projects.find(p => p.id === activeSprint.projectId);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">Active Sprint Board</h1>
            <Badge value="Active" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Running tasks for <strong>{activeSprint.name}</strong> under <strong>{targetProj?.name}</strong>.
          </p>
        </div>

        {canEdit && (
          <Button variant="danger" onClick={handleOpenRetro} icon={Flag}>
            Complete Sprint
          </Button>
        )}
      </div>

      {/* Stats and Burndown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sprints stats */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-150">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2">Sprint Health</h3>
          
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <span>Story Points Completed</span>
                <span>{completedPoints} / {totalPoints} SP</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                <span className="text-slate-400 block font-semibold uppercase text-[9px]">Committed Points</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">{totalPoints} SP</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                <span className="text-slate-400 block font-semibold uppercase text-[9px]">Remaining Points</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1 block">{remainingPoints} SP</span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div className="flex justify-between">
                <span>Total Tasks:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{sprintTasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Sprint Goal:</span>
                <span className="font-medium text-slate-800 dark:text-slate-300 text-right italic truncate max-w-[180px]">{activeSprint.goal}</span>
              </div>
              <div className="flex justify-between">
                <span>End Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatDate(activeSprint.endDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Burndown Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[260px] transition-colors duration-150">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider">Sprint Burndown Chart</h3>
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <TrendingDown size={12} className="text-blue-500" />
              Story Points remaining per day
            </span>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={burndownData}
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
                <Line type="monotone" dataKey="Ideal Remaining" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Actual Remaining" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Sprint Kanban Board */}
      <KanbanBoard
        tasks={sprintTasks}
        onTaskStatusChange={(taskId, newStatus) => changeTaskStatus(taskId, newStatus, currentUser)}
        onCardClick={onOpenTaskDrawer}
      />

      {/* Retrospective & Complete Sprint Modal */}
      <Modal
        isOpen={isRetroModalOpen}
        onClose={() => setIsRetroModalOpen(false)}
        title={`Complete Sprint: ${activeSprint.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRetroModalOpen(false)}>Cancel</Button>
            <Button variant="danger" type="submit" onClick={handleCompleteSprintSubmit}>Complete Sprint & Retro</Button>
          </>
        }
      >
        <form onSubmit={handleCompleteSprintSubmit} className="space-y-4">
          
          <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 p-4 rounded-xl border border-blue-105 dark:border-blue-900/50 flex gap-3 text-xs leading-relaxed">
            <Sparkles size={20} className="shrink-0 text-blue-500" />
            <div>
              <span className="font-semibold block">Sprint Wrap Up Summary</span>
              <span>Completing this sprint will automatically move all <strong>{sprintTasks.filter(t => t.status !== 'Done').length} incomplete tasks</strong> back to the backlog. Ready to log your Retro notes?</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <MessageSquareCode size={14} className="text-emerald-500" />
              What went well?
            </label>
            <textarea
              required
              placeholder="e.g. Interaction mechanics finalized, shaders compiled smoothly, good coordination..."
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              rows={2}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <MessageSquareCode size={14} className="text-red-500" />
              What did not go well?
            </label>
            <textarea
              required
              placeholder="e.g. Photon fusion server dropped connection, dial mechanics testing was delayed..."
              value={didNotGoWell}
              onChange={(e) => setDidNotGoWell(e.target.value)}
              rows={2}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <MessageSquareCode size={14} className="text-blue-500" />
              Action Items
            </label>
            <textarea
              required
              placeholder="e.g. Kishore to review serialization rate parameters, schedule UAT review with client..."
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              rows={2}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}
