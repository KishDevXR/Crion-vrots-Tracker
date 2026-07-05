import { create } from 'zustand';
import { taskService } from '../services/taskService';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  backlogTasks: [],
  unassignedTasks: [],
  epics: [],
  deliverables: [],
  loading: false,

  // ── TASKS ────────────────────────────────────────────────
  fetchTasks: async (role, user) => {
    set({ loading: true });
    try {
      const tasks = await taskService.getTasks(role, user);
      set({ tasks, loading: false });
    } catch (e) {
      console.error('fetchTasks error:', e);
      set({ loading: false });
    }
  },

  addTask: async (taskData, currentUser) => {
    const task = await taskService.createTask(taskData, currentUser);
    set(s => ({ tasks: [task, ...s.tasks] }));
    return task;
  },

  updateTask: async (taskData, currentUser) => {
    const updated = await taskService.updateTask(taskData, currentUser);
    set(s => ({ tasks: s.tasks.map(t => t.id === updated.id ? updated : t) }));
    return updated;
  },

  deleteTask: async (id) => {
    await taskService.deleteTask(id);
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }));
  },

  changeTaskStatus: async (taskId, newStatus, changedBy) => {
    const task = get().tasks.find(t => t.id === taskId);
    const updated = await taskService.changeStatus(taskId, newStatus, changedBy, task?.projectId);
    set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? updated : t) }));
    return updated;
  },

  addCommentToTask: async (taskId, text, currentUser) => {
    const comment = await taskService.addComment(taskId, text, currentUser);
    set(s => ({
      tasks: s.tasks.map(t =>
        t.id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t
      )
    }));
  },

  // Real-time: called by Supabase subscription in App.jsx
  handleRealtimeTaskChange: (payload) => {
    const { eventType, new: newRow, old: oldRow } = payload;
    if (eventType === 'INSERT') {
      // Refetch to get full task with joins
      taskService.getTask(newRow.id).then(task => {
        if (task) set(s => ({ tasks: [task, ...s.tasks.filter(t => t.id !== task.id)] }));
      });
    } else if (eventType === 'UPDATE') {
      taskService.getTask(newRow.id).then(task => {
        if (task) set(s => ({ tasks: s.tasks.map(t => t.id === task.id ? task : t) }));
      });
    } else if (eventType === 'DELETE') {
      set(s => ({ tasks: s.tasks.filter(t => t.id !== oldRow.id) }));
    }
  },

  // ── BACKLOG ───────────────────────────────────────────────
  fetchBacklogTasks: async () => {
    const items = await taskService.getBacklogItems();
    set({ backlogTasks: items });
  },

  addBacklogTask: async (payload) => {
    const item = await taskService.createBacklogItem(payload);
    set(s => ({ backlogTasks: [item, ...s.backlogTasks] }));
  },

  updateBacklogTask: async (task) => {
    const updated = await taskService.updateBacklogItem(task);
    set(s => ({ backlogTasks: s.backlogTasks.map(t => t.id === updated.id ? updated : t) }));
  },

  deleteBacklogTask: async (id) => {
    await taskService.deleteBacklogItem(id);
    set(s => ({ backlogTasks: s.backlogTasks.filter(t => t.id !== id) }));
  },

  assignBacklogTask: async (id, details, currentUser) => {
    const task = await taskService.promoteBacklogItem(id, details, currentUser);
    set(s => ({
      backlogTasks: s.backlogTasks.filter(t => t.id !== id),
      tasks: task ? [task, ...s.tasks] : s.tasks,
    }));
  },

  // ── UNASSIGNED ────────────────────────────────────────────
  fetchUnassignedTasks: async () => {
    const items = await taskService.getUnassignedTasks();
    set({ unassignedTasks: items });
  },

  addUnassignedTask: async (payload) => {
    const item = await taskService.createUnassignedTask(payload);
    set(s => ({ unassignedTasks: [item, ...s.unassignedTasks] }));
  },

  deleteUnassignedTask: async (id) => {
    await taskService.deleteUnassignedTask(id);
    set(s => ({ unassignedTasks: s.unassignedTasks.filter(t => t.id !== id) }));
  },

  assignUnassignedTask: async (id, details, currentUser) => {
    const task = await taskService.promoteUnassignedTask(id, details, currentUser);
    set(s => ({
      unassignedTasks: s.unassignedTasks.filter(t => t.id !== id),
      tasks: task ? [task, ...s.tasks] : s.tasks,
    }));
  },

  // ── EPICS ─────────────────────────────────────────────────
  fetchEpics: async () => {
    const epics = await taskService.getEpics();
    set({ epics });
  },

  addEpic: async (payload) => {
    const epic = await taskService.createEpic(payload);
    set(s => ({ epics: [epic, ...s.epics] }));
  },

  updateEpic: async (epic) => {
    const updated = await taskService.updateEpic(epic);
    set(s => ({ epics: s.epics.map(e => e.id === updated.id ? updated : e) }));
  },

  // ── DELIVERABLES ──────────────────────────────────────────
  fetchDeliverables: async () => {
    const deliverables = await taskService.getDeliverables();
    set({ deliverables });
  },

  addDeliverable: async (payload) => {
    const d = await taskService.createDeliverable(payload);
    set(s => ({ deliverables: [...s.deliverables, d] }));
  },

  // ── TIME LOGS ─────────────────────────────────────────────
  logTime: async (taskId, entry) => {
    await taskService.logTime(taskId, entry);
    // Refresh task to update actual_hours
    const updated = await taskService.getTask(taskId);
    if (updated) set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? updated : t) }));
  },

  // ── DEPENDENCIES ──────────────────────────────────────────
  addDependency: async (taskId, dependsOnId) => {
    await taskService.addDependency(taskId, dependsOnId);
    const updated = await taskService.getTask(taskId);
    if (updated) set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? updated : t) }));
  },

  removeDependency: async (taskId, dependsOnId) => {
    await taskService.removeDependency(taskId, dependsOnId);
    const updated = await taskService.getTask(taskId);
    if (updated) set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? updated : t) }));
  },
}));
