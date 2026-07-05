import { supabase } from './supabaseClient';

const mapResource = (row) => ({
  id: row.id,
  name: row.name,
  role: row.role,
  weeklyPlannedHours: row.weekly_planned_hours || 40,
  weeklyActualHours: row.weekly_actual_hours || 0,
  utilizationPercent: row.utilization_percent || 0,
  hourlyRate: parseFloat(row.hourly_rate) || 50,
  avatarUrl: row.avatar_url || null,
});

const mapHiring = (row) => ({
  id: row.id,
  position: row.position,
  team: row.team || '',
  reason: row.reason || '',
  priority: row.priority || 'Medium',
  requiredBy: row.required_by,
  status: row.status || 'Draft',
  remarks: row.remarks || '',
});

const mapSkill = (row) => ({
  id: row.id,
  employeeName: row.employee_name,
  currentSkillLevel: row.current_skill_level || 'Beginner',
  skillToLearn: row.skill_to_learn,
  trainingPlan: row.training_plan || '',
  targetDate: row.target_date,
  status: row.status || 'Planned',
});

export const resourceService = {
  // Resources are drawn from profiles table
  async getResources() {
    const { data, error } = await supabase
      .from('profiles').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapResource);
  },

  async updateResource(payload) {
    const { id, ...rest } = payload;
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: rest.name, role: rest.role,
        hourly_rate: rest.hourlyRate, weekly_planned_hours: rest.weeklyPlannedHours,
        weekly_actual_hours: rest.weeklyActualHours, utilization_percent: rest.utilizationPercent,
      })
      .eq('id', id).select().single();
    if (error) throw error;
    return mapResource(data);
  },

  // Hiring requests
  async getHiringRequests() {
    const { data, error } = await supabase.from('hiring_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapHiring);
  },

  async createHiringRequest(payload) {
    const { data, error } = await supabase
      .from('hiring_requests')
      .insert({
        position: payload.position, team: payload.team || '', reason: payload.reason || '',
        priority: payload.priority || 'Medium', required_by: payload.requiredBy || null,
        status: payload.status || 'Draft', remarks: payload.remarks || '',
      })
      .select().single();
    if (error) throw error;
    return mapHiring(data);
  },

  async updateHiringRequest(payload) {
    const { id, ...rest } = payload;
    const { data, error } = await supabase
      .from('hiring_requests')
      .update({
        position: rest.position, team: rest.team, reason: rest.reason,
        priority: rest.priority, required_by: rest.requiredBy || null,
        status: rest.status, remarks: rest.remarks || '',
      })
      .eq('id', id).select().single();
    if (error) throw error;
    return mapHiring(data);
  },

  async deleteHiringRequest(id) {
    const { error } = await supabase.from('hiring_requests').delete().eq('id', id);
    if (error) throw error;
  },

  // Skill development
  async getSkillDevelopments() {
    const { data, error } = await supabase.from('skill_developments').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapSkill);
  },

  async createSkillDevelopment(payload) {
    const { data, error } = await supabase
      .from('skill_developments')
      .insert({
        employee_name: payload.employeeName, skill_to_learn: payload.skillToLearn,
        current_skill_level: payload.currentSkillLevel || 'Beginner',
        training_plan: payload.trainingPlan || '', target_date: payload.targetDate || null,
        status: payload.status || 'Planned',
      })
      .select().single();
    if (error) throw error;
    return mapSkill(data);
  },

  async updateSkillDevelopment(payload) {
    const { id, ...rest } = payload;
    const { data, error } = await supabase
      .from('skill_developments')
      .update({
        employee_name: rest.employeeName, skill_to_learn: rest.skillToLearn,
        current_skill_level: rest.currentSkillLevel, training_plan: rest.trainingPlan,
        target_date: rest.targetDate || null, status: rest.status,
      })
      .eq('id', id).select().single();
    if (error) throw error;
    return mapSkill(data);
  },

  // Capacity data for heatmap (Phase 4)
  async getCapacityData() {
    const { data: profiles } = await supabase.from('profiles').select('id, name, weekly_planned_hours');
    const { data: timeLogs } = await supabase
      .from('time_logs')
      .select('user_name, hours, logged_date')
      .gte('logged_date', new Date(Date.now() - 6 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    return { profiles: profiles || [], timeLogs: timeLogs || [] };
  },
};
