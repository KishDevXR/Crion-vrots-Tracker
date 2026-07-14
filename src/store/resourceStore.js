import { create } from 'zustand';
import { resourceService } from '../services/resourceService';
import { authService } from '../services/authService';

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
    try {
      // 1. Create a corresponding auth user first to establish a profile UUID
      const username = resource.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'; // safe random password

      const user = await authService.createUser({
        username: username || `res_${Date.now()}`,
        password: tempPassword,
        name: resource.name,
        role: 'Team Member', // Use valid check-constrained role 'Team Member'
        hourlyRate: resource.hourlyRate || 50,
      });

      if (!user?.id) {
        throw new Error('Failed to create auth user for resource');
      }

      // 2. Update the newly created profile with planning details & skills
      const updated = await resourceService.updateResource({
        id: user.id,
        name: resource.name,
        role: 'Team Member',
        specialization: resource.specialization || resource.role,
        skills: resource.skills,
        weeklyPlannedHours: resource.weeklyPlannedHours,
        utilizationPercent: resource.utilizationPercent,
        hourlyRate: resource.hourlyRate || 50,
      });

      await get().fetchResources();
      return updated;
    } catch (error) {
      console.error('addResource error:', error);
      throw error;
    }
  },

  updateResource: async (resource) => {
    const isSystemRole = ['Admin', 'Manager', 'Team Member', 'Stakeholder'].includes(resource.role);
    const payload = {
      ...resource,
      role: isSystemRole ? resource.role : 'Team Member',
      specialization: isSystemRole ? (resource.specialization || null) : (resource.role || resource.specialization)
    };
    const updated = await resourceService.updateResource(payload);
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
  },

  handleRealtimeResourceChange: (payload) => {
    const { eventType, new: newRow, old: oldRow } = payload;
    if (eventType === 'INSERT') {
      const mapped = {
        id: newRow.id,
        name: newRow.name,
        role: newRow.role,
        specialization: newRow.specialization || null,
        weeklyPlannedHours: newRow.weekly_planned_hours || 40,
        weeklyActualHours: newRow.weekly_actual_hours || 0,
        utilizationPercent: newRow.utilization_percent || 0,
        hourlyRate: parseFloat(newRow.hourly_rate) || 50,
        skills: newRow.skills || [],
        avatarUrl: newRow.avatar_url || null,
      };
      set(s => ({ resources: [mapped, ...s.resources.filter(r => r.id !== mapped.id)].sort((a, b) => a.name.localeCompare(b.name)) }));
    } else if (eventType === 'UPDATE') {
      const mapped = {
        id: newRow.id,
        name: newRow.name,
        role: newRow.role,
        specialization: newRow.specialization || null,
        weeklyPlannedHours: newRow.weekly_planned_hours || 40,
        weeklyActualHours: newRow.weekly_actual_hours || 0,
        utilizationPercent: newRow.utilization_percent || 0,
        hourlyRate: parseFloat(newRow.hourly_rate) || 50,
        skills: newRow.skills || [],
        avatarUrl: newRow.avatar_url || null,
      };
      set(s => ({ resources: s.resources.map(r => r.id === mapped.id ? mapped : r).sort((a, b) => a.name.localeCompare(b.name)) }));
    } else if (eventType === 'DELETE') {
      set(s => ({ resources: s.resources.filter(r => r.id !== oldRow.id) }));
    }
  }
}));
