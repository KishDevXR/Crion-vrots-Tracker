export const getStatusColors = (status) => {
  const normStatus = (status || '').toLowerCase();
  switch (normStatus) {
    case 'not started':
    case 'pending':
    case 'planned':
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400'
      };
    case 'in progress':
    case 'wip':
    case 'active':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-100 dark:border-blue-900/50',
        dot: 'bg-blue-500'
      };
    case 'blocked':
    case 'hold':
    case 'on hold':
      return {
        bg: 'bg-red-50 dark:bg-red-950/40',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-100 dark:border-red-900/50',
        dot: 'bg-red-500'
      };
    case 'uat':
    case 'testing':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-100 dark:border-amber-900/50',
        dot: 'bg-amber-500'
      };
    case 'done':
    case 'complete':
    case 'completed':
    case 'deployment':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-100 dark:border-emerald-900/50',
        dot: 'bg-emerald-500'
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400'
      };
  }
};

export const getPriorityColors = (priority) => {
  const normPriority = (priority || '').toLowerCase();
  switch (normPriority) {
    case 'low':
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        icon: 'text-slate-400'
      };
    case 'medium':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-600 dark:text-blue-400',
        icon: 'text-blue-400'
      };
    case 'high':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/40',
        text: 'text-orange-700 dark:text-orange-400',
        icon: 'text-orange-500'
      };
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-950/40',
        text: 'text-red-700 dark:text-red-400',
        icon: 'text-red-500 font-bold'
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        icon: 'text-slate-400'
      };
  }
};
