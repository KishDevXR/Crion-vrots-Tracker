import { create } from 'zustand';
import { qaService } from '../services/qaService';

export const useQAStore = create((set) => ({
  builds: [],
  bugs: [],
  changeRequests: [],
  loading: false,

  fetchBuilds: async () => {
    set({ loading: true });
    try {
      const builds = await qaService.getBuilds();
      set({ builds, loading: false });
    } catch (e) {
      console.error('fetchBuilds error:', e);
      set({ loading: false });
    }
  },

  addBuild: async (payload) => {
    const build = await qaService.createBuild(payload);
    set((s) => ({ builds: [build, ...s.builds] }));
  },

  updateBuild: async (payload) => {
    const updated = await qaService.updateBuild(payload);
    set((s) => ({ builds: s.builds.map((b) => (b.id === updated.id ? updated : b)) }));
  },

  deleteBuild: async (id) => {
    await qaService.deleteBuild(id);
    set((s) => ({ builds: s.builds.filter((b) => b.id !== id) }));
  },

  fetchBugs: async () => {
    set({ loading: true });
    try {
      const bugs = await qaService.getBugs();
      set({ bugs, loading: false });
    } catch (e) {
      console.error('fetchBugs error:', e);
      set({ loading: false });
    }
  },

  addBug: async (payload) => {
    const bug = await qaService.createBug(payload);
    set((s) => ({ bugs: [bug, ...s.bugs] }));
  },

  updateBug: async (payload) => {
    const updated = await qaService.updateBug(payload);
    set((s) => ({ bugs: s.bugs.map((b) => (b.id === updated.id ? updated : b)) }));
  },

  deleteBug: async (id) => {
    await qaService.deleteBug(id);
    set((s) => ({ bugs: s.bugs.filter((b) => b.id !== id) }));
  },

  fetchChangeRequests: async () => {
    set({ loading: true });
    try {
      const changeRequests = await qaService.getChangeRequests();
      set({ changeRequests, loading: false });
    } catch (e) {
      console.error('fetchChangeRequests error:', e);
      set({ loading: false });
    }
  },

  addChangeRequest: async (payload) => {
    const cr = await qaService.createChangeRequest(payload);
    set((s) => ({ changeRequests: [cr, ...s.changeRequests] }));
  },

  updateChangeRequest: async (payload) => {
    const updated = await qaService.updateChangeRequest(payload);
    set((s) => ({ changeRequests: s.changeRequests.map((c) => (c.id === updated.id ? updated : c)) }));
  },

  deleteChangeRequest: async (id) => {
    await qaService.deleteChangeRequest(id);
    set((s) => ({ changeRequests: s.changeRequests.filter((c) => c.id !== id) }));
  },
}));
