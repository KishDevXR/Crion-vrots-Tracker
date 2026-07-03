export const canViewBudget = (role) => {
  return role === 'Admin' || role === 'Stakeholder';
};

export const canEditBudget = (role) => {
  return role === 'Admin';
};

export const canEditProjects = (role) => {
  return role === 'Admin' || role === 'Manager';
};

export const canEditModules = (role) => {
  return role === 'Admin' || role === 'Manager';
};

export const canEditSprints = (role) => {
  return role === 'Admin' || role === 'Manager';
};

export const canEditResources = (role) => {
  return role === 'Admin' || role === 'Manager';
};

export const canEditHourlyRate = (role) => {
  return role === 'Admin';
};

export const canCreateHiringRequest = (role) => {
  return role === 'Admin' || role === 'Manager';
};

export const canCreateSkillDevelopment = (role) => {
  return role === 'Admin' || role === 'Manager';
};

export const isReadOnlyRole = (role) => {
  return role === 'Stakeholder';
};

// Check if a user can update a specific task
export const canUpdateTask = (role, task, currentUser) => {
  if (role === 'Admin' || role === 'Manager') {
    return true;
  }
  if (role === 'Stakeholder') {
    return false;
  }
  if (role === 'Team Member') {
    // Can only edit if they are assigned to this task
    return task && task.resourceName === currentUser;
  }
  return false;
};

// Check what fields a user can edit on a task
export const getTaskEditableFields = (role, task, currentUser) => {
  if (role === 'Admin' || role === 'Manager') {
    return {
      status: true,
      progressPercent: true,
      actualHours: true,
      description: true,
      plannedHours: true,
      resourceName: true,
      priority: true,
      storyPoints: true,
      startDate: true,
      endDate: true,
      epicId: true,
      moduleId: true,
      projectId: true,
      remarks: true,
      comments: true
    };
  }
  if (role === 'Team Member' && task && task.resourceName === currentUser) {
    return {
      status: true,
      progressPercent: true,
      actualHours: true,
      remarks: true,
      comments: true,
      // Others are read-only
      description: false,
      plannedHours: false,
      resourceName: false,
      priority: false,
      storyPoints: false,
      startDate: false,
      endDate: false,
      epicId: false,
      moduleId: false,
      projectId: false
    };
  }
  return {
    status: false,
    progressPercent: false,
    actualHours: false,
    description: false,
    plannedHours: false,
    resourceName: false,
    priority: false,
    storyPoints: false,
    startDate: false,
    endDate: false,
    epicId: false,
    moduleId: false,
    projectId: false,
    remarks: false,
    comments: false
  };
};
