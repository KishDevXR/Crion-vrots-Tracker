import { create } from 'zustand';
import { notificationService } from '../services/notificationService';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (userId) => {
    if (!userId) return;
    set({ loading: true });
    try {
      const data = await notificationService.getNotifications(userId);
      set({ 
        notifications: data, 
        unreadCount: data.filter(n => !n.is_read).length,
        loading: false 
      });
    } catch (e) {
      console.error('fetchNotifications error:', e);
      set({ loading: false });
    }
  },

  markAllRead: async (userId) => {
    if (!userId) return;
    try {
      await notificationService.markAllRead(userId);
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (e) {
      console.error('markAllRead error:', e);
    }
  },

  markRead: async (id) => {
    try {
      await notificationService.markRead(id);
      set(state => {
        const notifications = state.notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        );
        return {
          notifications,
          unreadCount: notifications.filter(n => !n.is_read).length
        };
      });
    } catch (e) {
      console.error('markRead error:', e);
    }
  },

  clearAll: async (userId) => {
    if (!userId) return;
    try {
      await notificationService.clearAll(userId);
      set({ notifications: [], unreadCount: 0 });
    } catch (e) {
      console.error('clearAll error:', e);
    }
  },

  // Real-time: receive a new notification live
  addLiveNotification: (notif) => {
    set(state => {
      const exists = state.notifications.some(n => n.id === notif.id);
      if (exists) return {};
      const updated = [notif, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.is_read).length
      };
    });
  }
}));
