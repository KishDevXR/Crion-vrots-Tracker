import React from 'react';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';

export default function KanbanBoard({ tasks, onTaskStatusChange, onCardClick }) {
  const columns = [
    { id: 'Not Started', title: 'Not Started' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Blocked', title: 'Blocked' },
    { id: 'Done', title: 'Done' }
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    // Call status change handler
    onTaskStatusChange(taskId, newStatus);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={colTasks}
              onCardClick={onCardClick}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
