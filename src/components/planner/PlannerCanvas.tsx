import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2, BookOpen, Target, Layout } from 'lucide-react';

interface PlannedItem {
  id: string;
  type: 'content' | 'pda';
  text: string;
  sourceInfo: string;
  campo?: string; // Ajustado a "campo" formativo para la NEM
}

interface PlannerCanvasProps {
  items?: PlannedItem[];              
  onRemoveItem: (id: string) => void; 
}

// Datos inyectados para visualizar el diseño. 
// Una vez que el componente padre pase los 'items' reales, estos serán ignorados.
const MOCK_ITEMS: PlannedItem[] = [
  {
    id: 'c1',
    type: 'content',
    campo: 'Saberes',
    sourceInfo: 'Fase 6 - 1° Grado',
    text: 'La diversidad de saberes e intercambio de conocimientos acerca de los seres vivos y las relaciones con el medio ambiente.'
  },
  {
    id: 'p1',
    type: 'pda',
    sourceInfo: 'Biología',
    text: 'Reconoce la importancia de los conocimientos, prácticas e innovaciones de los pueblos originarios acerca de los seres vivos.'
  }
];

export const PlannerCanvas = ({ items = MOCK_ITEMS, onRemoveItem }: PlannerCanvasProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'planner-canvas',
  });

  const contentsCount = items.filter(item => item.type === 'content').length;
  const pdasCount = items.filter(item => item.type === 'pda').length;

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      
      {/* ENCABEZADO DE CONTADORES */}
      {items.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1 animate-fade-in">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            Lienzo de Trabajo
          </h3>
          <div className="flex gap-2">
            <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <BookOpen size={12} /> {contentsCount} {contentsCount === 1 ? 'Contenido' : 'Contenidos'}
            </span>
            <span className="bg-orange-100 text-orange-800 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <Target size={12} /> {pdasCount} {pdasCount === 1 ? 'PDA' : 'PDAs'}
            </span>
          </div>
        </div>
      )}

      {/* ÁREA DE SOLTAR (DROP ZONE) */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 overflow-y-auto scrollbar-thin pb-32 relative
          ${isOver 
            ? 'border-[#135bec] bg-blue-50/50 shadow-inner' 
            : 'border-dashed border-slate-300 bg-white hover:border-slate-400'
          }
        `}
      >
        {items.length === 0 ? (
          
          /* ESTADO VACÍO (Igualado a tu captura de pantalla) */
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 select-none pointer-events-none animate-fade-in">
            <div className="bg-blue-50 p-5 rounded-full mb-4">
              <Layout size={40} className="text-blue-300" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-bold text-slate-600 mb-1">Tu Lienzo está vacío</p>
            <p className="text-sm text-slate-400 font-medium max-w-xs text-center leading-relaxed">
              Arrastra y suelta aquí los Contenidos y PDAs que usarás en tu proyecto.
            </p>
          </div>

        ) : (
          
          /* LISTA DE ITEMS ARRASTRADOS (Mantiene tu diseño original) */
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="relative group animate-fade-in">
                
                {/* TARJETA CON JERARQUÍA VISUAL */}
                <div className={`
                  border p-3 sm:p-4 rounded-xl flex gap-3 items-start transition-all duration-200
                  ${item.type === 'content' 
                    ? 'bg-white border-blue-200 shadow-sm hover:shadow-md hover:border-blue-300 relative z-10' 
                    : 'bg-orange-50/50 border-orange-200 ml-6 sm:ml-10 hover:bg-orange-50 relative'
                  }
                `}>
                  
                  {/* Conector visual lateral para PDAs */}
                  {item.type === 'pda' && (
                    <div className="absolute -left-6 sm:-left-10 top-1/2 w-6 sm:w-10 h-px bg-orange-200 -z-10"></div>
                  )}

                  {/* Icono de Agarre visual */}
                  <div className="mt-0.5 text-slate-300 group-hover:text-slate-400 transition-colors cursor-grab active:cursor-grabbing">
                    {item.type === 'content' ? <BookOpen size={18} className="text-blue-400"/> : <Target size={18} className="text-orange-400"/>}
                  </div>

                  <div className="flex-1 min-w-0">
                    
                    {/* ENCABEZADO DE LA TARJETA */}
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          
                          {/* ETIQUETA DE TIPO */}
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider shadow-sm
                            ${item.type === 'content' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}
                          `}>
                            {item.type === 'content' ? (item.campo || 'Contenido') : 'PDA'}
                          </span>
                          
                          {/* INFO DE ORIGEN */}
                          <span className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-[150px] sm:max-w-[250px] bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {item.sourceInfo}
                          </span>
                       </div>
                       
                       {/* BOTÓN ELIMINAR */}
                       <button 
                         onClick={() => onRemoveItem(item.id)} 
                         className="text-slate-300 hover:bg-red-50 hover:text-red-600 transition-colors p-1.5 rounded-lg opacity-0 group-hover:opacity-100 shrink-0"
                         title="Quitar del lienzo"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>

                    {/* TEXTO DEL CONTENIDO/PDA */}
                    <p className={`text-xs sm:text-sm font-medium leading-relaxed
                      ${item.type === 'content' ? 'text-slate-800' : 'text-slate-700'}
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
    </div>
  );
};