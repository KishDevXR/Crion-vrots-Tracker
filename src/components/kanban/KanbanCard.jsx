import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/dateUtils';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

export default function KanbanCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing space-y-3 relative group select-none ${
        isDragging ? 'opacity-40 border-blue-500 shadow-lg grabbing' : ''
      }`}
    >
      {/* Top Section: Priority & Project Tag */}
      <div className="flex justify-between items-center">
        <Badge type="priority" value={task.priority} />
        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-wider">
          {task.projectId === 'proj-1' ? 'Eli Lilly' : task.projectId === 'proj-2' ? 'AGI Modules' : task.projectId === 'proj-3' ? 'ABB Furnace' : 'VROTS'}
        </span>
      </div>

      {/* Title / Description */}
      <h4 className="text-xs font-semibold text-slate-855 dark:text-slate-205 leading-relaxed truncate-2-lines group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {task.description}
      </h4>

      {/* Task progress indicator */}
      {task.progressPercent > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1">
            <div className="bg-blue-600 dark:bg-blue-500 h-1 rounded-full" style={{ width: `${task.progressPercent}%` }} />
          </div>
          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{task.progressPercent}%</span>
        </div>
      )}

      {/* Bottom Section: Hours & Assignee & Due Date */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400">
        <div className="flex gap-2.5">
          <div className="flex items-center gap-1" title="Planned vs Actual Hours">
            <Clock size={11} className="text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-350">{task.actualHours || 0}</span>
            <span className="text-slate-400">/</span>
            <span>{task.plannedHours}h</span>
          </div>

          <div className="flex items-center gap-1" title="End Date">
            <Calendar size={11} className="text-slate-400" />
            <span>{formatDate(task.endDate)}</span>
          </div>
        </div>

        {/* Assignee Avatar */}
        {task.resourceName ? (
          <Avatar name={task.resourceName} size="sm" />
        ) : (
          <span className="text-[9px] text-slate-400 italic">Unassigned</span>
        )}
      </div>

      {/* Blocker alert dot */}
      {task.status === 'Blocked' && (
        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
      )}
    </div>
  );
}
