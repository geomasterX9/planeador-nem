import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';

interface PDACardProps {
  id: string;
  grado: number;
  texto: string;
  disciplina: string;
}

export const PDACard = ({ id, grado, texto, disciplina }: PDACardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { grado, texto, disciplina }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // --- CAMBIO DE COLOR AQUÍ ---
  const getBorderColor = () => {
    switch(grado) {
      case 1: return 'border-l-blue-500';
      case 2: return 'border-l-yellow-500'; // Antes era Green
      case 3: return 'border-l-orange-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative group flex items-start p-3 mb-3 bg-white rounded-lg shadow-sm border border-slate-200 
        ${getBorderColor()} border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all touch-none
        ${isDragging ? 'opacity-50 z-50 ring-2 ring-blue-400 rotate-2' : 'opacity-100'}
      `}
    >
      <div className="mr-2 mt-1 text-slate-400">
        <GripVertical size={18} />
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            {disciplina} • {grado}°
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-snug line-clamp-3">
          {texto}
        </p>
      </div>
    </div>
  );
};