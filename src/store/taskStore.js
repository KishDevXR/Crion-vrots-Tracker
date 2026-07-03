import { create } from 'zustand';
import { dataService } from '../services/dataService';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  unassignedTasks: [],
  backlogTasks: [],
  epics: [],
  deliverables: [],
  loading: false,

  fetchTasks: (role, currentUser) => {
    set({ loading: true });
    const tasks = dataService.getTasks(role, currentUser);
    set({ tasks, loading: false });
  },

  fetchUnassignedTasks: () => {
    const unassignedTasks = dataService.getUnassignedTasks();
    set({ unassignedTasks });
  },

  fetchBacklogTasks: () => {
    const backlogTasks = dataService.getBacklogTasks();
    set({ backlogTasks });
  },

  fetchEpics: () => {
    const epics = dataService.getEpics();
    set({ epics });
  },

  fetchDeliverables: () => {
    const deliverables = dataService.getDeliverables();
    set({ deliverables });
  },

  addTask: (task, changedBy) => {
    const newTask = dataService.saveTask({
      id: `task-${Date.now()}`,
      status: 'Not Started',
      progressPercent: 0,
      actualHours: 0,
      comments: [],
      activityLog: [],
      updatedBy: changedBy,
      ...task
    });
    set(state => ({ tasks: [...state.tasks, newTask] }));
    // If it's linked to an epic, update epic
    if (task.epicId) {
      get().linkTaskToEpic(task.epicId, newTask.id);
    }
  },

  updateTask: (task, changedBy) => {
    const updated = dataService.saveTask({
      ...task,
      updatedBy: changedBy
    });
    set(state => ({
      tasks: state.tasks.map(t => t.id === updated.id ? updated : t)
    }));
    // If epic changed, adjust epic linkages
    if (task.epicId) {
      get().linkTaskToEpic(task.epicId, task.id);
    }
  },

  deleteTask: (id) => {
    dataService.deleteTask(id);
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }));
  },

  // --- Comments ---
  addCommentToTask: (taskId, text, author) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const newComment = {
      author,
      timestamp: new Date().toISOString(),
      text
    };

    const updatedTask = {
      ...task,
      comments: [...(task.comments || []), newComment],
      updatedBy: author
    };

    dataService.saveTask(updatedTask);
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t)
    }));
  },

  // --- Unassigned Tasks ---
  addUnassignedTask: (task) => {
    const newTask = dataService.saveUnassignedTask({
      id: `un-${Date.now()}`,
      ...task
    });
    set(state => ({ unassignedTasks: [...state.unassignedTasks, newTask] }));
  },

  deleteUnassignedTask: (id) => {
    dataService.deleteUnassignedTask(id);
    set(state => ({
      unassignedTasks: state.unassignedTasks.filter(t => t.id !== id)
    }));
  },

  assignUnassignedTask: (unTaskId, taskDetails, changedBy) => {
    const unTask = get().unassignedTasks.find(t => t.id === unTaskId);
    if (!unTask) return;

    // Create a new active task from the unassigned one
    const newTask = {
      id: `task-${Date.now()}`,
      projectId: unTask.projectId,
      moduleId: unTask.moduleId,
      description: unTask.description,
      plannedHours: unTask.plannedHours,
      role: taskDetails.role || 'Developer',
      resourceName: taskDetails.resourceName || '',
      manager: taskDetails.manager || 'Admin',
      status: 'Not Started',
      priority: taskDetails.priority || 'Medium',
      storyPoints: taskDetails.storyPoints || 3,
      startDate: taskDetails.startDate || new Date().toISOString().split('T')[0],
      endDate: taskDetails.endDate || new Date().toISOString().split('T')[0],
      actualHours: 0,
      progressPercent: 0,
      comments: [],
      activityLog: [{
        fieldChanged: 'created_from_unassigned',
        oldValue: '',
        newValue: `Created from Unassigned Task ${unTaskId}`,
        changedBy,
        timestamp: new Date().toISOString()
      }]
    };

    dataService.saveTask(newTask);
    dataService.deleteUnassignedTask(unTaskId);

    set(state => ({
      tasks: [...state.tasks, newTask],
      unassignedTasks: state.unassignedTasks.filter(t => t.id !== unTaskId)
    }));
  },

  // --- Backlog Tasks ---
  addBacklogTask: (task) => {
    const newTask = dataService.saveBacklogTask({
      id: `backlog-${Date.now()}`,
      status: 'Backlog',
      ...task
    });
    set(state => ({ backlogTasks: [...state.backlogTasks, newTask] }));
  },

  updateBacklogTask: (task) => {
    const updated = dataService.saveBacklogTask(task);
    set(state => ({
      backlogTasks: state.backlogTasks.map(t => t.id === updated.id ? updated : t)
    }));
  },

  deleteBacklogTask: (id) => {
    dataService.deleteBacklogTask(id);
    set(state => ({
      backlogTasks: state.backlogTasks.filter(t => t.id !== id)
    }));
  },

  assignBacklogTask: (backlogTaskId, taskDetails, changedBy) => {
    const backlogTask = get().backlogTasks.find(t => t.id === backlogTaskId);
    if (!backlogTask) return;

    const newTask = {
      id: `task-${Date.now()}`,
      projectId: backlogTask.projectId,
      moduleId: backlogTask.moduleId,
      description: backlogTask.description,
      plannedHours: backlogTask.plannedHours,
      role: taskDetails.role || 'Developer',
      resourceName: taskDetails.resourceName || backlogTask.assignedTo || '',
      manager: taskDetails.manager || 'Admin',
      status: 'Not Started',
      priority: backlogTask.priority || 'Medium',
      storyPoints: taskDetails.storyPoints || 3,
      startDate: taskDetails.startDate || new Date().toISOString().split('T')[0],
      endDate: taskDetails.endDate || new Date().toISOString().split('T')[0],
      actualHours: 0,
      progressPercent: 0,
      comments: [],
      activityLog: [{
        fieldChanged: 'created_from_backlog',
        oldValue: '',
        newValue: `Created from Backlog Task ${backlogTaskId}`,
        changedBy,
        timestamp: new Date().toISOString()
      }]
    };

    dataService.saveTask(newTask);
    dataService.deleteBacklogTask(backlogTaskId);

    set(state => ({
      tasks: [...state.tasks, newTask],
      backlogTasks: state.backlogTasks.filter(t => t.id !== backlogTaskId)
    }));
  },

  // --- Epics ---
  addEpic: (epic) => {
    const newEpic = dataService.saveEpic({
      id: `epic-${Date.now()}`,
      status: 'In Progress',
      ...epic
    });
    set(state => ({ epics: [...state.epics, newEpic] }));
  },

  updateEpic: (epic) => {
    const updated = dataService.saveEpic(epic);
    set(state => ({
      epics: state.epics.map(e => e.id === updated.id ? updated : e)
    }));
  },

  deleteEpic: (id) => {
    dataService.deleteEpic(id);
    set(state => ({
      epics: state.epics.filter(e => e.id !== id)
    }));
  },

  linkTaskToEpic: (epicId, taskId) => {
    const epics = get().epics;
    const updatedEpics = epics.map(e => {
      // Remove task from any other epic it might be linked to
      let linked = e.linkedTaskIds || [];
      if (e.id === epicId) {
        if (!linked.includes(taskId)) {
          linked = [...linked, taskId];
        }
      } else {
        linked = linked.filter(id => id !== taskId);
      }
      const updatedEpic = { ...e, linkedTaskIds: linked };
      dataService.saveEpic(updatedEpic);
      return updatedEpic;
    });
    set({ epics: updatedEpics });
  },

  // --- Deliverables ---
  addDeliverable: (del) => {
    const newDel = dataService.saveDeliverable({
      id: `del-${Date.now()}`,
      ...del
    });
    set(state => ({ deliverables: [...state.deliverables, newDel] }));
  },

  updateDeliverable: (del) => {
    const updated = dataService.saveDeliverable(del);
    set(state => ({
      deliverables: state.deliverables.map(d => d.id === updated.id ? updated : d)
    }));
  },

  deleteDeliverable: (id) => {
    dataService.deleteDeliverable(id);
    set(state => ({
      deliverables: state.deliverables.filter(d => d.id !== id)
    }));
  },

  // --- Drag and Drop Status Change ---
  changeTaskStatus: (taskId, newStatus, changedBy) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    let progressPercent = task.progressPercent;
    if (newStatus === 'Done') {
      progressPercent = 100;
    } else if (newStatus === 'Not Started') {
      progressPercent = 0;
    }

    const updatedTask = {
      ...task,
      status: newStatus,
      progressPercent,
      updatedBy
    };

    dataService.saveTask(updatedTask);
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus, progressPercent, activityLog: updatedTask.activityLog } : t)
    }));
  }
}));
