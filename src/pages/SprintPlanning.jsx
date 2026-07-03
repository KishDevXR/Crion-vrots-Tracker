import React, { useState, useEffect } from 'react';
import { useSprintStore } from '../store/sprintStore';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useResourceStore } from '../store/resourceStore';
import { useAuthStore } from '../store/authStore';
import { canEditSprints } from '../utils/permissionUtils';
import { formatDate } from '../utils/dateUtils';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { 
  CalendarRange, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  Play, 
  Trash2, 
  Check, 
  Users,
  AlertCircle
} from 'lucide-react';

export default function SprintPlanning() {
  const currentRole = useAuthStore(state => state.currentRole);
  const currentUser = useAuthStore(state => state.currentUser);

  const { sprints, fetchSprints, addSprint, updateSprint, deleteSprint, startSprint } = useSprintStore();
  const { backlogTasks, fetchBacklogTasks, updateBacklogTask, assignBacklogTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { resources, fetchResources } = useResourceStore();

  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states for Sprint
  const [sprintName, setSprintName] = useState('');
  const [selectedProjId, setSelectedProjId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');

  useEffect(() => {
    fetchSprints();
    fetchBacklogTasks();
    fetchProjects(currentRole);
    fetchResources(currentRole);
  }, [currentRole]);

  // Set initial selected sprint
  useEffect(() => {
    if (sprints.length > 0 && !selectedSprintId) {
      // Prioritize Planned or Active sprints
      const plannedOrActive = sprints.find(s => s.status !== 'Completed');
      if (plannedOrActive) {
        setSelectedSprintId(plannedOrActive.id);
      } else {
        setSelectedSprintId(sprints[0].id);
      }
    }
  }, [sprints, selectedSprintId]);

  const selectedSprint = sprints.find(s => s.id === selectedSprintId);

  // Auto calculate capacity: Sum resources weekly planned hours * 2 (standard 2-week sprint)
  const teamWeeklyCapacity = resources.reduce((sum, r) => sum + (r.weeklyPlannedHours || 40), 0);
  const calculatedCapacity = teamWeeklyCapacity * 2; // 2-week sprint default

  // Get backlog tasks that could be added to this sprint
  // If sprint is selected, filter backlog items linked to this project
  const eligibleBacklog = backlogTasks.filter(
    t => !t.sprintId && (selectedSprint ? t.projectId === selectedSprint.projectId : true)
  );

  // Get items already added to this sprint (we can represent this by backlogTasks that are committed to this sprint,
  // or active tasks that have this sprintId)
  const committedBacklogItems = backlogTasks.filter(t => t.sprintId === selectedSprintId);
  
  // Totals for the selected sprint
  const committedStoryPoints = committedBacklogItems.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const committedHours = committedBacklogItems.reduce((sum, t) => sum + (t.plannedHours || 0), 0);
  const capacityLimit = selectedSprint?.capacityHours || calculatedCapacity;
  const isOvercommitted = committedHours > capacityLimit;

  const handleCreateSprint = (e) => {
    e.preventDefault();
    const payload = {
      name: sprintName,
      projectId: selectedProjId,
      startDate,
      endDate,
      goal: sprintGoal,
      capacityHours: calculatedCapacity,
      status: 'Planned'
    };
    const newSprint = addSprint(payload);
    setSelectedSprintId(newSprint.id);
    setIsCreateModalOpen(false);
  };

  const handleStartSprint = () => {
    if (!selectedSprint) return;
    setErrorMessage('');
    try {
      startSprint(selectedSprint.id, selectedSprint.projectId);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteSprint = (id) => {
    if (confirm("Are you sure you want to delete this sprint?")) {
      deleteSprint(id);
      setSelectedSprintId('');
    }
  };

  // Add backlog task to sprint
  const handleToggleBacklogToSprint = (task) => {
    if (!selectedSprintId) return;
    
    // Toggle: if already in sprint, remove sprintId. If not, set sprintId.
    const inSprint = task.sprintId === selectedSprintId;
    const updated = {
      ...task,
      sprintId: inSprint ? null : selectedSprintId
    };
    updateBacklogTask(updated);
  };

  const canEdit = canEditSprints(currentRole);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">Sprint Planning</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build sprints, estimate workload against team capacity, and kick-off new sprints.
          </p>
        </div>
        {canEdit && (
          <Button 
            variant="primary" 
            onClick={() => {
              setSprintName(`Sprint ${sprints.length + 11}`);
              if (projects.length > 0) setSelectedProjId(projects[0].id);
              setStartDate(new Date().toISOString().split('T')[0]);
              setEndDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
              setSprintGoal('');
              setIsCreateModalOpen(true);
            }} 
            icon={Plus}
          >
            Create Sprint
          </Button>
        )}
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left List of Sprints */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-colors duration-150">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-3">Sprints Directory</h3>
            
            {sprints.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No sprints found. Create one.</p>
            ) : (
              <div className="space-y-2">
                {sprints.map((s) => {
                  const proj = projects.find(p => p.id === s.projectId);
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSprintId(s.id);
                        setErrorMessage('');
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        selectedSprintId === s.id
                          ? 'bg-blue-50/55 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/60 dark:text-blue-300'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold">{s.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{proj ? proj.name : 'Unknown Project'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge value={s.status} />
                        {canEdit && s.status === 'Planned' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSprint(s.id);
                            }}
                            className="text-slate-400 hover:text-red-500 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sprint Planning Area */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSprint ? (
            <div className="space-y-6">
              
              {/* Sprint Header Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors duration-150">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0">{selectedSprint.name}</h2>
                      <Badge value={selectedSprint.status} />
                    </div>
                    <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
                      Target Project: <strong>{projects.find(p => p.id === selectedSprint.projectId)?.name || 'Unknown'}</strong>
                    </p>
                  </div>

                  {canEdit && selectedSprint.status === 'Planned' && (
                    <Button variant="success" size="sm" onClick={handleStartSprint} icon={Play}>
                      Start Sprint
                    </Button>
                  )}
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 text-xs bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Dates & Goal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg">
                    <span className="text-slate-400 block font-semibold mb-0.5">Sprint Goal</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium italic">
                      {selectedSprint.goal || "No goal set."}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg flex justify-between">
                    <div>
                      <span className="text-slate-400 block font-semibold">Start Date</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{formatDate(selectedSprint.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">End Date</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{formatDate(selectedSprint.endDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Capacity vs Commitment rollups */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center bg-slate-50 dark:bg-slate-800/20 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Sprint Capacity</span>
                      <div className="text-lg font-bold text-slate-800 dark:text-white mt-1">{capacityLimit} hrs</div>
                    </div>
                    <div className="text-center bg-slate-50 dark:bg-slate-800/20 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Committed Hours</span>
                      <div className={`text-lg font-bold mt-1 ${isOvercommitted ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                        {committedHours} hrs
                      </div>
                    </div>
                    <div className="text-center bg-slate-50 dark:bg-slate-800/20 p-3 rounded-xl col-span-2 md:col-span-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Story Points</span>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">{committedStoryPoints} pts</div>
                    </div>
                  </div>

                  {isOvercommitted && (
                    <div className="flex items-center gap-2 text-xs bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 p-3 rounded-lg border border-orange-100 dark:border-orange-900/50 mt-4">
                      <AlertTriangle size={16} />
                      <span><strong>Warning:</strong> Sprint is over-committed! Committed hours ({committedHours}h) exceed team capacity ({capacityLimit}h). Consider removing backlog items.</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Backlog Allocation Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Eligible Backlog Items */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col h-[380px] transition-colors duration-150">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-3">Project Backlog</h3>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {eligibleBacklog.length === 0 ? (
                      <p className="text-slate-500 text-xs italic text-center py-10">No backlog tasks for this project.</p>
                    ) : (
                      eligibleBacklog.map((task) => (
                        <div 
                          key={task.id} 
                          className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/35 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-850 rounded-xl flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex-1 truncate mr-3">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate">{task.description}</span>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                              <Badge type="priority" value={task.priority} className="scale-75 origin-left" />
                              <span>{task.plannedHours}h • {task.storyPoints || 3} SP</span>
                            </div>
                          </div>
                          <button
                            disabled={!canEdit || selectedSprint.status !== 'Planned'}
                            onClick={() => handleToggleBacklogToSprint(task)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-1 rounded-lg transition-colors shrink-0 disabled:opacity-40"
                            title="Add to Sprint"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right: Committed Sprint Backlog */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col h-[380px] transition-colors duration-150">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-3">Sprint Backlog ({committedBacklogItems.length})</h3>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {committedBacklogItems.length === 0 ? (
                      <p className="text-slate-500 text-xs italic text-center py-10">Sprint backlog is empty. Add tasks from the left.</p>
                    ) : (
                      committedBacklogItems.map((task) => (
                        <div 
                          key={task.id} 
                          className="p-3 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/40 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex-1 truncate mr-3">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate">{task.description}</span>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                              <Badge type="priority" value={task.priority} className="scale-75 origin-left" />
                              <span>{task.plannedHours}h • {task.storyPoints || 3} SP</span>
                            </div>
                          </div>
                          <button
                            disabled={!canEdit || selectedSprint.status !== 'Planned'}
                            onClick={() => handleToggleBacklogToSprint(task)}
                            className="bg-slate-200 hover:bg-red-150 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/25 p-1 rounded-lg text-slate-500 transition-colors shrink-0 disabled:opacity-40"
                            title="Remove from Sprint"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-slate-500 italic">Select a sprint from the directory to start planning.</p>
            </div>
          )}
        </div>

      </div>

      {/* Create Sprint Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Planned Sprint"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" onClick={handleCreateSprint}>Create Sprint</Button>
          </>
        }
      >
        <form onSubmit={handleCreateSprint} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Sprint Name</label>
            <input
              type="text"
              required
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Target Project</label>
            <select
              value={selectedProjId}
              onChange={(e) => setSelectedProjId(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Sprint Goal</label>
            <textarea
              required
              placeholder="What do you plan to achieve in this sprint?"
              value={sprintGoal}
              onChange={(e) => setSprintGoal(e.target.value)}
              rows={3}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}
