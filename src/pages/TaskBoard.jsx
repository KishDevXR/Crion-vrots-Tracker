import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useResourceStore } from '../store/resourceStore';
import { useAuthStore } from '../store/authStore';
import { canUpdateTask, canEditProjects } from '../utils/permissionUtils';
import KanbanBoard from '../components/kanban/KanbanBoard';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import SpreadsheetImportModal from '../components/common/SpreadsheetImportModal';
import FlushConfirmModal from '../components/common/FlushConfirmModal';
import { 
  Plus, 
  Filter, 
  Search, 
  X,
  FileSpreadsheet,
  Trash2,
  LayoutGrid,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function TaskBoard({ onOpenTaskDrawer }) {
  const currentRole = useAuthStore(state => state.currentRole);
  const currentUser = useAuthStore(state => state.currentUser);

  const { tasks, fetchTasks, addTask, importTasks, flushData, changeTaskStatus } = useTaskStore();
  const { projects, fetchProjects, modules, fetchModules } = useProjectStore();
  const { resources, fetchResources } = useResourceStore();

  // Filters state
  const [filterProject, setFilterProject] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterWeek, setFilterWeek] = useState('');
  const [viewType, setViewType] = useState('kanban'); // 'kanban' | 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Add Task Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFlushModalOpen, setIsFlushModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedProj, setSelectedProj] = useState('');
  const [selectedMod, setSelectedMod] = useState('');
  const [selectedRes, setSelectedRes] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [storyPoints, setStoryPoints] = useState(3);
  const [plannedHours, setPlannedHours] = useState(16);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchTasks(currentRole, currentUser);
    fetchProjects(currentRole);
    fetchModules(currentRole);
    fetchResources(currentRole);
  }, [currentRole, currentUser]);

  // Set default module when project changes
  useEffect(() => {
    if (selectedProj) {
      const projModules = modules.filter(m => m.projectId === selectedProj);
      if (projModules.length > 0) {
        setSelectedMod(projModules[0].id);
      } else {
        setSelectedMod('');
      }
    }
  }, [selectedProj, modules]);

  const handleOpenAddModal = () => {
    setDescription('');
    if (projects.length > 0) {
      setSelectedProj(projects[0].id);
    }
    if (resources.length > 0) {
      setSelectedRes(resources[0].name);
    }
    setPriority('Medium');
    setStoryPoints(3);
    setPlannedHours(16);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setIsModalOpen(true);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    
    // Calculate weekNo and weekStartDate
    const dateObj = new Date(startDate);
    const startOfWeek = new Date(dateObj.setDate(dateObj.getDate() - dateObj.getDay() + 1)); // Monday
    const weekStartDate = startOfWeek.toISOString().split('T')[0];
    
    // Simple week number calc
    const firstDayOfYear = new Date(dateObj.getFullYear(), 0, 1);
    const pastDaysOfYear = (new Date(startDate) - firstDayOfYear) / 86400000;
    const weekNo = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

    const payload = {
      projectId: selectedProj,
      moduleId: selectedMod,
      description,
      resourceName: selectedRes,
      role: resources.find(r => r.name === selectedRes)?.role || 'Developer',
      priority,
      storyPoints: Number(storyPoints),
      plannedHours: Number(plannedHours),
      startDate,
      endDate: endDate || startDate,
      weekStartDate,
      weekNo,
      manager: projects.find(p => p.id === selectedProj)?.owner || 'Admin'
    };

    addTask(payload, currentUser);
    setIsModalOpen(false);
  };

  const handleImportTasks = async (parsedTasks) => {
    await importTasks(parsedTasks, currentUser, currentRole);
    // Refresh project list since importing might have created new projects
    await fetchProjects(currentRole);
  };

  const handleFlush = async () => {
    await flushData();
    await fetchProjects(currentRole);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesProj = filterProject ? task.projectId === filterProject : true;
    const matchesRes = filterResource ? task.resourceName === filterResource : true;
    const matchesWeek = filterWeek ? String(task.weekNo) === filterWeek : true;
    return matchesProj && matchesRes && matchesWeek;
  });

  const clearFilters = () => {
    setFilterProject('');
    setFilterResource('');
    setFilterWeek('');
  };

  // Get project modules for dropdown
  const activeProjModules = selectedProj ? modules.filter(m => m.projectId === selectedProj) : [];
  const canAdd = canEditProjects(currentRole); // Admins and Managers can add tasks

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">Task Board</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and manage ongoing project tasks in real-time.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setViewType('kanban')}
              className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all ${
                viewType === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <LayoutGrid size={14} />
              Board
            </button>
            <button
              onClick={() => setViewType('calendar')}
              className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all ${
                viewType === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Calendar size={14} />
              Calendar
            </button>
          </div>

          {canAdd && (
            <div className="flex items-center gap-2">
              {currentRole === 'Admin' && (
                <Button variant="danger" onClick={() => setIsFlushModalOpen(true)} icon={Trash2}>
                  Flush Data
                </Button>
              )}
              <Button variant="secondary" onClick={() => setIsImportModalOpen(true)} icon={FileSpreadsheet}>
                Import Sheet
              </Button>
              <Button variant="primary" onClick={handleOpenAddModal} icon={Plus}>
                Add Task
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between transition-colors duration-150">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Filter size={14} className="text-blue-500" />
            <span>Filters:</span>
          </div>

          {/* Project Filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-250 font-medium"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Resource Filter */}
          <select
            value={filterResource}
            onChange={(e) => setFilterResource(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-250 font-medium"
          >
            <option value="">All Assignees</option>
            {resources.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>

          {/* Week Filter — dynamically derived from task data */}
          <select
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-250 font-medium"
          >
            <option value="">All Weeks</option>
            {[...new Set(tasks.map(t => t.weekNo).filter(Boolean))]
              .sort((a, b) => a - b)
              .map(wk => (
                <option key={wk} value={String(wk)}>Week {wk}</option>
              ))
            }
          </select>

          {(filterProject || filterResource || filterWeek) && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Kanban Board or Calendar View */}
      {viewType === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskStatusChange={(taskId, newStatus) => changeTaskStatus(taskId, newStatus, currentUser)}
          onCardClick={onOpenTaskDrawer}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          {/* Calendar Controller */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date())}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              >
                Today
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {/* Weekdays */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="bg-slate-50 dark:bg-slate-850 p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                {day}
              </div>
            ))}

            {/* Days */}
            {(() => {
              const year = currentMonth.getFullYear();
              const month = currentMonth.getMonth();
              const firstDay = new Date(year, month, 1);
              const startDay = new Date(firstDay);
              const dayOffset = startDay.getDay() === 0 ? 6 : startDay.getDay() - 1;
              startDay.setDate(startDay.getDate() - dayOffset);
              
              const days = [];
              for (let i = 0; i < 42; i++) {
                days.push(new Date(startDay));
                startDay.setDate(startDay.getDate() + 1);
              }

              return days.map((day, idx) => {
                const dayStr = day.toISOString().split('T')[0];
                const isCurrentMonth = day.getMonth() === month;
                const isToday = new Date().toISOString().split('T')[0] === dayStr;
                
                // Find tasks spanning this day
                const dayTasks = filteredTasks.filter(t => {
                  if (!t.startDate) return false;
                  const tStart = t.startDate;
                  const tEnd = t.endDate || tStart;
                  return dayStr >= tStart && dayStr <= tEnd;
                });

                return (
                  <div 
                    key={idx} 
                    className={`bg-white dark:bg-slate-900 min-h-[100px] p-2 flex flex-col justify-between hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors ${
                      isCurrentMonth ? '' : 'opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        isToday 
                          ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {day.getDate()}
                      </span>
                    </div>

                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px]">
                      {dayTasks.map(t => {
                        const statusColors = {
                          'Done': 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200 dark:border-green-800/40',
                          'In Progress': 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
                          'Blocked': 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-800/40',
                          'Not Started': 'bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        };
                        const colorClass = statusColors[t.status] || statusColors['Not Started'];

                        return (
                          <div 
                            key={t.id}
                            onClick={() => onOpenTaskDrawer(t)}
                            className={`text-[9px] px-1.5 py-0.5 rounded border font-medium truncate cursor-pointer transition-all hover:scale-[1.02] ${colorClass}`}
                            title={`${t.description} (${t.status})`}
                          >
                            {t.description}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Task"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" onClick={handleAddTask}>Create Task</Button>
          </>
        }
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Task Description</label>
            <textarea
              required
              placeholder="What needs to be done? e.g. Design shader logic..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Project</label>
              <select
                value={selectedProj}
                onChange={(e) => setSelectedProj(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Module</label>
              <select
                value={selectedMod}
                onChange={(e) => setSelectedMod(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Module</option>
                {activeProjModules.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Assignee</label>
              <select
                value={selectedRes}
                onChange={(e) => setSelectedRes(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {resources.map(r => (
                  <option key={r.id} value={r.name}>{r.name} ({r.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Story Points (Estim.)</label>
              <input
                type="number"
                required
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Planned Hours</label>
              <input
                type="number"
                required
                value={plannedHours}
                onChange={(e) => setPlannedHours(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>
      </Modal>

      <SpreadsheetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportTasks}
        projects={projects}
        resources={resources}
      />

      <FlushConfirmModal
        isOpen={isFlushModalOpen}
        onClose={() => setIsFlushModalOpen(false)}
        onConfirm={handleFlush}
      />

    </div>
  );
}
