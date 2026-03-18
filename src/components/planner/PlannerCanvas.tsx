import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';

interface PlannedItem {
  id: string;
  type: 'content' | 'pda';
  text: string;
  sourceInfo: string;
  disciplina?: string; // <--- Agregamos este dato para poder mostrarlo
}

interface PlannerCanvasProps {
  items: PlannedItem[];              
  onRemoveItem: (id: string) => void; 
}

export const PlannerCanvas = ({ items, onRemoveItem }: PlannerCanvasProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'planner-canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 h-full min-h-[500px] p-3 rounded-xl border-2 transition-all overflow-y-auto pb-32
        ${isOver ? 'border-blue-500 bg-blue-50/30' : 'border-dashed border-slate-300 bg-white'}
      `}
    >
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-300 select-none pointer-events-none">
          <p className="text-xl font-bold uppercase tracking-widest opacity-50">Área de Planeación</p>
          <p className="text-sm">Arrastra Contenidos y PDAs aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="relative group animate-in fade-in slide-in-from-bottom-1">
              
              {/* TARJETA CON CONTRASTE DE COLOR E INDENTACIÓN */}
              <div className={`
                border border-slate-200 p-2 rounded flex gap-3 items-start hover:shadow-sm transition-shadow group-hover:border-slate-300
                ${item.type === 'content' 
                  ? 'bg-slate-50'          // Fondo gris muy suave para Contenidos
                  : 'bg-orange-50/60 ml-8' // Fondo naranja suave + Indentación mayor para PDAs
                }
              `}>
                
                {/* Barra lateral de color */}
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 
                  ${item.type === 'content' ? 'bg-blue-600' : 'bg-orange-400'}
                `}></div>

                <div className="flex-1 min-w-0">
                  {/* Encabezado: Etiqueta + Origen + Borrar */}
                  <div className="flex justify-between items-center mb-1">
                     <div className="flex items-center gap-2">
                        
                        {/* ETIQUETA DINÁMICA: Si es contenido muestra la Disciplina, si no, dice PDA */}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider
                          ${item.type === 'content' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                        `}>
                          {item.type === 'content' ? (item.disciplina || 'Contenido') : 'PDA'}
                        </span>
                        
                        {/* Info extra (Tema 1, Tema 2...) */}
                        <span className="text-[9px] text-slate-400 font-medium uppercase truncate max-w-[200px]">
                          {item.sourceInfo}
                        </span>
                     </div>
                     
                     {/* Botón eliminar invisible hasta pasar el mouse */}
                     <button 
                       onClick={() => onRemoveItem(item.id)} 
                       className="text-slate-300 hover:text-red-500 transition-colors p-0.5 opacity-0 group-hover:opacity-100"
                       title="Eliminar"
                     >
                       <Trash2 size={14} />
                     </button>
                  </div>

                  {/* Texto Principal */}
                  <p className={`text-xs font-medium leading-snug
                    ${item.type === 'content' ? 'text-slate-800' : 'text-slate-600'}
                  `}>
                    {item.text}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};