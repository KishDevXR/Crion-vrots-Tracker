import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ id, title, tasks, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: id
  });

  // Rollups
  const taskCount = tasks.length;
  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const totalPlannedHours = tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0);

  // Column header colors
  const getHeaderColors = (colId) => {
    switch (colId) {
      case 'Not Started':
        return 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
      case 'In Progress':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50';
      case 'Blocked':
        return 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/50';
      case 'Done':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50';
      default:
        return 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className={`w-80 shrink-0 bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 flex flex-col border transition-colors duration-150 h-[calc(100vh-220px)] ${
        isOver ? 'bg-blue-50/20 dark:bg-blue-950/10 border-blue-300 dark:border-blue-800' : 'border-slate-200/60 dark:border-slate-800/40'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getHeaderColors(id)}`}>
            {title}
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {taskCount}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-2">
          <span>{totalPoints} pts</span>
          <span>•</span>
          <span>{totalPlannedHours}h</span>
        </div>
      </div>

      {/* Cards Scrollable Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onClick={onCardClick} />
        ))}
        {taskCount === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-450 italic">
            Drag items here
          </div>
        )}
      </div>
    </div>
  );
}
