import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

const defaultUsers = [
  { username: 'admin', password: 'admin', name: 'Admin', role: 'Admin' },
  { username: 'manager', password: 'manager', name: 'Manager', role: 'Manager' },
  { username: 'member', password: 'member', name: 'Team Member', role: 'Team Member' },
  { username: 'stakeholder', password: 'stakeholder', name: 'Stakeholder', role: 'Stakeholder' }
];

const pushUsersToSupabase = (users) => {
  supabase
    .from('tracker_store')
    .upsert({ key: 'crion_vrots_users_list', value: users }, { onConflict: 'key' })
    .then(({ error }) => {
      if (error) {
        console.error("Error syncing users to Supabase:", error);
      }
    });
};

export const useAuthStore = create((set, get) => {
  // Load initial auth state from localStorage or default
  const savedRole = localStorage.getItem('crion_vrots_role');
  let savedUser = localStorage.getItem('crion_vrots_user');
  if (savedUser === 'Kaleeshwaren') {
    savedUser = 'Admin';
    localStorage.setItem('crion_vrots_user', 'Admin');
  }

  const storedUsers = localStorage.getItem('crion_vrots_users_list');
  const initialUsers = storedUsers ? JSON.parse(storedUsers) : defaultUsers;
  if (!storedUsers) {
    localStorage.setItem('crion_vrots_users_list', JSON.stringify(defaultUsers));
  }

  return {
    currentRole: savedRole || 'Admin',
    currentUser: savedUser || 'Admin',
    isAuthenticated: !!savedUser,
    users: initialUsers,
    
    // Allow reloading users from local storage after sync
    reloadUsers: () => {
      const updated = localStorage.getItem('crion_vrots_users_list');
      if (updated) {
        set({ users: JSON.parse(updated) });
      }
    },

    login: (username, password) => {
      const u = username.trim().toLowerCase();
      const p = password.trim().toLowerCase();
      
      const found = get().users.find(
        x => x.username.toLowerCase() === u && x.password.toLowerCase() === p
      );
      
      if (found) {
        localStorage.setItem('crion_vrots_role', found.role);
        localStorage.setItem('crion_vrots_user', found.name);
        set({ currentRole: found.role, currentUser: found.name, isAuthenticated: true });
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials. Hint: check username and password.' };
      }
    },

    setRole: (role, user) => {
      const finalUser = user || (role === 'Admin' ? 'Admin' : role + ' User');
      localStorage.setItem('crion_vrots_role', role);
      localStorage.setItem('crion_vrots_user', finalUser);
      set({ currentRole: role, currentUser: finalUser, isAuthenticated: true });
    },
    
    logout: () => {
      localStorage.removeItem('crion_vrots_role');
      localStorage.removeItem('crion_vrots_user');
      set({ currentRole: 'Team Member', currentUser: 'Team Member', isAuthenticated: false });
    },

    addUser: (user) => {
      const updated = [...get().users, user];
      localStorage.setItem('crion_vrots_users_list', JSON.stringify(updated));
      set({ users: updated });
      pushUsersToSupabase(updated);
    },

    updateUser: (username, updatedFields) => {
      const updated = get().users.map(u => 
        u.username.toLowerCase() === username.toLowerCase() ? { ...u, ...updatedFields } : u
      );
      localStorage.setItem('crion_vrots_users_list', JSON.stringify(updated));
      set({ users: updated });
      pushUsersToSupabase(updated);

      // If the updated user is the current user, update session details too
      const currentUserObj = get().users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (currentUserObj && get().currentUser === currentUserObj.name) {
        if (updatedFields.name) {
          localStorage.setItem('crion_vrots_user', updatedFields.name);
          set({ currentUser: updatedFields.name });
        }
        if (updatedFields.role) {
          localStorage.setItem('crion_vrots_role', updatedFields.role);
          set({ currentRole: updatedFields.role });
        }
      }
    },

    deleteUser: (username) => {
      const updated = get().users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
      localStorage.setItem('crion_vrots_users_list', JSON.stringify(updated));
      set({ users: updated });
      pushUsersToSupabase(updated);
    }
  };
});
