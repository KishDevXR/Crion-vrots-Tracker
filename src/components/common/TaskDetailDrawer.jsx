import React, { useState, useEffect } from 'react';
import Drawer from './Drawer';
import Avatar from './Avatar';
import Badge from './Badge';
import Button from './Button';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { useProjectStore } from '../../store/projectStore';
import { useSprintStore } from '../../store/sprintStore';
import { useResourceStore } from '../../store/resourceStore';
import { getTaskEditableFields, canUpdateTask } from '../../utils/permissionUtils';
import { formatDate } from '../../utils/dateUtils';
import { getStatusColors } from '../../utils/statusUtils';
import { notificationService } from '../../services/notificationService';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  History, 
  Tag, 
  User, 
  TrendingUp, 
  CheckSquare, 
  AlertCircle,
  Paperclip,
  Trash2,
  ChevronDown
} from 'lucide-react';

export default function TaskDetailDrawer({ task, isOpen, onClose }) {
  const { currentRole, currentUser } = useAuthStore();
  const { tasks, addTask, updateTask, addCommentToTask, changeTaskStatus, addDependency, removeDependency, logTime } = useTaskStore();
  const { projects } = useProjectStore();
  const { sprints } = useSprintStore();
  const { resources } = useResourceStore();

  // Form states — all hooks must be declared unconditionally before any early return
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState(task?.status ?? 'Not Started');
  const [priority, setPriority] = useState(task?.priority ?? 'Medium');
  const [storyPoints, setStoryPoints] = useState(task?.storyPoints ?? 0);
  const [plannedHours, setPlannedHours] = useState(task?.plannedHours ?? 0);
  const [actualHours, setActualHours] = useState(task?.actualHours ?? 0);
  const [progressPercent, setProgressPercent] = useState(task?.progressPercent ?? 0);
  const [resourceName, setResourceName] = useState(task?.resourceName ?? '');
  const [epicId, setEpicId] = useState(task?.epicId ?? '');
  const [projectId, setProjectId] = useState(task?.projectId ?? '');
  const [moduleId, setModuleId] = useState(task?.moduleId ?? '');
  const [remarks, setRemarks] = useState(task?.remarks ?? '');
  const [newComment, setNewComment] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [selectedDepId, setSelectedDepId] = useState('');
  const [logHours, setLogHours] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logDesc, setLogDesc] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tab, setTab] = useState('details'); // 'details' | 'history'
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const editableFields = task ? getTaskEditableFields(currentRole, task, currentUser) : {};
  const canModify = task ? canUpdateTask(currentRole, task, currentUser) : false;

  const getStatusClass = (statusVal) => {
    const colors = getStatusColors(statusVal);
    return `${colors.bg} ${colors.text} ${colors.border}`;
  };

  // Update fields when task changes
  useEffect(() => {
    if (!task) return;
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setStoryPoints(task.storyPoints || 0);
    setPlannedHours(task.plannedHours || 0);
    setActualHours(task.actualHours || 0);
    setProgressPercent(task.progressPercent || 0);
    setResourceName(task.resourceName || '');
    setEpicId(task.epicId || '');
    setProjectId(task.projectId || '');
    setModuleId(task.moduleId || '');
    setRemarks(task.remarks || '');
    setIsEditing(false);
  }, [task]);

  const loadAttachments = async () => {
    if (!task?.id) return;
    try {
      const data = await notificationService.getAttachments(task.id);
      setAttachments(data);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    }
  };

  useEffect(() => {
    if (task?.id) {
      loadAttachments();
    }
  }, [task?.id]);

  // Safe early return AFTER all hooks
  if (!task) return null;

  const handleSave = () => {
    // Collect updated task info
    const updatedFields = {
      ...task,
      description,
      status,
      priority,
      storyPoints: Number(storyPoints),
      plannedHours: Number(plannedHours),
      actualHours: Number(actualHours),
      progressPercent: Number(progressPercent),
      resourceName,
      epicId: epicId || null,
      projectId,
      moduleId,
      remarks
    };

    // If task status was updated to Done, auto set progressPercent to 100
    if (status === 'Done') {
      updatedFields.progressPercent = 100;
    } else if (status === 'Not Started' && task.status !== 'Not Started') {
      updatedFields.progressPercent = 0;
    }

    updateTask(updatedFields, currentUser);
    setIsEditing(false);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentToTask(task.id, newComment.trim(), currentUser);
    setNewComment('');
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    
    await addTask({
      projectId: task.projectId,
      parentTaskId: task.id,
      description: newSubtaskText.trim(),
      status: 'Not Started',
      plannedHours: 0,
      actualHours: 0,
      progressPercent: 0
    }, currentUser);

    setNewSubtaskText('');
  };

  const handleToggleSubtask = async (sub) => {
    const newStatus = sub.status === 'Done' ? 'Not Started' : 'Done';
    const newProgress = newStatus === 'Done' ? 100 : 0;
    
    await updateTask({
      ...sub,
      status: newStatus,
      progressPercent: newProgress
    }, currentUser);

    // Recalculate parent progress
    const siblings = task.subtasks || [];
    const updatedSiblings = siblings.map(s => s.id === sub.id ? { ...s, status: newStatus } : s);
    const completedCount = updatedSiblings.filter(s => s.status === 'Done').length;
    const parentProgress = Math.round((completedCount / updatedSiblings.length) * 100);

    await updateTask({
      ...task,
      progressPercent: parentProgress,
      status: parentProgress === 100 ? 'Done' : parentProgress > 0 ? 'In Progress' : task.status
    }, currentUser);
  };

  const handleAddDependency = async () => {
    if (!selectedDepId) return;
    await addDependency(task.id, selectedDepId);
    setSelectedDepId('');
  };

  const handleRemoveDependency = async (dependsOnId) => {
    await removeDependency(task.id, dependsOnId);
  };

  const handleLogTime = async (e) => {
    e.preventDefault();
    if (!logHours || isNaN(Number(logHours)) || Number(logHours) <= 0) return;

    await logTime(task.id, {
      userName: currentUser,
      hours: Number(logHours),
      loggedDate: logDate,
      description: logDesc.trim() || 'Work logged'
    });

    setLogHours('');
    setLogDesc('');
  };



  const handleUploadAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !task?.id) return;
    
    setUploading(true);
    try {
      await notificationService.uploadAttachment(task.id, file, currentUser);
      await loadAttachments();
    } catch (err) {
      alert(`Upload failed: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (att) => {
    if (!window.confirm(`Are you sure you want to delete ${att.filename}?`)) return;
    try {
      await notificationService.deleteAttachment(att.id, att.storage_path);
      await loadAttachments();
    } catch (err) {
      alert(`Delete failed: ${err.message || err}`);
    }
  };

  // Find Project name
  const projectObj = projects.find(p => p.id === (projectId || task.projectId));
  const sprintObj = sprints.find(s => s.id === task.sprintId);

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Task Details: ${task.id}`}
      footer={
        <div className="flex gap-2 w-full justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 self-center">
            Last updated details will sync automatically
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            {canModify && (
              isEditing ? (
                <Button variant="success" onClick={handleSave}>Save Changes</Button>
              ) : (
                <Button variant="primary" onClick={() => setIsEditing(true)}>Edit Task</Button>
              )
            )}
          </div>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setTab('details')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            tab === 'details' 
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare size={16} />
          Details & Comments
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            tab === 'history' 
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <History size={16} />
          Activity Log ({task.activityLog ? task.activityLog.length : 0})
        </button>
      </div>

      {tab === 'details' && (
        <div className="space-y-6">
          {/* Main Info */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</label>
            {isEditing && editableFields.description ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
              />
            ) : (
              <p className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed whitespace-pre-line">
                {task.description}
              </p>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
            {/* Project */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Project</span>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                <Tag size={14} className="text-slate-400" />
                {projectObj ? projectObj.name : 'Unknown Project'}
              </span>
            </div>

            {/* Sprint */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Sprint</span>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                <Calendar size={14} className="text-slate-400" />
                {sprintObj ? sprintObj.name : <span className="text-slate-400 italic">Backlog</span>}
              </span>
            </div>

            {/* Assignee */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Assignee</span>
              {isEditing && editableFields.resourceName ? (
                <select
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  className="mt-1 w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-900 dark:text-white"
                >
                  <option value="">Unassigned</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.name}>{r.name} ({r.role})</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2 mt-1.5">
                  {task.resourceName ? (
                    <>
                      <Avatar name={task.resourceName} size="sm" />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{task.resourceName}</span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400 italic">Unassigned</span>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Status</span>
              {editableFields.status ? (
                <div className="relative mt-1 max-w-[150px]">
                  <select
                    value={isEditing ? status : task.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      if (isEditing) {
                        setStatus(newStatus);
                      } else {
                        await changeTaskStatus(task.id, newStatus, currentUser);
                      }
                    }}
                    className={`w-full text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 select-none appearance-none pr-8 transition-colors ${
                      getStatusClass(isEditing ? status : task.status)
                    }`}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Done">Done</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-550 dark:text-slate-450">
                    <ChevronDown size={14} />
                  </div>
                </div>
              ) : (
                <div className="mt-1.5">
                  <Badge value={task.status} />
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Priority</span>
              {isEditing && editableFields.priority ? (
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1 w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-900 dark:text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              ) : (
                <div className="mt-1.5">
                  <Badge type="priority" value={task.priority} />
                </div>
              )}
            </div>

            {/* Story Points */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Story Points</span>
              {isEditing && editableFields.storyPoints ? (
                <input
                  type="number"
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  className="mt-1 w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-slate-900 dark:text-white"
                />
              ) : (
                <span className="text-sm font-semibold text-slate-950 dark:text-slate-200 mt-1.5 block">
                  {task.storyPoints || 'Unestimated'}
                </span>
              )}
            </div>
          </div>

          {/* Effort tracking */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Efforts & Progress</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Planned Hours</span>
                {isEditing && editableFields.plannedHours ? (
                  <input
                    type="number"
                    value={plannedHours}
                    onChange={(e) => setPlannedHours(e.target.value)}
                    className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{task.plannedHours} hrs</span>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Actual Hours</span>
                {isEditing && editableFields.actualHours ? (
                  <input
                    type="number"
                    value={actualHours}
                    onChange={(e) => setActualHours(e.target.value)}
                    className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{task.actualHours} hrs</span>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Progress</span>
                {isEditing && editableFields.progressPercent ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={progressPercent}
                      onChange={(e) => setProgressPercent(e.target.value)}
                      className="w-16 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-900 dark:text-white"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${task.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{task.progressPercent}%</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Remarks</span>
              {isEditing && editableFields.remarks ? (
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-900 dark:text-white"
                />
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                  {task.remarks || 'No remarks provided.'}
                </p>
              )}
            </div>

            {/* Time Logging */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Time Logs</span>
              
              {/* Form to log time */}
              {canModify && (
                <form onSubmit={handleLogTime} className="bg-slate-100/50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Hours Spent</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        placeholder="e.g. 2.5"
                        value={logHours}
                        onChange={(e) => setLogHours(e.target.value)}
                        className="w-full mt-1 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Date</label>
                      <input
                        type="date"
                        required
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full mt-1 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">What did you do?</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="Describe your work..."
                        value={logDesc}
                        onChange={(e) => setLogDesc(e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                      <Button type="submit" variant="primary" size="sm">Log</Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Time logs list */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {task.timeLogs && task.timeLogs.length > 0 ? (
                  task.timeLogs.map((log) => (
                    <div key={log.id} className="flex justify-between items-start text-xs p-2 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{log.user_name || 'Someone'}</span>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">{log.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-600 dark:text-blue-400">{log.hours} hrs</span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">{formatDate(log.logged_date)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No hours logged yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckSquare size={14} />
              Subtasks
            </h3>
            
            {canModify && (
              <form onSubmit={handleAddSubtask} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <Button type="submit" variant="secondary" size="sm">Add</Button>
              </form>
            )}

            <div className="space-y-2">
              {task.subtasks && task.subtasks.length > 0 ? (
                task.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sub.status === 'Done'}
                        onChange={() => handleToggleSubtask(sub)}
                        disabled={!canModify}
                        className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className={`text-xs ${sub.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-350'}`}>
                        {sub.description}
                      </span>
                    </div>
                    {sub.resourceName && (
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                        {sub.resourceName}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-505 dark:text-slate-500 italic">No subtasks yet.</p>
              )}
            </div>
          </div>

          {/* Dependencies Section */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle size={14} />
              Dependencies (Blocked By)
            </h3>

            {canModify && (
              <div className="flex gap-2 mb-3">
                <select
                  value={selectedDepId}
                  onChange={(e) => setSelectedDepId(e.target.value)}
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-900 dark:text-white"
                >
                  <option value="">Select a task that blocks this...</option>
                  {tasks
                    .filter(t => t.id !== task.id && t.projectId === task.projectId)
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.description} ({t.status})</option>
                    ))}
                </select>
                <Button onClick={handleAddDependency} variant="secondary" size="sm">Block</Button>
              </div>
            )}

            <div className="space-y-1">
              {task.dependencies && task.dependencies.length > 0 ? (
                task.dependencies.map((dep) => {
                  const blockingTask = tasks.find(t => t.id === dep.depends_on_id);
                  return (
                    <div key={dep.id} className="flex items-center justify-between text-xs p-1.5 bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/40">
                      <span className="truncate">{blockingTask?.description || 'Unknown Task'} ({blockingTask?.status || 'N/A'})</span>
                      {canModify && (
                        <button 
                          onClick={() => handleRemoveDependency(dep.depends_on_id)}
                          className="text-[10px] hover:underline uppercase font-bold text-red-655 dark:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-505 dark:text-slate-500 italic">No blocking dependencies.</p>
              )}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 justify-between">
              <span className="flex items-center gap-1.5">
                <Paperclip size={14} />
                Attachments
              </span>
              {uploading && <span className="text-[10px] text-blue-500 animate-pulse font-bold lowercase">Uploading...</span>}
            </h3>

            {/* Upload Button */}
            {canModify && (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:hover:bg-slate-850 dark:bg-slate-900/50 hover:bg-slate-100 dark:border-slate-800">
                  <div className="flex flex-col items-center justify-center pt-3 pb-3">
                    <Paperclip className="w-6 h-6 mb-1 text-slate-400" />
                    <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-semibold text-blue-500">Click to upload</span> a file</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleUploadAttachment} 
                    disabled={uploading}
                  />
                </label>
              </div>
            )}

            {/* Attachments list */}
            <div className="grid grid-cols-2 gap-2">
              {attachments.length > 0 ? (
                attachments.map((att) => (
                  <div 
                    key={att.id} 
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 group"
                  >
                    <a 
                      href={att.publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="truncate hover:underline text-slate-700 dark:text-slate-300 font-medium"
                      title={att.filename}
                    >
                      {att.filename}
                    </a>
                    {canModify && (
                      <button 
                        onClick={() => handleDeleteAttachment(att)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic col-span-2">No attachments uploaded yet.</p>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={16} />
              Comments ({task.comments ? task.comments.length : 0})
            </h3>

            {/* Comments List */}
            <div className="space-y-3">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    <Avatar name={comment.author} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{comment.author}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(comment.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No comments yet. Be the first to start the conversation!</p>
              )}
            </div>

            {/* Add Comment Input */}
            {canModify && (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-950 dark:text-white transition-all"
                />
                <Button type="submit" variant="primary" size="sm">Send</Button>
              </form>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <History size={16} />
            Change History
          </h3>

          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6 py-2">
            {task.activityLog && task.activityLog.length > 0 ? (
              task.activityLog.map((log, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline Dot */}
                  <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                  
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">{log.changedBy}</span>
                    <span className="text-slate-500 dark:text-slate-400"> updated </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{log.fieldChanged}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <span className="text-slate-400 line-through truncate max-w-[150px]">{log.oldValue || 'None'}</span>
                    <span className="text-slate-400">&rarr;</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[180px]">{log.newValue}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {formatDate(log.timestamp)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic pl-0">No changes logged for this task yet.</p>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
