import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useSprintStore } from '../store/sprintStore';
import { useResourceStore } from '../store/resourceStore';
import { useAuthStore } from '../store/authStore';
import { canEditProjects } from '../utils/permissionUtils';
import { formatDate } from '../utils/dateUtils';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { 
  Layers, 
  UserPlus, 
  CalendarPlus, 
  Trash2, 
  Sparkles, 
  Plus, 
  ArrowRight,
  TrendingUp,
  GitPullRequest
} from 'lucide-react';

export default function Backlog({ onOpenTaskDrawer }) {
  const currentRole = useAuthStore(state => state.currentRole);
  const currentUser = useAuthStore(state => state.currentUser);

  const { 
    backlogTasks, fetchBacklogTasks, addBacklogTask, updateBacklogTask, deleteBacklogTask, assignBacklogTask,
    unassignedTasks, fetchUnassignedTasks, addUnassignedTask, deleteUnassignedTask, assignUnassignedTask,
    epics, fetchEpics, addEpic, updateEpic
  } = useTaskStore();

  const { projects, fetchProjects, modules } = useProjectStore();
  const { sprints, fetchSprints, updateSprint } = useSprintStore();
  const { resources, fetchResources } = useResourceStore();

  const [activeTab, setActiveTab] = useState('backlog'); // 'backlog' | 'unassigned' | 'epics'
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // Backlog item or Unassigned item
  const [assignType, setAssignType] = useState('backlog'); // 'backlog' | 'unassigned'

  // Assign form states
  const [assignee, setAssignee] = useState('');
  const [role, setRole] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [storyPoints, setStoryPoints] = useState(3);
  const [plannedHours, setPlannedHours] = useState(16);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // Add Backlog Item Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedProj, setSelectedProj] = useState('');
  const [selectedMod, setSelectedMod] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [backlogPriority, setBacklogPriority] = useState('Medium');
  const [backlogHours, setBacklogHours] = useState(16);

  // Add Epic Modal states
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);
  const [epicTitle, setEpicTitle] = useState('');
  const [epicDesc, setEpicDesc] = useState('');
  const [epicPoints, setEpicPoints] = useState(13);
  const [epicPriority, setEpicPriority] = useState('Medium');

  useEffect(() => {
    fetchBacklogTasks();
    fetchUnassignedTasks();
    fetchEpics();
    fetchProjects(currentRole);
    fetchSprints();
    fetchResources(currentRole);
  }, [currentRole]);

  // Set default modules when project changes in forms
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

  // Handle opening Assign form
  const handleOpenAssign = (item, type) => {
    setSelectedItem(item);
    setAssignType(type);
    setAssignee(resources[0]?.name || '');
    setRole(resources[0]?.role || 'Developer');
    setPriority(item.priority || 'Medium');
    setStoryPoints(3);
    setPlannedHours(item.plannedHours || 16);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    const details = {
      resourceName: assignee,
      role,
      priority,
      storyPoints: Number(storyPoints),
      plannedHours: Number(plannedHours),
      startDate,
      endDate: endDate || startDate
    };

    if (assignType === 'backlog') {
      assignBacklogTask(selectedItem.id, details, currentUser);
    } else {
      assignUnassignedTask(selectedItem.id, details, currentUser);
    }
    setIsAssignModalOpen(false);
  };

  // Story Point Poker Estimation (Quick click)
  const handleEstimatePoints = (task, points) => {
    const updated = { ...task, storyPoints: points };
    updateBacklogTask(updated);
  };

  // Add item to sprint
  const handleAddToSprint = (task, sprintId) => {
    // A sprint backlog item is promoted to a Task under that sprint
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    const taskDetails = {
      resourceName: task.assignedTo || '',
      role: resources.find(r => r.name === task.assignedTo)?.role || 'Developer',
      priority: task.priority || 'Medium',
      storyPoints: task.storyPoints || 3,
      plannedHours: task.plannedHours || 16,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      sprintId: sprintId // Associate with sprint
    };

    assignBacklogTask(task.id, taskDetails, currentUser);
  };

  const handleAddBacklog = (e) => {
    e.preventDefault();
    const payload = {
      projectId: selectedProj,
      moduleId: selectedMod,
      description,
      category,
      priority: backlogPriority,
      plannedHours: Number(backlogHours),
      assignedTo: '',
      dependency: 'None',
      blockerReason: '',
      targetWeek: 'Week 28',
      remarks: ''
    };
    addBacklogTask(payload);
    setIsAddModalOpen(false);
  };

  const handleAddEpicSubmit = (e) => {
    e.preventDefault();
    const payload = {
      projectId: selectedProj,
      epicTitle,
      description: epicDesc,
      storyPoints: Number(epicPoints),
      priority: epicPriority,
      status: 'In Progress'
    };
    addEpic(payload);
    setIsEpicModalOpen(false);
  };

  const handleDeleteBacklog = (id) => {
    if (confirm("Delete this backlog item?")) {
      deleteBacklogTask(id);
    }
  };

  const canEdit = canEditProjects(currentRole);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">Backlog Grooming</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Prioritize backlog stories, estimate points, and allocate items into sprints.
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              if (projects.length > 0) setSelectedProj(projects[0].id);
              setEpicTitle('');
              setEpicDesc('');
              setIsEpicModalOpen(true);
            }} icon={Sparkles}>
              New Epic
            </Button>
            <Button variant="primary" onClick={() => {
              if (projects.length > 0) setSelectedProj(projects[0].id);
              setDescription('');
              setIsAddModalOpen(true);
            }} icon={Plus}>
              New Backlog Item
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('backlog')}
          className={`flex items-center gap-2 pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'backlog' 
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Layers size={16} />
          Backlog Tasks ({backlogTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('unassigned')}
          className={`flex items-center gap-2 pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'unassigned' 
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <GitPullRequest size={16} />
          Unassigned Triages ({unassignedTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('epics')}
          className={`flex items-center gap-2 pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'epics' 
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles size={16} />
          Epics & Stories ({epics.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-150">
        
        {activeTab === 'backlog' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Project / Module</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Planned Hours</th>
                  <th className="px-6 py-3.5">Story Point Poker</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {backlogTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 italic">No backlog tasks available.</td>
                  </tr>
                ) : (
                  backlogTasks.map((task) => {
                    const proj = projects.find(p => p.id === task.projectId);
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-xs truncate" title={task.description}>
                          {task.description}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="font-semibold block text-slate-800 dark:text-slate-200">{proj ? proj.name : 'Unknown Project'}</span>
                          <span className="text-slate-400 text-[10px] block">{task.moduleId}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {task.category}
                        </td>
                        <td className="px-6 py-4">
                          <Badge type="priority" value={task.priority} />
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                          {task.plannedHours} hrs
                        </td>
                        <td className="px-6 py-4">
                          {/* Story Point quick pick */}
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 5, 8, 13].map((pt) => (
                              <button
                                key={pt}
                                disabled={!canEdit}
                                onClick={() => handleEstimatePoints(task, pt)}
                                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-colors ${
                                  task.storyPoints === pt
                                    ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500'
                                    : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                                }`}
                              >
                                {pt}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {/* Sprint Dropdown Selector */}
                            <select
                              disabled={!canEdit}
                              onChange={(e) => handleAddToSprint(task, e.target.value)}
                              defaultValue=""
                              className="text-xs bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300"
                            >
                              <option value="" disabled>Add to Sprint</option>
                              {sprints.filter(s => s.status !== 'Completed').map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                              ))}
                            </select>

                            <Button 
                              variant="secondary" 
                              size="sm"
                              disabled={!canEdit}
                              onClick={() => handleOpenAssign(task, 'backlog')}
                              icon={UserPlus}
                            >
                              Assign
                            </Button>

                            {canEdit && (
                              <button 
                                onClick={() => handleDeleteBacklog(task.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'unassigned' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Project / Module</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Planned Hours</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {unassignedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic">No unassigned tasks currently. All triaged!</td>
                  </tr>
                ) : (
                  unassignedTasks.map((task) => {
                    const proj = projects.find(p => p.id === task.projectId);
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-xs truncate" title={task.description}>
                          {task.description}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="font-semibold block text-slate-800 dark:text-slate-200">{proj ? proj.name : 'Unknown Project'}</span>
                          <span className="text-slate-400 text-[10px] block">{task.moduleId}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {task.department || 'Engineering'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                          {task.plannedHours} hrs
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="primary" 
                              size="sm"
                              disabled={!canEdit}
                              onClick={() => handleOpenAssign(task, 'unassigned')}
                              icon={ArrowRight}
                            >
                              Triage & Assign
                            </Button>
                            {canEdit && (
                              <button 
                                onClick={() => deleteUnassignedTask(task.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'epics' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Epic Title</th>
                  <th className="px-6 py-3.5">Linked Project</th>
                  <th className="px-6 py-3.5">Epic Description</th>
                  <th className="px-6 py-3.5">Story Points</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Linked Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {epics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 italic">No epics found.</td>
                  </tr>
                ) : (
                  epics.map((epic) => {
                    const proj = projects.find(p => p.id === epic.projectId);
                    return (
                      <tr key={epic.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {epic.epicTitle}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                          {proj ? proj.name : 'Unknown Project'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" title={epic.description}>
                          {epic.description}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-300">
                          {epic.storyPoints} SP
                        </td>
                        <td className="px-6 py-4">
                          <Badge type="priority" value={epic.priority} />
                        </td>
                        <td className="px-6 py-4">
                          <Badge value={epic.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {epic.linkedTaskIds && epic.linkedTaskIds.length > 0 ? (
                              epic.linkedTaskIds.map(tid => (
                                <span key={tid} className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/40">
                                  {tid}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No tasks linked</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Triage & Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign & Promote: ${selectedItem?.id}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" onClick={handleAssignSubmit}>Promote to Active Task</Button>
          </>
        }
      >
        {selectedItem && (
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-450 uppercase block">Selected Description</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{selectedItem.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Assign Resource</label>
                <select
                  value={assignee}
                  onChange={(e) => {
                    const name = e.target.value;
                    setAssignee(name);
                    setRole(resources.find(r => r.name === name)?.role || '');
                  }}
                  className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  {resources.map(r => (
                    <option key={r.id} value={r.name}>{r.name} ({r.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Role</label>
                <input
                  type="text"
                  disabled
                  value={role}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-500 dark:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Story Points</label>
                <select
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  {[1, 2, 3, 5, 8, 13].map(pt => (
                    <option key={pt} value={pt}>{pt} SP</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Planned Hours</label>
                <input
                  type="number"
                  required
                  value={plannedHours}
                  onChange={(e) => setPlannedHours(e.target.value)}
                  className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
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
                  className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* New Backlog Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Backlog Item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" onClick={handleAddBacklog}>Save to Backlog</Button>
          </>
        }
      >
        <form onSubmit={handleAddBacklog} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Description</label>
            <textarea
              required
              placeholder="e.g. Implement Spatial Audio controller bindings..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
                {modules.filter(m => m.projectId === selectedProj).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Engineering">Engineering</option>
                <option value="Art">Art</option>
                <option value="QA">QA</option>
                <option value="Design">Design</option>
                <option value="DevOps">DevOps</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={backlogPriority}
                onChange={(e) => setBacklogPriority(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Planned Hours</label>
              <input
                type="number"
                required
                value={backlogHours}
                onChange={(e) => setBacklogHours(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* New Epic Modal */}
      <Modal
        isOpen={isEpicModalOpen}
        onClose={() => setIsEpicModalOpen(false)}
        title="Create New Epic"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEpicModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" onClick={handleAddEpicSubmit}>Create Epic</Button>
          </>
        }
      >
        <form onSubmit={handleAddEpicSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Epic Title</label>
            <input
              type="text"
              required
              placeholder="e.g. VR Hand Interactivity V2"
              value={epicTitle}
              onChange={(e) => setEpicTitle(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Description</label>
            <textarea
              required
              placeholder="Provide a description of the Epic objective and scope..."
              value={epicDesc}
              onChange={(e) => setEpicDesc(e.target.value)}
              rows={3}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Linked Project</label>
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
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Estimated SP</label>
              <input
                type="number"
                required
                value={epicPoints}
                onChange={(e) => setEpicPoints(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={epicPriority}
                onChange={(e) => setEpicPriority(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}
