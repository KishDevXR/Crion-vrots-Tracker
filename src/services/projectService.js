import { supabase } from './supabaseClient';

const mapProject = (row) => ({
  id: row.id,
  name: row.name,
  client: row.client || '',
  status: row.status || 'Active',
  owner: row.owner || '',
  startDate: row.start_date,
  plannedEndDate: row.planned_end_date,
  budget: row.budget ? Number(row.budget) : 0,
  remarks: row.remarks || '',
});

const mapModule = (row) => ({
  id: row.id,
  projectId: row.project_id,
  name: row.name,
  status: row.status || 'Pending',
  percentComplete: row.percent_complete || 0,
  currentActivity: row.current_activity || '',
  effortsHours: row.efforts_hours ? Number(row.efforts_hours) : 0,
  blockers: row.blockers || '',
  owner: row.owner || '',
  plannedEndDate: row.planned_end_date,
  eta: row.eta,
  remarks: row.remarks || '',
});

export const projectService = {
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapProject);
  },

  async createProject(payload) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: payload.name,
        client: payload.client || '',
        status: payload.status || 'Active',
        owner: payload.owner || '',
        start_date: payload.startDate,
        planned_end_date: payload.plannedEndDate,
        budget: payload.budget || 0,
        remarks: payload.remarks || '',
      })
      .select()
      .single();
    if (error) throw error;
    return mapProject(data);
  },

  async updateProject(payload) {
    const { id, ...rest } = payload;
    const { data, error } = await supabase
      .from('projects')
      .update({
        name: rest.name,
        client: rest.client,
        status: rest.status,
        owner: rest.owner,
        start_date: rest.startDate,
        planned_end_date: rest.plannedEndDate,
        budget: rest.budget || 0,
        remarks: rest.remarks,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapProject(data);
  },

  async deleteProject(id) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getModules() {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapModule);
  },

  async createModule(payload) {
    const { data, error } = await supabase
      .from('modules')
      .insert({
        project_id: payload.projectId,
        name: payload.name,
        status: payload.status || 'Pending',
        percent_complete: payload.percentComplete || 0,
        current_activity: payload.currentActivity || '',
        efforts_hours: payload.effortsHours || 0,
        blockers: payload.blockers || '',
        owner: payload.owner || '',
        planned_end_date: payload.plannedEndDate,
        eta: payload.eta,
        remarks: payload.remarks || '',
      })
      .select()
      .single();
    if (error) throw error;
    return mapModule(data);
  },

  async updateModule(payload) {
    const { id, ...rest } = payload;
    const { data, error } = await supabase
      .from('modules')
      .update({
        project_id: rest.projectId,
        name: rest.name,
        status: rest.status,
        percent_complete: rest.percentComplete,
        current_activity: rest.currentActivity,
        efforts_hours: rest.effortsHours,
        blockers: rest.blockers,
        owner: rest.owner,
        planned_end_date: rest.plannedEndDate,
        eta: rest.eta,
        remarks: rest.remarks,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapModule(data);
  },

  async deleteModule(id) {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
