import { supabase } from './supabaseClient';

export const notificationService = {
  async getNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async markAllRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    if (error) throw error;
  },

  async markRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw error;
  },

  async clearAll(userId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  },

  // Create a notification for a specific user
  async createNotification(userId, { type, title, body = '', entityId = null, entityType = 'task' }) {
    const { error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, body, entity_id: entityId, entity_type: entityType });
    if (error) console.error('Notification error:', error);
  },

  // Create notifications for all profiles matching a role
  async notifyRole(role, notification) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', role);

    if (!profiles?.length) return;

    const inserts = profiles.map(p => ({
      user_id: p.id,
      type: notification.type,
      title: notification.title,
      body: notification.body || '',
      entity_id: notification.entityId || null,
      entity_type: notification.entityType || 'task',
    }));

    await supabase.from('notifications').insert(inserts);
  },

  // Subscribe to real-time notifications for a user
  subscribeToNotifications(userId, onNew) {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => onNew(payload.new))
      .subscribe();
  },

  // Subscribe to real-time task changes (for all users)
  subscribeToTasks(onTaskChange) {
    return supabase
      .channel('tasks:realtime')
      .on('postgres_changes', {
        event: '*', // INSERT | UPDATE | DELETE
        schema: 'public',
        table: 'tasks',
      }, (payload) => onTaskChange(payload))
      .subscribe();
  },

  // Subscribe to real-time profile changes (resources)
  subscribeToResources(onResourceChange) {
    return supabase
      .channel('profiles:realtime')
      .on('postgres_changes', {
        event: '*', // INSERT | UPDATE | DELETE
        schema: 'public',
        table: 'profiles',
      }, (payload) => onResourceChange(payload))
      .subscribe();
  },

  // Subscribe to comment additions
  subscribeToComments(onComment) {
    return supabase
      .channel('comments:realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
      }, (payload) => onComment(payload.new))
      .subscribe();
  },

  // File attachments (Supabase Storage)
  async uploadAttachment(taskId, file, uploadedBy) {
    const ext = file.name.split('.').pop();
    const path = `task-attachments/${taskId}/${Date.now()}.${ext}`;

    const { data: storageData, error: storageErr } = await supabase.storage
      .from('attachments')
      .upload(path, file, { contentType: file.type });

    if (storageErr) throw storageErr;

    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);

    // Record in DB
    const { data, error } = await supabase
      .from('attachments')
      .insert({
        task_id: taskId, uploaded_by: uploadedBy,
        filename: file.name, storage_path: path,
        size_bytes: file.size, mime_type: file.type,
      })
      .select().single();
    if (error) throw error;

    return { ...data, publicUrl: urlData.publicUrl };
  },

  async getAttachments(taskId) {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Attach public URLs
    return (data || []).map(a => ({
      ...a,
      publicUrl: supabase.storage.from('attachments').getPublicUrl(a.storage_path).data.publicUrl,
    }));
  },

  async deleteAttachment(id, storagePath) {
    await supabase.storage.from('attachments').remove([storagePath]);
    await supabase.from('attachments').delete().eq('id', id);
  },
};
