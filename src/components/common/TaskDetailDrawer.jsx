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
  Paperclip
} from 'lucide-react';

export default function TaskDetailDrawer({ task, isOpen, onClose }) {
  if (!task) return null;

  const { currentRole, currentUser } = useAuthStore();
  const { updateTask, addCommentToTask, changeTaskStatus } = useTaskStore();
  const { projects } = useProjectStore();
  const { sprints } = useSprintStore();
  const { resources } = useResourceStore();

  const editableFields = getTaskEditableFields(currentRole, task, currentUser);
  const canModify = canUpdateTask(currentRole, task, currentUser);

  // Form states
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [storyPoints, setStoryPoints] = useState(task.storyPoints || 0);
  const [plannedHours, setPlannedHours] = useState(task.plannedHours || 0);
  const [actualHours, setActualHours] = useState(task.actualHours || 0);
  const [progressPercent, setProgressPercent] = useState(task.progressPercent || 0);
  const [resourceName, setResourceName] = useState(task.resourceName || '');
  const [epicId, setEpicId] = useState(task.epicId || '');
  const [projectId, setProjectId] = useState(task.projectId || '');
  const [moduleId, setModuleId] = useState(task.moduleId || '');
  const [remarks, setRemarks] = useState(task.remarks || '');
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tab, setTab] = useState('details'); // 'details' | 'history'

  // Update fields when task changes
  useEffect(() => {
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
              {isEditing && editableFields.status ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-900 dark:text-white"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
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
          </div>

          {/* Attachments Stub */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Paperclip size={14} />
              Attachments (Stubs)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <a href="#" className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 transition-colors">
                <span className="truncate">insulin_pen_model_wireframe.fbx</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">Download</span>
              </a>
              <a href="#" className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 transition-colors">
                <span className="truncate">quest2_perf_logs.txt</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">Download</span>
              </a>
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
