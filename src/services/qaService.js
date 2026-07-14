import { supabase } from './supabaseClient';

const mapBuild = (row) => ({
  id: row.id,
  projectId: row.project_id,
  buildNo: row.build_no,
  releaseDate: row.release_date,
  status: row.status || 'In Progress',
  remarks: row.remarks || '',
  createdAt: row.created_at,
});

const mapBug = (row) => ({
  id: row.id,
  projectId: row.project_id,
  moduleId: row.module_id,
  title: row.title,
  description: row.description || '',
  severity: row.severity || 'Medium',
  status: row.status || 'New',
  assignedTo: row.assigned_to,
  buildFoundId: row.build_found_id,
  buildFixedId: row.build_fixed_id,
  createdBy: row.created_by || '',
  createdAt: row.created_at,
});

const mapCR = (row) => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  description: row.description || '',
  status: row.status || 'Proposed',
  priority: row.priority || 'Medium',
  effortHours: parseFloat(row.effort_hours) || 0,
  requestedBy: row.requested_by || '',
  targetBuildId: row.target_build_id,
  createdAt: row.created_at,
});

export const qaService = {
  // ── BUILDS ───────────────────────────────────────────────
  async getBuilds() {
    const { data, error } = await supabase
      .from('builds')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapBuild);
  },

  async createBuild(payload) {
    const { data, error } = await supabase
      .from('builds')
      .insert({
        project_id: payload.projectId,
        build_no: payload.buildNo,
        release_date: payload.releaseDate || null,
        status: payload.status || 'In Progress',
        remarks: payload.remarks || '',
      })
      .select()
      .single();
    if (error) throw error;
    return mapBuild(data);
  },

  async updateBuild(payload) {
    const { id, ...rest } = payload;
    const { data, error } = await supabase
      .from('builds')
      .update({
        project_id: rest.projectId,
        build_no: rest.buildNo,
        release_date: rest.releaseDate || null,
        status: rest.status,
        remarks: rest.remarks || '',
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapBuild(data);
  },

  async deleteBuild(id) {
    const { error } = await supabase.from('builds').delete().eq('id', id);
    if (error) throw error;
  },

  // ── BUGS ──────────────────────────────────────────────────
  async getBugs() {
    const { data, error } = await supabase
      .from('bugs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapBug);
  },

  async createBug(payload) {
    const { data, error } = await supabase
      .from('bugs')
      .insert({
        project_id: payload.projectId,
        module_id: payload.moduleId || null,
        title: payload.title,
        description: payload.description || '',
        severity: payload.severity || 'Medium',
        status: payload.status || 'New',
        assigned_to: payload.assignedTo || null,
        build_found_id: payload.buildFoundId || null,
        build_fixed_id: payload.buildFixedId || null,
        created_by: payload.createdBy || '',
      })
      .select()
      .single();
    if (error) throw error;
    return mapBug(data);
  },

  async updateBug(payload) {
    const { id, ...rest } = payload;
    const { data, error } = await supabase
      .from('bugs')
      .update({
        project_id: rest.projectId,
        module_id: rest.moduleId || null,
        title: rest.title,
        description: rest.description || '',
        severity: rest.severity,
        status: rest.status,
        assigned_to: rest.assignedTo || null,
        build_found_id: rest.buildFoundId || null,
        build_fixed_id: rest.buildFixedId || null,
        created_by: rest.createdBy || '',
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapBug(data);
  },

  async deleteBug(id) {
    const { error } = await supabase.from('bugs').delete().eq('id', id);
    if (error) throw error;
  },

  // ── CHANGE REQUESTS ────────────────────────────────────────
  async getChangeRequests() {
    const { data, error } = await supabase
      .from('change_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapCR);
  },

  async createChangeRequest(payload) {
    const { data, error } = await supabase
      .from('change_requests')
      .insert({
        project_id: payload.projectId,
        title: payload.title,
        description: payload.description || '',
        status: payload.status || 'Proposed',
        priority: payload.priority || 'Medium',
        effort_hours: payload.effortHours || 0,
        requested_by: payload.requestedBy || '',
        target_build_id: payload.targetBuildId || null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapCR(data);
  },

  async updateChangeRequest(payload) {
    const { id, ...rest } = payload;
    const { data, error } = await supabase
      .from('change_requests')
      .update({
        project_id: rest.projectId,
        title: rest.title,
        description: rest.description || '',
        status: rest.status,
        priority: rest.priority,
        effort_hours: rest.effortHours || 0,
        requested_by: rest.requestedBy || '',
        target_build_id: rest.targetBuildId || null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapCR(data);
  },

  async deleteChangeRequest(id) {
    const { error } = await supabase.from('change_requests').delete().eq('id', id);
    if (error) throw error;
  },
};
