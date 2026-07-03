import { create } from 'zustand';
import { dataService } from '../services/dataService';

export const useResourceStore = create((set, get) => ({
  resources: [],
  hiringRequests: [],
  skillDevelopments: [],
  loading: false,

  fetchResources: (role) => {
    set({ loading: true });
    const resources = dataService.getResources(role);
    set({ resources, loading: false });
  },

  fetchHiringRequests: () => {
    const hiringRequests = dataService.getHiringRequests();
    set({ hiringRequests });
  },

  fetchSkillDevelopments: () => {
    const skillDevelopments = dataService.getSkillDevelopments();
    set({ skillDevelopments });
  },

  addResource: (resource, role) => {
    const newRes = dataService.saveResource({
      id: `res-${Date.now()}`,
      weeklyPlannedHours: 40,
      weeklyActualHours: 0,
      utilizationPercent: 0,
      ...resource
    }, role);
    
    // Refresh resource list to apply role filtering
    get().fetchResources(role);
    return newRes;
  },

  updateResource: (resource, role) => {
    const updated = dataService.saveResource(resource, role);
    // Refresh resource list to apply role filtering
    get().fetchResources(role);
    return updated;
  },

  deleteResource: (id, role) => {
    dataService.deleteResource(id);
    get().fetchResources(role);
  },

  // --- Hiring Requests ---
  addHiringRequest: (req) => {
    const newReq = dataService.saveHiringRequest({
      id: `hire-${Date.now()}`,
      status: 'Approved',
      ...req
    });
    set(state => ({ hiringRequests: [...state.hiringRequests, newReq] }));
  },

  updateHiringRequest: (req) => {
    const updated = dataService.saveHiringRequest(req);
    set(state => ({
      hiringRequests: state.hiringRequests.map(h => h.id === updated.id ? updated : h)
    }));
  },

  deleteHiringRequest: (id) => {
    dataService.deleteHiringRequest(id);
    set(state => ({
      hiringRequests: state.hiringRequests.filter(h => h.id !== id)
    }));
  },

  // --- Skill Developments ---
  addSkillDevelopment: (skill) => {
    const newSkill = dataService.saveSkillDevelopment({
      id: `skill-${Date.now()}`,
      status: 'Planned',
      ...skill
    });
    set(state => ({ skillDevelopments: [...state.skillDevelopments, newSkill] }));
  },

  updateSkillDevelopment: (skill) => {
    const updated = dataService.saveSkillDevelopment(skill);
    set(state => ({
      skillDevelopments: state.skillDevelopments.map(s => s.id === updated.id ? updated : s)
    }));
  },

  deleteSkillDevelopment: (id) => {
    dataService.deleteSkillDevelopment(id);
    set(state => ({
      skillDevelopments: state.skillDevelopments.filter(s => s.id !== id)
    }));
  }
}));
