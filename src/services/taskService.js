import { supabase } from './supabaseClient';

// Map DB row → frontend shape (backward compat with existing components)
const mapTask = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    weekStartDate: row.week_start_date,
    weekNo: row.week_no,
    sprintId: row.sprint_id,
    epicId: row.epic_id,
    parentTaskId: row.parent_task_id,
    resourceName: row.resource_name || '',
    assigneeId: row.assignee_id,
    role: row.role || '',
    projectId: row.project_id,
    moduleId: row.module_id,
    description: row.description,
    storyPoints: row.story_points || 0,
    plannedHours: parseFloat(row.planned_hours) || 0,
    startDate: row.start_date,
    endDate: row.end_date,
    actualHours: parseFloat(row.actual_hours) || 0,
    progressPercent: row.progress_percent || 0,
    manager: row.manager || '',
    status: row.status || 'Not Started',
    priority: row.priority || 'Medium',
    remarks: row.remarks || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Joined data
    comments: (row.comments || []).map(mapComment),
    activityLog: (row.activity_log || []).map(mapLog),
    subtasks: (row.subtasks || []).map(mapTask),
    dependencies: row.dependencies || [],
    timeLogs: row.time_logs || [],
  };
};

const mapComment = (c) => ({
  id: c.id,
  author: c.author,
  timestamp: c.created_at,
  text: c.text,
});

const mapLog = (l) => ({
  id: l.id,
  fieldChanged: l.field_changed,
  oldValue: l.old_value,
  newValue: l.new_value,
  changedBy: l.changed_by,
  timestamp: l.created_at,
});

const mapBacklogItem = (row) => ({
  id: row.id,
  projectId: row.project_id,
  moduleId: row.module_id,
  description: row.description,
  category: row.category || 'Engineering',
  priority: row.priority || 'Medium',
  plannedHours: parseFloat(row.planned_hours) || 0,
  storyPoints: row.story_points || 0,
  assignedTo: row.assigned_to || '',
  dependency: row.dependency || 'None',
  blockerReason: row.blocker_reason || '',
  targetWeek: row.target_week || '',
  remarks: row.remarks || '',
});

const mapUnassigned = (row) => ({
  id: row.id,
  projectId: row.project_id,
  moduleId: row.module_id,
  description: row.description,
  plannedHours: parseFloat(row.planned_hours) || 0,
  department: row.department || 'Engineering',
});

const mapEpic = (row) => ({
  id: row.id,
  projectId: row.project_id,
  epicTitle: row.epic_title,
  description: row.description || '',
  storyPoints: row.story_points || 0,
  priority: row.priority || 'Medium',
  status: row.status || 'In Progress',
  linkedTaskIds: row.linked_task_ids || [],
});

