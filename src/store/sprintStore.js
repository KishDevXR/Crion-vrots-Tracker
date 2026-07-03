import { create } from 'zustand';
import { dataService } from '../services/dataService';

export const useSprintStore = create((set, get) => ({
  sprints: [],
  loading: false,

  fetchSprints: () => {
    set({ loading: true });
    const sprints = dataService.getSprints();
    set({ sprints, loading: false });
  },

  addSprint: (sprint) => {
    const newSprint = dataService.saveSprint({
      id: `sprint-${Date.now()}`,
      status: 'Planned',
      capacityHours: 0,
      committedStoryPoints: 0,
      completedStoryPoints: 0,
      ...sprint
    });
    set(state => ({ sprints: [...state.sprints, newSprint] }));
    return newSprint;
  },

  updateSprint: (sprint) => {
    const updated = dataService.saveSprint(sprint);
    set(state => ({
      sprints: state.sprints.map(s => s.id === updated.id ? updated : s)
    }));
  },

  deleteSprint: (id) => {
    dataService.deleteSprint(id);
    set(state => ({
      sprints: state.sprints.filter(s => s.id !== id)
    }));
  },

  // Start Sprint: Enforce only one Active sprint per project
  startSprint: (sprintId, projectId) => {
    const sprints = get().sprints;
    
    // Check if there is already an active sprint for this project
    const activeSprint = sprints.find(s => s.projectId === projectId && s.status === 'Active');
    if (activeSprint) {
      throw new Error(`Cannot start sprint: There is already an active sprint "${activeSprint.name}" for this project.`);
    }

    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    const updatedSprint = { ...sprint, status: 'Active' };
    dataService.saveSprint(updatedSprint);
    
    set({
      sprints: sprints.map(s => s.id === sprintId ? updatedSprint : s)
    });
  },

  // Complete Sprint: Mark completed, return incomplete tasks back to backlog
  completeSprint: (sprintId, retroNotes, tasks, updateTaskInStore) => {
    const sprints = get().sprints;
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    // Filter tasks belonging to this sprint
    const sprintTasks = tasks.filter(t => t.sprintId === sprintId);
    const completedTasks = sprintTasks.filter(t => t.status === 'Done');
    
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const committedPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Update incomplete tasks: move back to backlog (sprintId = null)
    sprintTasks.forEach(task => {
      if (task.status !== 'Done') {
        const updatedTask = {
          ...task,
          sprintId: null, // Move back to backlog
          updatedBy: 'System (Sprint Completion)'
        };
        dataService.saveTask(updatedTask);
        updateTaskInStore(updatedTask);
      }
    });

    const updatedSprint = {
      ...sprint,
      status: 'Completed',
      retroNotes, // Retro notes: what went well / what didn't / action items
      committedStoryPoints: committedPoints,
      completedStoryPoints: completedPoints
    };

    dataService.saveSprint(updatedSprint);
    set({
      sprints: sprints.map(s => s.id === sprintId ? updatedSprint : s)
    });
  }
}));
