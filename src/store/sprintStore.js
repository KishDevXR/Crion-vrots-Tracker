import { create } from 'zustand';
import { sprintService } from '../services/sprintService';

export const useSprintStore = create((set) => ({
  sprints: [],
  loading: false,

  fetchSprints: async () => {
    set({ loading: true });
    try {
      const sprints = await sprintService.getSprints();
      set({ sprints, loading: false });
    } catch (e) {
      console.error('fetchSprints error:', e);
      set({ loading: false });
    }
  },

  addSprint: async (payload) => {
    const sprint = await sprintService.createSprint(payload);
    set(s => ({ sprints: [sprint, ...s.sprints] }));
  },

  updateSprint: async (payload) => {
    const updated = await sprintService.updateSprint(payload);
    set(s => ({ sprints: s.sprints.map(sp => sp.id === updated.id ? updated : sp) }));
  },

  deleteSprint: async (id) => {
    await sprintService.deleteSprint(id);
    set(s => ({ sprints: s.sprints.filter(sp => sp.id !== id) }));
  },

  startSprint: async (id) => {
    const updated = await sprintService.startSprint(id);
    set(s => ({ sprints: s.sprints.map(sp => sp.id === id ? updated : sp) }));
  },

  completeSprint: async (id, retroNotes) => {
    const updated = await sprintService.completeSprint(id, retroNotes);
    set(s => ({ sprints: s.sprints.map(sp => sp.id === id ? updated : sp) }));
    return updated;
  },
}));
