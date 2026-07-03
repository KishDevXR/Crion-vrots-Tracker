import seedData from '../data/seed.json';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'crion_vrots_data';
const USERS_KEY = 'crion_vrots_users_list';

// Initialize data if not present in localStorage
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
  }
};

// Raw read from localStorage
const readRawData = () => {
  initializeData();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    console.error("Error parsing Crion data from localStorage, resetting...", error);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return seedData;
  }
};

// Write raw data to localStorage and sync to Supabase in the background
const writeRawData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  
  // Background write to Supabase
  supabase
    .from('tracker_store')
    .upsert({ key: STORAGE_KEY, value: data })
    .then(({ error }) => {
      if (error) {
        console.error("Error syncing data to Supabase:", error);
      }
    });
};

// Check if role has access to budget/cost data
const hasBudgetAccess = (role) => {
  return role === 'Admin' || role === 'Stakeholder';
};

// Service Layer functions with role-based filtering
export const dataService = {
  // --- Supabase Sync Hooks ---
  syncFromSupabase: async () => {
    try {
      const { data, error } = await supabase
        .from('tracker_store')
        .select('value')
        .eq('key', STORAGE_KEY)
        .single();
      
      if (data && data.value) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value));
        console.log("Successfully synced database from Supabase.");
      } else {
        // Initialize Supabase with local data if remote key is missing
        const localData = localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : seedData;
        await supabase
          .from('tracker_store')
          .upsert({ key: STORAGE_KEY, value: localData });
        console.log("Initialized Supabase tracker_store with default data.");
      }
    } catch (err) {
      console.warn("Could not reach Supabase. Running in local fallback mode.", err);
    }
  },

  syncUsersFromSupabase: async () => {
    try {
      const { data, error } = await supabase
        .from('tracker_store')
        .select('value')
        .eq('key', USERS_KEY)
        .single();
      
      if (data && data.value) {
        localStorage.setItem(USERS_KEY, JSON.stringify(data.value));
        console.log("Successfully synced users from Supabase.");
      } else {
        const defaultUsers = [
          { username: 'admin', password: 'admin', name: 'Admin', role: 'Admin' },
          { username: 'manager', password: 'manager', name: 'Manager', role: 'Manager' },
          { username: 'member', password: 'member', name: 'Team Member', role: 'Team Member' },
          { username: 'stakeholder', password: 'stakeholder', name: 'Stakeholder', role: 'Stakeholder' }
        ];
        const localUsers = localStorage.getItem(USERS_KEY) ? JSON.parse(localStorage.getItem(USERS_KEY)) : defaultUsers;
        await supabase
          .from('tracker_store')
          .upsert({ key: USERS_KEY, value: localUsers });
      }
    } catch (err) {
      console.warn("Could not sync users from Supabase.", err);
    }
  },

  // --- Projects ---
  getProjects: (role) => {
    const data = readRawData();
    return data.projects || [];
  },
  
  saveProject: (project) => {
    const data = readRawData();
    const index = data.projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      data.projects[index] = { ...data.projects[index], ...project };
    } else {
      data.projects.push(project);
    }
    writeRawData(data);
    return project;
  },

  deleteProject: (id) => {
    const data = readRawData();
    data.projects = data.projects.filter(p => p.id !== id);
    writeRawData(data);
  },

  // --- Modules ---
  getModules: (role) => {
    const data = readRawData();
    return data.modules || [];
  },

  saveModule: (moduleItem) => {
    const data = readRawData();
    const index = data.modules.findIndex(m => m.id === moduleItem.id);
    if (index >= 0) {
      data.modules[index] = { ...data.modules[index], ...moduleItem };
    } else {
      data.modules.push(moduleItem);
    }
    writeRawData(data);
    return moduleItem;
  },

  deleteModule: (id) => {
    const data = readRawData();
    data.modules = data.modules.filter(m => m.id !== id);
    writeRawData(data);
  },

  // --- Tasks ---
  getTasks: (role, currentUser = null) => {
    const data = readRawData();
    let tasks = data.tasks || [];
    
    // If the role is Team Member, they can only view/update their own assigned tasks
    if (role === 'Team Member' && currentUser) {
      tasks = tasks.filter(t => t.resourceName === currentUser);
    }
    
    return tasks;
  },

  saveTask: (task) => {
    const data = readRawData();
    const index = data.tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      // Auto-generate activity log if status or progressPercent or resourceName changed
      const oldTask = data.tasks[index];
      const activityLog = [...(oldTask.activityLog || [])];
      
      const checkAndLog = (field) => {
        if (task[field] !== undefined && task[field] !== oldTask[field]) {
          activityLog.push({
            fieldChanged: field,
            oldValue: String(oldTask[field] || 'None'),
            newValue: String(task[field] || 'None'),
            changedBy: task.updatedBy || 'System',
            timestamp: new Date().toISOString()
          });
        }
      };

      checkAndLog('status');
      checkAndLog('progressPercent');
      checkAndLog('resourceName');
      checkAndLog('actualHours');

      data.tasks[index] = { 
        ...oldTask, 
        ...task, 
        activityLog 
      };
      // Clean up temp updatedBy
      delete data.tasks[index].updatedBy;
    } else {
      data.tasks.push({
        comments: [],
        activityLog: [{
          fieldChanged: 'created',
          oldValue: '',
          newValue: 'Task Created',
          changedBy: task.updatedBy || 'System',
          timestamp: new Date().toISOString()
        }],
        ...task
      });
    }
    writeRawData(data);
    return task;
  },

  deleteTask: (id) => {
    const data = readRawData();
    data.tasks = data.tasks.filter(t => t.id !== id);
    writeRawData(data);
  },

  // --- Unassigned Tasks ---
  getUnassignedTasks: () => {
    const data = readRawData();
    return data.unassignedTasks || [];
  },

  saveUnassignedTask: (task) => {
    const data = readRawData();
    const index = data.unassignedTasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      data.unassignedTasks[index] = { ...data.unassignedTasks[index], ...task };
    } else {
      data.unassignedTasks.push(task);
    }
    writeRawData(data);
    return task;
  },

  deleteUnassignedTask: (id) => {
    const data = readRawData();
    data.unassignedTasks = data.unassignedTasks.filter(t => t.id !== id);
    writeRawData(data);
  },

  // --- Backlog Tasks ---
  getBacklogTasks: () => {
    const data = readRawData();
    return data.backlogTasks || [];
  },

  saveBacklogTask: (task) => {
    const data = readRawData();
    const index = data.backlogTasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      data.backlogTasks[index] = { ...data.backlogTasks[index], ...task };
    } else {
      data.backlogTasks.push({
        createdDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        ...task
      });
    }
    writeRawData(data);
    return task;
  },

  deleteBacklogTask: (id) => {
    const data = readRawData();
    data.backlogTasks = data.backlogTasks.filter(t => t.id !== id);
    writeRawData(data);
  },

  // --- Resources ---
  getResources: (role) => {
    const data = readRawData();
    const resources = data.resources || [];
    
    // Role-based filtering: Exclude hourlyRate for Managers and Team Members
    if (!hasBudgetAccess(role)) {
      return resources.map(res => {
        const { hourlyRate, ...publicInfo } = res;
        return publicInfo;
      });
    }
    
    return resources;
  },

  saveResource: (resource, role) => {
    const data = readRawData();
    const index = data.resources.findIndex(r => r.id === resource.id);
    
    if (index >= 0) {
      // If unauthorized role tries to save a resource, we keep their existing hourlyRate
      let finalResource = { ...resource };
      if (!hasBudgetAccess(role)) {
        finalResource.hourlyRate = data.resources[index].hourlyRate;
      }
      data.resources[index] = { ...data.resources[index], ...finalResource };
    } else {
      // Create new resource
      const finalResource = { ...resource };
      if (!hasBudgetAccess(role)) {
        // Default hourlyRate if role lacks permission
        finalResource.hourlyRate = 0;
      }
      data.resources.push(finalResource);
    }
    
    writeRawData(data);
    return resource;
  },

  deleteResource: (id) => {
    const data = readRawData();
    data.resources = data.resources.filter(r => r.id !== id);
    writeRawData(data);
  },

  // --- Sprints ---
  getSprints: () => {
    const data = readRawData();
    return data.sprints || [];
  },

  saveSprint: (sprint) => {
    const data = readRawData();
    const index = data.sprints.findIndex(s => s.id === sprint.id);
    
    if (index >= 0) {
      data.sprints[index] = { ...data.sprints[index], ...sprint };
    } else {
      data.sprints.push(sprint);
    }
    writeRawData(data);
    return sprint;
  },

  deleteSprint: (id) => {
    const data = readRawData();
    data.sprints = data.sprints.filter(s => s.id !== id);
    writeRawData(data);
  },

  // --- Epics ---
  getEpics: () => {
    const data = readRawData();
    return data.epics || [];
  },

  saveEpic: (epic) => {
    const data = readRawData();
    const index = data.epics.findIndex(e => e.id === epic.id);
    if (index >= 0) {
      data.epics[index] = { ...data.epics[index], ...epic };
    } else {
      data.epics.push({
        linkedTaskIds: [],
        ...epic
      });
    }
    writeRawData(data);
    return epic;
  },

  deleteEpic: (id) => {
    const data = readRawData();
    data.epics = data.epics.filter(e => e.id !== id);
    writeRawData(data);
  },

  // --- Hiring Requests ---
  getHiringRequests: () => {
    const data = readRawData();
    return data.hiringRequests || [];
  },

  saveHiringRequest: (request) => {
    const data = readRawData();
    const index = data.hiringRequests.findIndex(h => h.id === request.id);
    if (index >= 0) {
      data.hiringRequests[index] = { ...data.hiringRequests[index], ...request };
    } else {
      data.hiringRequests.push(request);
    }
    writeRawData(data);
    return request;
  },

  deleteHiringRequest: (id) => {
    const data = readRawData();
    data.hiringRequests = data.hiringRequests.filter(h => h.id !== id);
    writeRawData(data);
  },

  // --- Skill Developments ---
  getSkillDevelopments: () => {
    const data = readRawData();
    return data.skillDevelopments || [];
  },

  saveSkillDevelopment: (skill) => {
    const data = readRawData();
    const index = data.skillDevelopments.findIndex(s => s.id === skill.id);
    if (index >= 0) {
      data.skillDevelopments[index] = { ...data.skillDevelopments[index], ...skill };
    } else {
      data.skillDevelopments.push(skill);
    }
    writeRawData(data);
    return skill;
  },

  deleteSkillDevelopment: (id) => {
    const data = readRawData();
    data.skillDevelopments = data.skillDevelopments.filter(s => s.id !== id);
    writeRawData(data);
  },

  // --- Deliverables ---
  getDeliverables: () => {
    const data = readRawData();
    return data.deliverables || [];
  },

  saveDeliverable: (deliverable) => {
    const data = readRawData();
    const index = data.deliverables.findIndex(d => d.id === deliverable.id);
    if (index >= 0) {
      data.deliverables[index] = { ...data.deliverables[index], ...deliverable };
    } else {
      data.deliverables.push(deliverable);
    }
    writeRawData(data);
    return deliverable;
  },

  deleteDeliverable: (id) => {
    const data = readRawData();
    data.deliverables = data.deliverables.filter(d => d.id !== id);
    writeRawData(data);
  },

  // --- Budget & Cost Figures (Genuinely Protected Calculations) ---
  getBudgetSummary: (role) => {
    if (!hasBudgetAccess(role)) {
      return null;
    }

    const data = readRawData();
    const resources = data.resources || [];
    const tasks = data.tasks || [];
    const projects = data.projects || [];

    // Helper to get resource hourly rate
    const getRate = (name) => {
      const res = resources.find(r => r.name.toLowerCase() === (name || '').toLowerCase());
      return res ? res.hourlyRate : 0;
    };

    // Calculate Project Costs
    const projectCosts = projects.map(proj => {
      const projTasks = tasks.filter(t => t.projectId === proj.id);
      
      const estimatedCost = projTasks.reduce((sum, t) => sum + (t.plannedHours * getRate(t.resourceName)), 0);
      const actualCost = projTasks.reduce((sum, t) => sum + (t.actualHours * getRate(t.resourceName)), 0);
      const variance = estimatedCost - actualCost;
      const variancePercent = estimatedCost > 0 ? (variance / estimatedCost) * 100 : 0;

      return {
        projectId: proj.id,
        projectName: proj.name,
        estimatedCost,
        actualCost,
        variance,
        variancePercent
      };
    });

    // Calculate Resource Costs
    const resourceCosts = resources.map(res => {
      const resTasks = tasks.filter(t => t.resourceName.toLowerCase() === res.name.toLowerCase());
      const estimatedCost = resTasks.reduce((sum, t) => sum + (t.plannedHours * res.hourlyRate), 0);
      const actualCost = resTasks.reduce((sum, t) => sum + (t.actualHours * res.hourlyRate), 0);

      return {
        resourceId: res.id,
        resourceName: res.name,
        role: res.role,
        hourlyRate: res.hourlyRate,
        hoursPlanned: resTasks.reduce((sum, t) => sum + t.plannedHours, 0),
        hoursActual: resTasks.reduce((sum, t) => sum + t.actualHours, 0),
        estimatedCost,
        actualCost
      };
    });

    const totalEstimated = projectCosts.reduce((sum, p) => sum + p.estimatedCost, 0);
    const totalActual = projectCosts.reduce((sum, p) => sum + p.actualCost, 0);
    const totalVariance = totalEstimated - totalActual;

    return {
      projectCosts,
      resourceCosts,
      totalEstimated,
      totalActual,
      totalVariance
    };
  }
};