export const taskService = {
  // ── TASKS ────────────────────────────────────────────────
  async getTasks(role, userName) {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        comments(*),
        activity_log(*),
        subtasks:tasks!parent_task_id(id, description, status, assignee_id, resource_name, progress_percent),
        dependencies:task_dependencies!task_id(id, depends_on_id, type),
        time_logs(*)
      `)
      .is('parent_task_id', null) // top-level tasks only
      .order('created_at', { ascending: false });

    // Team Members see only their own tasks
    if (role === 'Team Member') {
      query = query.eq('resource_name', userName);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapTask);
  },

  async getTask(id) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        comments(*),
        activity_log(*),
        subtasks:tasks!parent_task_id(*),
        dependencies:task_dependencies!task_id(id, depends_on_id, type),
        time_logs(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapTask(data);
  },

  async createTask(taskData, currentUser) {
    const { comments, activityLog, subtasks, dependencies, ...rest } = taskData;
    const insert = {
      project_id: rest.projectId,
      module_id: rest.moduleId || null,
      sprint_id: rest.sprintId || null,
      epic_id: rest.epicId || null,
      parent_task_id: rest.parentTaskId || null,
      resource_name: rest.resourceName || '',
      role: rest.role || '',
      manager: rest.manager || '',
      week_start_date: rest.weekStartDate || null,
      week_no: rest.weekNo || null,
      description: rest.description,
      story_points: rest.storyPoints || 0,
      planned_hours: rest.plannedHours || 0,
      actual_hours: rest.actualHours || 0,
      progress_percent: rest.progressPercent || 0,
      status: rest.status || 'Not Started',
      priority: rest.priority || 'Medium',
      start_date: rest.startDate || null,
      end_date: rest.endDate || null,
      remarks: rest.remarks || '',
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(insert)
      .select(`*, comments(*), activity_log(*)`)
      .single();
    if (error) throw error;

    // Log creation
    await taskService.addActivityLog(data.id, currentUser, 'task', null, 'Created', data.project_id);
    return mapTask(data);
  },

  async updateTask(taskData, currentUser) {
    const { id, comments, activityLog, subtasks, dependencies, ...rest } = taskData;

    // Get old task for diff
    const { data: old } = await supabase.from('tasks').select('*').eq('id', id).single();

    const update = {
      project_id: rest.projectId,
      module_id: rest.moduleId || null,
      sprint_id: rest.sprintId || null,
      epic_id: rest.epicId || null,
      resource_name: rest.resourceName || '',
      role: rest.role || '',
      manager: rest.manager || '',
      week_no: rest.weekNo || null,
      description: rest.description,
      story_points: rest.storyPoints || 0,
      planned_hours: rest.plannedHours || 0,
      actual_hours: rest.actualHours || 0,
      progress_percent: rest.progressPercent || 0,
      status: rest.status || 'Not Started',
      priority: rest.priority || 'Medium',
      start_date: rest.startDate || null,
      end_date: rest.endDate || null,
      remarks: rest.remarks || '',
    };

    const { data, error } = await supabase
      .from('tasks')
      .update(update)
      .eq('id', id)
      .select(`*, comments(*), activity_log(*)`)
      .single();
    if (error) throw error;

    // Diff and log changed fields
    const trackFields = [
      ['status', 'status'], ['priority', 'priority'],
      ['resource_name', 'resourceName'], ['progress_percent', 'progressPercent'],
      ['story_points', 'storyPoints'], ['actual_hours', 'actualHours'],
    ];
    for (const [dbField, jsField] of trackFields) {
      const oldVal = String(old?.[dbField] ?? '');
      const newVal = String(update[dbField] ?? '');
      if (oldVal !== newVal) {
        await taskService.addActivityLog(id, currentUser, dbField, oldVal, newVal, rest.projectId);
      }
    }

    return mapTask(data);
  },

  async deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },

  async changeStatus(taskId, newStatus, changedBy, projectId) {
    const { data: old } = await supabase.from('tasks').select('status, progress_percent').eq('id', taskId).single();
    const progressPercent = newStatus === 'Done' ? 100 : newStatus === 'Not Started' ? 0 : old?.progress_percent ?? 0;

    const { data, error } = await supabase
      .from('tasks')
      .update({ status: newStatus, progress_percent: progressPercent })
      .eq('id', taskId)
      .select(`*, comments(*), activity_log(*)`)
      .single();
    if (error) throw error;

    await taskService.addActivityLog(taskId, changedBy, 'status', old?.status, newStatus, projectId);
    return mapTask(data);
  },

  // ── COMMENTS ─────────────────────────────────────────────
  async addComment(taskId, text, currentUser) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, author: currentUser, text })
      .select()
      .single();
    if (error) throw error;
    return mapComment(data);
  },

  // ── ACTIVITY LOG ─────────────────────────────────────────
  async addActivityLog(taskId, changedBy, fieldChanged, oldValue, newValue, projectId) {
    await supabase.from('activity_log').insert({
      task_id: taskId,
      project_id: projectId,
      changed_by: changedBy,
      field_changed: fieldChanged,
      old_value: String(oldValue ?? ''),
      new_value: String(newValue ?? ''),
    });
  },

  async getRecentActivity(limit = 10) {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*, tasks(description, project_id)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  // ── BACKLOG ───────────────────────────────────────────────
  async getBacklogItems() {
    const { data, error } = await supabase
      .from('backlog_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapBacklogItem);
  },

  async createBacklogItem(payload) {
    const { data, error } = await supabase
      .from('backlog_items')
      .insert({
        project_id: payload.projectId,
        module_id: payload.moduleId || null,
        description: payload.description,
        category: payload.category || 'Engineering',
        priority: payload.priority || 'Medium',
        planned_hours: payload.plannedHours || 0,
        story_points: payload.storyPoints || 0,
        assigned_to: payload.assignedTo || '',
        dependency: payload.dependency || 'None',
        blocker_reason: payload.blockerReason || '',
        target_week: payload.targetWeek || '',
        remarks: payload.remarks || '',
      })
      .select().single();
    if (error) throw error;
    return mapBacklogItem(data);
  },

  async updateBacklogItem(item) {
    const { id, ...rest } = item;
    const { data, error } = await supabase
      .from('backlog_items')
      .update({ story_points: rest.storyPoints, priority: rest.priority, planned_hours: rest.plannedHours })
      .eq('id', id).select().single();
    if (error) throw error;
    return mapBacklogItem(data);
  },

  async deleteBacklogItem(id) {
    const { error } = await supabase.from('backlog_items').delete().eq('id', id);
    if (error) throw error;
  },

  async promoteBacklogItem(id, details, currentUser) {
    const { data: item } = await supabase.from('backlog_items').select('*').eq('id', id).single();
    if (!item) return;

    // Create task from backlog item
    const task = await taskService.createTask({
      projectId: item.project_id,
      moduleId: item.module_id,
      sprintId: details.sprintId || null,
      description: item.description,
      resourceName: details.resourceName || '',
      role: details.role || '',
      priority: details.priority || item.priority,
      storyPoints: details.storyPoints || item.story_points,
      plannedHours: details.plannedHours || item.planned_hours,
      startDate: details.startDate || null,
      endDate: details.endDate || null,
      status: 'Not Started',
    }, currentUser);

    // Remove from backlog
    await supabase.from('backlog_items').delete().eq('id', id);
    return task;
  },

  // ── UNASSIGNED ────────────────────────────────────────────
  async getUnassignedTasks() {
    const { data, error } = await supabase.from('unassigned_tasks').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapUnassigned);
  },

  async createUnassignedTask(payload) {
    const { data, error } = await supabase
      .from('unassigned_tasks')
      .insert({ project_id: payload.projectId, module_id: payload.moduleId || null, description: payload.description, planned_hours: payload.plannedHours || 0, department: payload.department || 'Engineering' })
      .select().single();
    if (error) throw error;
    return mapUnassigned(data);
  },

  async deleteUnassignedTask(id) {
    const { error } = await supabase.from('unassigned_tasks').delete().eq('id', id);
    if (error) throw error;
  },

  async promoteUnassignedTask(id, details, currentUser) {
    const { data: item } = await supabase.from('unassigned_tasks').select('*').eq('id', id).single();
    if (!item) return;
    const task = await taskService.createTask({ projectId: item.project_id, moduleId: item.module_id, description: item.description, ...details }, currentUser);
    await supabase.from('unassigned_tasks').delete().eq('id', id);
    return task;
  },

  // ── EPICS ─────────────────────────────────────────────────
  async getEpics() {
    const { data, error } = await supabase.from('epics').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    // Attach linked task IDs
    const epicIds = (data || []).map(e => e.id);
    if (epicIds.length === 0) return [];

    const { data: tasks } = await supabase.from('tasks').select('id, epic_id').in('epic_id', epicIds);
    const taskMap = {};
    for (const t of tasks || []) {
      if (!taskMap[t.epic_id]) taskMap[t.epic_id] = [];
      taskMap[t.epic_id].push(t.id);
    }

    return (data || []).map(e => ({ ...mapEpic(e), linkedTaskIds: taskMap[e.id] || [] }));
  },

  async createEpic(payload) {
    const { data, error } = await supabase
      .from('epics')
      .insert({ project_id: payload.projectId, epic_title: payload.epicTitle, description: payload.description || '', story_points: payload.storyPoints || 0, priority: payload.priority || 'Medium', status: payload.status || 'In Progress' })
      .select().single();
    if (error) throw error;
    return mapEpic(data);
  },

  async updateEpic(epic) {
    const { id, ...rest } = epic;
    const { data, error } = await supabase
      .from('epics')
      .update({ epic_title: rest.epicTitle, description: rest.description, story_points: rest.storyPoints, priority: rest.priority, status: rest.status })
      .eq('id', id).select().single();
    if (error) throw error;
    return mapEpic(data);
  },

  // ── DELIVERABLES ──────────────────────────────────────────
  async getDeliverables() {
    const { data, error } = await supabase.from('deliverables').select('*').order('priority_rank');
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id, projectId: d.project_id, month: d.month,
      description: d.description, priorityRank: d.priority_rank,
      owner: d.owner, followUpAction: d.follow_up_action, status: d.status,
    }));
  },

  async createDeliverable(payload) {
    const { data, error } = await supabase
      .from('deliverables')
      .insert({ project_id: payload.projectId, month: payload.month, description: payload.description, priority_rank: payload.priorityRank || 1, owner: payload.owner || '', follow_up_action: payload.followUpAction || '', status: payload.status || 'Not Started' })
      .select().single();
    if (error) throw error;
    return data;
  },

  // ── TASK DEPENDENCIES ─────────────────────────────────────
  async addDependency(taskId, dependsOnId, type = 'blocks') {
    const { data, error } = await supabase
      .from('task_dependencies')
      .insert({ task_id: taskId, depends_on_id: dependsOnId, type })
      .select().single();
    if (error) throw error;
    return data;
  },

  async removeDependency(taskId, dependsOnId) {
    await supabase.from('task_dependencies').delete().match({ task_id: taskId, depends_on_id: dependsOnId });
  },

  async getTaskDependencies(taskId) {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select('*, depends_on:tasks!depends_on_id(id, description, status)')
      .eq('task_id', taskId);
    if (error) throw error;
    return data || [];
  },

  // ── TIME LOGS ─────────────────────────────────────────────
  async logTime(taskId, { userName, hours, description, loggedDate }) {
    const { data, error } = await supabase
      .from('time_logs')
      .insert({ task_id: taskId, user_name: userName, hours, description, logged_date: loggedDate })
      .select().single();
    if (error) throw error;

    // Update actual_hours on task
    const { data: logs } = await supabase.from('time_logs').select('hours').eq('task_id', taskId);
    const totalHours = (logs || []).reduce((s, l) => s + parseFloat(l.hours), 0);
    await supabase.from('tasks').update({ actual_hours: totalHours }).eq('id', taskId);

    return data;
  },

  async getTimeLogs(taskId) {
    const { data, error } = await supabase.from('time_logs').select('*').eq('task_id', taskId).order('logged_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
