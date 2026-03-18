import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';

interface SourceCardProps {
  id: string;
  type: 'content' | 'pda'; // Puede ser Contenido o PDA
  text: string;
  sourceInfo?: string; // Información extra (ej. "Español • 1°")
}

export const SourceCard = ({ id, type, text, sourceInfo }: SourceCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { type, text, sourceInfo }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative group flex items-start p-3 mb-3 bg-white rounded-lg border-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all touch-none
        ${isDragging ? 'opacity-50 z-50 rotate-2' : 'opacity-100'}
        ${type === 'content' ? 'border-green-200 hover:border-green-400' : 'border-dashed border-slate-300 hover:border-slate-400'}
      `}
    >
      <div className="mr-2 mt-1 text-slate-300">
        <GripVertical size={16} />
      </div>

      <div className="flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
          {sourceInfo}
        </p>
        <p className="text-xs text-slate-700 font-medium leading-snug">
          {text}
        </p>
      </div>
    </div>
  );
};