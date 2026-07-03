import { create } from 'zustand';
import { dataService } from '../services/dataService';

export const useProjectStore = create((set, get) => ({
  projects: [],
  modules: [],
  loading: false,

  fetchProjects: (role) => {
    set({ loading: true });
    const projects = dataService.getProjects(role);
    set({ projects, loading: false });
  },

  fetchModules: (role) => {
    set({ loading: true });
    const modules = dataService.getModules(role);
    set({ modules, loading: false });
  },

  addProject: (project) => {
    const newProj = dataService.saveProject({
      id: `proj-${Date.now()}`,
      status: 'Active',
      ...project
    });
    set(state => ({ projects: [...state.projects, newProj] }));
  },

  updateProject: (project) => {
    const updated = dataService.saveProject(project);
    set(state => ({
      projects: state.projects.map(p => p.id === updated.id ? updated : p)
    }));
  },

  deleteProject: (id) => {
    dataService.deleteProject(id);
    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
      modules: state.modules.filter(m => m.projectId !== id) // Cascade delete modules
    }));
  },

  addModule: (moduleItem) => {
    const newMod = dataService.saveModule({
      id: `mod-${Date.now()}`,
      status: 'Pending',
      percentComplete: 0,
      effortsHours: 0,
      ...moduleItem
    });
    set(state => ({ modules: [...state.modules, newMod] }));
  },

  updateModule: (moduleItem) => {
    const updated = dataService.saveModule(moduleItem);
    set(state => ({
      modules: state.modules.map(m => m.id === updated.id ? updated : m)
    }));
  },

  deleteModule: (id) => {
    dataService.deleteModule(id);
    set(state => ({
      modules: state.modules.filter(m => m.id !== id)
    }));
  }
}));
