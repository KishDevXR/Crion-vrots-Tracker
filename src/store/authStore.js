import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set, get) => ({
  currentRole: null,
  currentUser: null,
  currentUserId: null,
  isLoggedIn: false,
  isLoading: true,
  users: [],

  // Called on app mount — restore session from Supabase
  initSession: async () => {
    set({ isLoading: true });
    try {
      const result = await authService.getSession();
      if (result?.profile) {
        set({
          isLoggedIn: true,
          currentRole: result.profile.role,
          currentUser: result.profile.name,
          currentUserId: result.profile.id,
          isLoading: false,
        });
        // Fetch user list if admin
        if (result.profile.role === 'Admin') {
          await get().fetchUsers();
        }
      } else {
        set({ isLoggedIn: false, isLoading: false });
      }
    } catch {
      set({ isLoggedIn: false, isLoading: false });
    }
  },

  fetchUsers: async () => {
    try {
      const profiles = await authService.getAllProfiles();
      const mapped = (profiles || []).map(p => ({
        id: p.id,
        username: p.email ? p.email.split('@')[0] : '',
        name: p.name || '',
        role: p.role || 'Team Member',
        password: '••••••••', // password is secure in Supabase Auth
      }));
      set({ users: mapped });
    } catch (e) {
      console.error('fetchUsers error:', e);
    }
  },

  login: async (username, password) => {
    const { profile } = await authService.login(username, password);
    set({
      isLoggedIn: true,
      currentRole: profile.role,
      currentUser: profile.name,
      currentUserId: profile.id,
    });
    if (profile.role === 'Admin') {
      await get().fetchUsers();
    }
    return profile;
  },

  logout: async () => {
    await authService.logout();
    set({ isLoggedIn: false, currentRole: null, currentUser: null, currentUserId: null, users: [] });
  },

  // Allow role switching (dev/admin tool — only if Admin)
  setRole: (role, user) => set({ currentRole: role, currentUser: user }),

  updateProfile: async (updates) => {
    const id = get().currentUserId;
    if (!id) return;
    const updated = await authService.updateProfile(id, updates);
    set({ currentUser: updated.name, currentRole: updated.role });
    await get().fetchUsers();
  },

  addUser: async (payload) => {
    await authService.createUser({
      username: payload.username,
      password: payload.password,
      name: payload.name,
      role: payload.role,
    });
    await get().fetchUsers();
  },

  updateUser: async (username, payload) => {
    // Find user profile by username to get their ID
    const userObj = get().users.find(u => u.username === username);
    if (!userObj) return;
    await authService.updateProfile(userObj.id, {
      name: payload.name,
      role: payload.role,
    });
    await get().fetchUsers();
  },

  deleteUser: async (username) => {
    const userObj = get().users.find(u => u.username === username);
    if (!userObj) return;
    await authService.deleteProfile(userObj.id);
    await get().fetchUsers();
  },
}));
