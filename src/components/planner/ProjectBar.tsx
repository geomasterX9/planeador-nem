import React from 'react';
import { User, Briefcase, Calendar, Settings } from 'lucide-react';

interface ProjectBarProps {
  data: any;
  onEdit: () => void;
}

export const ProjectBar = ({ data, onEdit }: ProjectBarProps) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
      
      {/* Información del Proyecto */}
      <div className="flex items-center gap-6 overflow-hidden w-full md:w-auto">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
             <Briefcase size={20} />
           </div>
           <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proyecto</p>
             <h3 className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{data.proyecto || "Sin Nombre"}</h3>
           </div>
        </div>

        <div className="h-8 w-px bg-slate-100 hidden md:block"></div>

        <div className="flex items-center gap-3 hidden md:flex">
           <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
             <User size={20} />
           </div>
           <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Docente</p>
             <h3 className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{data.maestro || "Sin Asignar"}</h3>
           </div>
        </div>
      </div>

      {/* Datos Secundarios y Botón */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
         <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <Calendar size={14}/>
            <span>{data.fechaInicio || "--/--"} ➜ {data.fechaFin || "--/--"}</span>
         </div>

         <button 
           onClick={onEdit}
           className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
         >
           <Settings size={14}/>
           Editar Datos
         </button>
      </div>
    </div>
  );
};