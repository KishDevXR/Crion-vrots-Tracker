import { create } from 'zustand';
import { resourceService } from '../services/resourceService';

export const useResourceStore = create((set, get) => ({
  resources: [],
  hiringRequests: [],
  skillDevelopments: [],
  loading: false,

  fetchResources: async () => {
    set({ loading: true });
    try {
      const resources = await resourceService.getResources();
      set({ resources, loading: false });
    } catch (e) {
      console.error('fetchResources error:', e);
      set({ loading: false });
    }
  },

  fetchHiringRequests: async () => {
    try {
      const hiringRequests = await resourceService.getHiringRequests();
      set({ hiringRequests });
    } catch (e) {
      console.error('fetchHiringRequests error:', e);
    }
  },

  fetchSkillDevelopments: async () => {
    try {
      const skillDevelopments = await resourceService.getSkillDevelopments();
      set({ skillDevelopments });
    } catch (e) {
      console.error('fetchSkillDevelopments error:', e);
    }
  },

  addResource: async (resource) => {
    // Note: Resources are profiles. To add a resource in Supabase, we typically sign them up or Admin registers them.
    // However, if we just want to update/upsert profile details, we use updateResource.
    // For compatibility with local updates, we will call updateResource or handle it via authService.createUser.
    // Here we check if the resource already has an ID, otherwise we don't directly insert random UUIDs to public.profiles.
    // Let's implement update profile for existing ones.
    const updated = await resourceService.updateResource(resource);
    await get().fetchResources();
    return updated;
  },

  updateResource: async (resource) => {
    const updated = await resourceService.updateResource(resource);
    await get().fetchResources();
    return updated;
  },

  deleteResource: async (id) => {
    // In our DB schema public.profiles are tied to auth.users, deleting a resource requires deleting the auth user.
    // For safety, we can clear resource fields or if needed implement delete call. Let's keep it safe.
    console.warn("Delete profile must be done via Auth admin delete. Skipping DB removal of user.");
  },

  // --- Hiring Requests ---
  addHiringRequest: async (req) => {
    try {
      const newReq = await resourceService.createHiringRequest(req);
      set(state => ({ hiringRequests: [newReq, ...state.hiringRequests] }));
    } catch (e) {
      console.error('addHiringRequest error:', e);
    }
  },

  updateHiringRequest: async (req) => {
    try {
      const updated = await resourceService.updateHiringRequest(req);
      set(state => ({
        hiringRequests: state.hiringRequests.map(h => h.id === updated.id ? updated : h)
      }));
    } catch (e) {
      console.error('updateHiringRequest error:', e);
    }
  },

  deleteHiringRequest: async (id) => {
    try {
      await resourceService.deleteHiringRequest(id);
      set(state => ({
        hiringRequests: state.hiringRequests.filter(h => h.id !== id)
      }));
    } catch (e) {
      console.error('deleteHiringRequest error:', e);
    }
  },

  // --- Skill Developments ---
  addSkillDevelopment: async (skill) => {
    try {
      const newSkill = await resourceService.createSkillDevelopment(skill);
      set(state => ({ skillDevelopments: [newSkill, ...state.skillDevelopments] }));
    } catch (e) {
      console.error('addSkillDevelopment error:', e);
    }
  },

  updateSkillDevelopment: async (skill) => {
    try {
      const updated = await resourceService.updateSkillDevelopment(skill);
      set(state => ({
        skillDevelopments: state.skillDevelopments.map(s => s.id === updated.id ? updated : s)
      }));
    } catch (e) {
      console.error('updateSkillDevelopment error:', e);
    }
  },

  deleteSkillDevelopment: async (id) => {
    // Not explicitly in schema or service, but we can delete from public.skill_developments if needed.
    // Let's support deletion from the state.
    set(state => ({
      skillDevelopments: state.skillDevelopments.filter(s => s.id !== id)
    }));
  }
}));
