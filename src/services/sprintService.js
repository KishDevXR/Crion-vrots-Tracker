import { supabase } from './supabaseClient';

const mapSprint = (row) => ({
  id: row.id,
  name: row.name,
  projectId: row.project_id,
  goal: row.goal || '',
  startDate: row.start_date,
  endDate: row.end_date,
  status: row.status || 'Planned',
  capacityHours: row.capacity_hours || 200,
  committedStoryPoints: row.committed_story_points || 0,
  completedStoryPoints: row.completed_story_points || 0,
  retroNotes: row.retro_notes || '',
});

export const sprintService = {
  async getSprints() {
    const { data, error } = await supabase.from('sprints').select('*').order('start_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapSprint);
  },

  async createSprint(payload) {
    const { data, error } = await supabase
      .from('sprints')
      .insert({
        project_id: payload.projectId, name: payload.name, goal: payload.goal || '',
        start_date: payload.startDate, end_date: payload.endDate,
        status: payload.status || 'Planned', capacity_hours: payload.capacityHours || 200,
        committed_story_points: payload.committedStoryPoints || 0,
        completed_story_points: payload.completedStoryPoints || 0,
      })
      .select().single();
    if (error) throw error;
    return mapSprint(data);
  },

  async updateSprint(payload) {
    const { id, ...rest } = payload;
    const { data, error } = await supabase
      .from('sprints')
      .update({
        name: rest.name, goal: rest.goal || '', start_date: rest.startDate, end_date: rest.endDate,
        status: rest.status, capacity_hours: rest.capacityHours || 200,
        committed_story_points: rest.committedStoryPoints || 0,
        completed_story_points: rest.completedStoryPoints || 0,
        retro_notes: rest.retroNotes || '',
      })
      .eq('id', id).select().single();
    if (error) throw error;
    return mapSprint(data);
  },

  async deleteSprint(id) {
    // Unlink tasks from sprint before deleting
    await supabase.from('tasks').update({ sprint_id: null }).eq('sprint_id', id);
    const { error } = await supabase.from('sprints').delete().eq('id', id);
    if (error) throw error;
  },

  async startSprint(id) {
    // Ensure no other sprint is Active first
    await supabase.from('sprints').update({ status: 'Active' }).eq('id', id);
    const { data, error } = await supabase.from('sprints').select('*').eq('id', id).single();
    if (error) throw error;
    return mapSprint(data);
  },

  async completeSprint(id, retroNotes = '') {
    // Move incomplete tasks back to backlog (unlink sprint)
    await supabase.from('tasks').update({ sprint_id: null, status: 'Not Started' })
      .eq('sprint_id', id).neq('status', 'Done');

    // Calculate completed story points
    const { data: doneTasks } = await supabase
      .from('tasks').select('story_points').eq('sprint_id', id).eq('status', 'Done');
    const completedSP = (doneTasks || []).reduce((s, t) => s + (t.story_points || 0), 0);

    const { data, error } = await supabase
      .from('sprints')
      .update({ status: 'Completed', completed_story_points: completedSP, retro_notes: retroNotes })
      .eq('id', id).select().single();
    if (error) throw error;
    return mapSprint(data);
  },

  async assignTaskToSprint(taskId, sprintId) {
    const { error } = await supabase.from('tasks').update({ sprint_id: sprintId }).eq('id', taskId);
    if (error) throw error;
  },

  async removeTaskFromSprint(taskId) {
    const { error } = await supabase.from('tasks').update({ sprint_id: null }).eq('id', taskId);
    if (error) throw error;
  },

  // Velocity data: completed SP per sprint
  async getVelocityData() {
    const { data, error } = await supabase
      .from('sprints')
      .select('name, committed_story_points, completed_story_points, status')
      .order('start_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(s => ({
      name: s.name,
      'Committed SP': s.committed_story_points,
      'Completed SP': s.completed_story_points,
    }));
  },
};
