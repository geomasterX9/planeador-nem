import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, User, Briefcase, BookOpen, Layers, PenTool } from 'lucide-react';

interface PlanningHeaderProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export const PlanningHeader = ({ data, onChange }: PlanningHeaderProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Verificación de seguridad: si data no existe, usamos un objeto vacío para evitar errores
  const safeData = data || {};

  const ejesArticuladores = [
    "Igualdad de género", "Inclusión", "Apropiación de las culturas",
    "Interculturalidad crítica", "Arte y experiencias estéticas",
    "Vida saludable", "Pensamiento crítico"
  ];

  const herramientasEvaluacion = [
    "Rúbricas", "Listas de cotejo", "Guías de observación",
    "Escalas estimativas", "Cuestionarios", "Exámenes escritos", "Exámenes orales"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e.target.name, e.target.value);
  };

  const handleCheckbox = (field: string, value: string) => {
    const currentList = safeData[field] || [];
    let newList;
    if (currentList.includes(value)) {
      newList = currentList.filter((item: string) => item !== value);
    } else {
      newList = [...currentList, value];
    }
    onChange(field, newList);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
      
      {/* --- NIVEL SUPERIOR: DATOS CLAVE --- */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        
        {/* Columna 1: Maestro y Proyecto */}
        <div className="md:col-span-4 space-y-3">
          <div className="relative group">
            <div className="absolute left-3 top-2 text-slate-400">
              <User size={16} />
            </div>
            <input 
              name="maestro" 
              value={safeData.maestro || ''} 
              onChange={handleChange}
              placeholder="Nombre del Docente"
              type="text" 
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white" 
            />
          </div>
          <div className="relative group">
             <div className="absolute left-3 top-2 text-slate-400">
              <Briefcase size={16} />
            </div>
            <input 
              name="proyecto" 
              value={safeData.proyecto || ''} 
              onChange={handleChange}
              placeholder="Nombre del Proyecto"
              type="text" 
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white" 
            />
          </div>
        </div>

        {/* Columna 2: Configuración Didáctica */}
        <div className="md:col-span-5 space-y-3">
          <div className="flex gap-2">
            <div className="w-1/3 relative">
               <select name="trimestre" value={safeData.trimestre || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-700">
                <option value="">Trimestre...</option>
                <option value="1">1er Trimestre</option>
                <option value="2">2do Trimestre</option>
                <option value="3">3er Trimestre</option>
              </select>
            </div>
            <div className="w-2/3 relative">
               <select name="estrategia" value={safeData.estrategia || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-700">
                <option value="">Estrategia Didáctica...</option>
                <option value="ABP">Aprendizaje basado en problemas</option>
                <option value="Proyectos">Aprendizaje basado en proyectos</option>
                <option value="Casos">Estudio de casos</option>
                <option value="STEAM">Aprendizaje basado en STEAM</option>
                <option value="Servicio">Aprendizaje basado en servicios</option>
                <option value="Secuencia Didáctica" className="bg-slate-900">Secuencia Didáctica</option>
              </select>
            </div>
          </div>
          
          {/* Fechas Compactas */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
             <Calendar size={16} className="text-slate-400 mr-2" />
             <span className="text-xs text-slate-500 mr-2 font-bold uppercase">Periodo:</span>
             <input type="date" name="fechaInicio" value={safeData.fechaInicio || ''} onChange={handleChange} className="bg-transparent text-xs text-slate-700 outline-none cursor-pointer font-medium" />
             <span className="text-slate-300 mx-3">➜</span>
             <input type="date" name="fechaFin" value={safeData.fechaFin || ''} onChange={handleChange} className="bg-transparent text-xs text-slate-700 outline-none cursor-pointer font-medium" />
          </div>
        </div>

        {/* Columna 3: Botón de Expansión */}
        <div className="md:col-span-3 flex justify-end">
           <button 
             onClick={() => setIsExpanded(!isExpanded)}
             className={`
               w-full md:w-auto h-10 flex items-center justify-center gap-2 px-4 rounded-md text-xs font-bold uppercase tracking-wide transition-all border shadow-sm
               ${isExpanded 
                 ? 'bg-blue-600 text-white border-blue-600' 
                 : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}
             `}
           >
             {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
             {isExpanded ? 'Cerrar' : 'Evaluación'}
           </button>
        </div>

      </div>

      {/* --- NIVEL INFERIOR: DETALLES DESPLEGABLES --- */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Ejes Articuladores */}
          <div>
            <h3 className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase mb-3">
              <Layers size={14}/> Ejes articuladores
            </h3>
            <div className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2">
              {ejesArticuladores.map((eje, idx) => (
                <label key={idx} className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                  <input 
                    type="checkbox" 
                    checked={(safeData.ejes || []).includes(eje)}
                    onChange={() => handleCheckbox('ejes', eje)}
                    className="mt-0.5 w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                  />
                  <span className="text-[11px] text-slate-600 font-medium leading-tight">{eje}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Herramientas de Evaluación */}
          <div>
            <h3 className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase mb-3">
              <PenTool size={14}/> Herramientas de evaluación
            </h3>
            <div className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2">
              {herramientasEvaluacion.map((herr, idx) => (
                <label key={idx} className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                   <input 
                    type="checkbox" 
                    checked={(safeData.herramientas || []).includes(herr)}
                    onChange={() => handleCheckbox('herramientas', herr)}
                    className="mt-0.5 w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                  />
                  <span className="text-[11px] text-slate-600 font-medium leading-tight">{herr}</span>
                </label>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};