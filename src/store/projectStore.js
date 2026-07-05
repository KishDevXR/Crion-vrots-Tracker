import { create } from 'zustand';
import { projectService } from '../services/projectService';

export const useProjectStore = create((set) => ({
  projects: [],
  modules: [],
  loading: false,

  fetchProjects: async (role) => {
    set({ loading: true });
    try {
      const projects = await projectService.getProjects(role);
      set({ projects, loading: false });
    } catch (e) {
      console.error('fetchProjects error:', e);
      set({ loading: false });
    }
  },

  fetchModules: async (role) => {
    const modules = await projectService.getModules(role);
    set({ modules });
  },

  addProject: async (payload) => {
    const project = await projectService.createProject(payload);
    set(s => ({ projects: [project, ...s.projects] }));
  },

  updateProject: async (payload) => {
    const updated = await projectService.updateProject(payload);
    set(s => ({ projects: s.projects.map(p => p.id === updated.id ? updated : p) }));
  },

  deleteProject: async (id) => {
    await projectService.deleteProject(id);
    set(s => ({
      projects: s.projects.filter(p => p.id !== id),
      modules: s.modules.filter(m => m.projectId !== id),
    }));
  },

  addModule: async (payload) => {
    const mod = await projectService.createModule(payload);
    set(s => ({ modules: [mod, ...s.modules] }));
  },

  updateModule: async (payload) => {
    const updated = await projectService.updateModule(payload);
    set(s => ({ modules: s.modules.map(m => m.id === updated.id ? updated : m) }));
  },

  deleteModule: async (id) => {
    await projectService.deleteModule(id);
    set(s => ({ modules: s.modules.filter(m => m.id !== id) }));
  },
}));
