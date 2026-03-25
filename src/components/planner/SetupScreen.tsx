import React from 'react';
import { User, Briefcase, Calendar, Layers, PenTool, ArrowRight, BookOpen, Clock, CheckCircle2, Building2, ImagePlus, X, Settings, Map } from 'lucide-react';

interface SetupScreenProps {
  data: any;
  onChange: (field: string, value: any) => void;
  onComplete: () => void;
}

export const SetupScreen = ({ data, onChange, onComplete }: SetupScreenProps) => {
  const safeData = data || {};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    // Forzar mayúsculas solo si es un campo de texto corto (no el textarea del contexto)
    if (e.target.type === 'text') {
      value = value.toUpperCase();
    }
    onChange(e.target.name, value);
  };

  const handleCheckbox = (field: string, value: string) => {
    const currentList = safeData[field] || [];
    let newList = currentList.includes(value)
      ? currentList.filter((item: string) => item !== value)
      : [...currentList, value];
      
    if (field === 'grupo') newList.sort();
    onChange(field, newList);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onChange(field, reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field: string) => onChange(field, null);

  const estadosMexico = [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
  ];
  const modalidadesSecundaria = ["Secundaria Técnica", "Secundaria General", "Telesecundaria"];
  const ejes = ["Igualdad de género", "Inclusión", "Apropiación de las culturas", "Interculturalidad crítica", "Arte y experiencias estéticas", "Vida saludable", "Pensamiento crítico"];
  const herramientas = ["Rúbricas", "Listas de cotejo", "Guías de observación", "Escalas estimativas", "Cuestionarios", "Exámenes escritos"];
  const tiposEvaluacion = ["Autoevaluación", "Coevaluación", "Heteroevaluación"];

  // CLASES VISUALES CLARAS Y DE ALTO CONTRASTE
  const panelClass = "bg-white rounded-2xl p-6 shadow-sm border border-slate-200";
  const inputClass = "w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#135bec] outline-none transition-all text-slate-800 font-bold placeholder:text-slate-400 text-sm";
  const labelClass = "block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5 ml-1";
  
  // Botones de selección con ALTO CONTRASTE
  const btnUnselected = "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all";
  const btnSelected = "bg-[#135bec] text-white border-[#135bec] shadow-md shadow-blue-500/20 transform scale-[1.02] transition-all";

  const isFormValid = safeData.proyecto && safeData.maestro && safeData.estrategia && (safeData.grupo && safeData.grupo.length > 0);

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden selection:bg-[#135bec]/20 selection:text-[#135bec]">
      
      {/* HEADER ESTANDARIZADO */}
      <header className="h-14 md:h-16 border-b border-slate-200 bg-white sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 text-[#135bec]">
            <Layers className="text-[#135bec]" size={20} />
            <h2 className="text-base md:text-lg font-bold tracking-tight text-slate-900">Planeador <span className="hidden sm:inline">NEM</span> <span className="text-[#135bec]/80">Pro</span></h2>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2"></div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
            <Settings size={16} />
            <span className="hidden sm:inline">Configuración Inicial</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* BARRA LATERAL OSCURA (Consistencia con SequenceScreen) */}
        <aside className="hidden md:flex w-52 lg:w-60 xl:w-72 bg-[#0f172a] text-slate-300 flex-col shrink-0 z-20">
          <div className="p-4 xl:p-6 border-b border-slate-800">
            <h3 className="text-white font-bold text-base xl:text-lg">Paso 1: Datos</h3>
            <p className="text-[10px] xl:text-xs text-slate-400 mt-1">Configuración del proyecto</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 xl:p-6 space-y-6">
            <div>
              <h4 className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Instrucciones</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Llena los datos institucionales y pedagógicos. La Inteligencia Artificial utilizará este contexto para redactar tus planeaciones con precisión.</p>
            </div>
            <div>
              <h4 className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Progreso</h4>
              <ul className="space-y-3 text-xs font-medium">
                <li className={`flex items-center gap-2 ${safeData.escuela ? 'text-emerald-400' : 'text-slate-500'}`}><CheckCircle2 size={16}/> Escuela / CCT</li>
                <li className={`flex items-center gap-2 ${safeData.contexto ? 'text-emerald-400' : 'text-slate-500'}`}><CheckCircle2 size={16}/> Contexto Analítico</li>
                <li className={`flex items-center gap-2 ${safeData.proyecto ? 'text-emerald-400' : 'text-slate-500'}`}><CheckCircle2 size={16}/> Proyecto / Docente</li>
                <li className={`flex items-center gap-2 ${safeData.estrategia ? 'text-emerald-400' : 'text-slate-500'}`}><CheckCircle2 size={16}/> Metodología</li>
                <li className={`flex items-center gap-2 ${(safeData.grupo && safeData.grupo.length > 0) ? 'text-emerald-400' : 'text-slate-500'}`}><CheckCircle2 size={16}/> Grados y Grupos</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* ÁREA DE TRABAJO (Light Mode) */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 lg:p-6 xl:p-8 scrollbar-thin">
          <div className="max-w-4xl mx-auto flex flex-col gap-6 lg:gap-8 pb-10">
            
            <div className={panelClass}>
              <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
                <Building2 className="text-[#135bec]" size={20}/> Datos Institucionales
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Nombre de la Escuela</label>
                  <div className="relative group">
                    <Building2 className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-[#135bec] transition-colors" size={18} />
                    <input name="escuela" type="text" value={safeData.escuela || ''} onChange={handleChange} placeholder="Ej. SECUNDARIA TÉCNICA NO. 84" className={inputClass} />
                  </div>
                </div>
                
                <div>
                  <label className={labelClass}>Estado de la República</label>
                  <select name="estado" value={safeData.estado || ''} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#135bec] outline-none text-slate-800 text-sm font-bold">
                    <option value="">Seleccione su estado...</option>
                    {estadosMexico.map(est => <option key={est} value={est}>{est}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Modalidad</label>
                  <select name="modalidad" value={safeData.modalidad || ''} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#135bec] outline-none text-slate-800 text-sm font-bold">
                    <option value="">Seleccione modalidad...</option>
                    {modalidadesSecundaria.map(mod => <option key={mod} value={mod}>{mod}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>CCT (Clave)</label>
                  <input name="cct" type="text" value={safeData.cct || ''} onChange={handleChange} placeholder="Ej. 24DST0092Z" className={inputClass.replace('pl-11', 'px-4')} />
                </div>
                <div>
                  <label className={labelClass}>Turno</label>
                  <select name="turno" value={safeData.turno || ''} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#135bec] outline-none text-slate-800 text-sm font-bold">
                    <option value="">Seleccione...</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Tiempo Completo">Tiempo Completo</option>
                  </select>
                </div>
              </div>

              <div>
                 <label className={labelClass}>Logotipos para Encabezado Oficial</label>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center p-4 group overflow-hidden h-28">
                      {safeData.logoIzquierdo ? (
                        <>
                          <img src={safeData.logoIzquierdo} alt="Logo" className="h-full object-contain" />
                          <button onClick={() => removeImage('logoIzquierdo')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="text-slate-400 mb-2 group-hover:text-[#135bec] transition-colors" size={24} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Logo Gobierno / SEP<br/>(Izquierda)</span>
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoIzquierdo')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </>
                      )}
                   </div>
                   <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center p-4 group overflow-hidden h-28">
                      {safeData.logoDerecho ? (
                        <>
                          <img src={safeData.logoDerecho} alt="Logo" className="h-full object-contain" />
                          <button onClick={() => removeImage('logoDerecho')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="text-slate-400 mb-2 group-hover:text-[#135bec] transition-colors" size={24} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Logo Escuela<br/>(Derecha)</span>
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoDerecho')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </>
                      )}
                   </div>
                 </div>
              </div>
            </div>

            {/* NUEVO PANEL: DIAGNÓSTICO Y PROGRAMA ANALÍTICO */}
            <div className={panelClass}>
              <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
                <Map className="text-[#135bec]" size={20}/> Diagnóstico y Programa Analítico
              </h2>
              <div>
                <label className={labelClass}>Contexto Socioeducativo de la Escuela y Grupo</label>
                <p className="text-[10px] md:text-xs text-slate-500 mb-3 font-medium leading-relaxed">
                  Copia y pega aquí los elementos clave de tu Programa Analítico (diagnóstico de la comunidad, intereses de los alumnos, problemáticas locales, etc.). <br/><span className="text-[#135bec] font-bold">¡La Inteligencia Artificial utilizará este texto para contextualizar tus actividades!</span>
                </p>
                <textarea 
                  name="contexto" 
                  value={safeData.contexto || ''} 
                  onChange={handleChange} 
                  placeholder="Ej. La Secundaria Técnica 84 se encuentra en una zona urbana con problemas de escasez de agua. Los alumnos muestran gran interés por la tecnología, pero un 30% tiene rezago en comprensión lectora. Su estilo de aprendizaje es predominantemente kinestésico..." 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#135bec] outline-none transition-all text-slate-800 text-sm resize-y min-h-[140px]"
                />
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
                <BookOpen className="text-[#135bec]" size={20}/> Datos Pedagógicos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Nombre del Docente</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-[#135bec] transition-colors" size={18} />
                    <input name="maestro" type="text" value={safeData.maestro || ''} onChange={handleChange} placeholder="Ej. PROFR. JORGE ALFONSO" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Nombre del Proyecto</label>
                  <div className="relative group">
                    <Briefcase className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-[#135bec] transition-colors" size={18} />
                    <input name="proyecto" type="text" value={safeData.proyecto || ''} onChange={handleChange} placeholder="Ej. MI CUENTO ES MÁGICO" className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div>
                  <label className={labelClass}>Grado</label>
                  <div className="flex gap-2">
                    {['1', '2', '3'].map(g => (
                      <div key={g} onClick={() => { onChange('grado', g); window.dispatchEvent(new CustomEvent('gradoCambiado', { detail: Number(g) })); }} className={`cursor-pointer flex-1 rounded-xl py-3 flex items-center justify-center text-sm font-bold select-none ${safeData.grado === g ? btnSelected : btnUnselected}`}>
                        {g}°
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Grupo (s)</label>
                  <div className="flex gap-2">
                    {['A', 'B', 'C', 'D'].map(g => (
                      <div key={g} onClick={() => handleCheckbox('grupo', g)} className={`cursor-pointer flex-1 rounded-xl py-3 flex items-center justify-center text-sm font-bold select-none ${(safeData.grupo || []).includes(g) ? btnSelected : btnUnselected}`}>
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MAGIA RESPONSIVA APLICADA AQUÍ */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5 mt-5">
                <div className="md:col-span-1 xl:col-span-5">
                  <label className={labelClass}>Metodología Didáctica</label>
                   <select name="estrategia" value={safeData.estrategia || ''} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#135bec] outline-none text-slate-800 text-sm font-bold">
                      <option value="">Seleccione...</option>
                      <option value="Aprendizaje Basado en Problemas">Aprendizaje Basado en Problemas</option>
                      <option value="Aprendizaje basado en indagación STEAM">Indagación STEAM</option>
                      <option value="Aprendizaje Comunitario">Proyectos Comunitarios</option>
                      <option value="Aprendizaje Servicio">Aprendizaje Servicio</option>
                      <option value="Secuencia Didáctica">Secuencia Didáctica</option>
                    </select>
                </div>

                <div className="md:col-span-1 xl:col-span-3">
                  <label className={labelClass}>Total Sesiones</label>
                  <div className="relative group">
                    <Clock className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-[#135bec] transition-colors" size={18} />
                    <input type="number" min="1" max="99" name="sesiones" value={safeData.sesiones || ''} onChange={(e) => { if(e.target.value.length > 2) e.target.value = e.target.value.slice(0,2); handleChange(e); }} placeholder="Ej. 10" className={inputClass} />
                  </div>
                </div>

                <div className="md:col-span-2 xl:col-span-4">
                  <label className={labelClass}>Periodo de Aplicación</label>
                  <div className="flex items-center gap-1 bg-slate-50 rounded-xl border border-slate-200 p-2.5 focus-within:ring-2 focus-within:ring-[#135bec] focus-within:bg-white transition-all min-h-[46px]">
                    <Calendar className="text-slate-400 shrink-0 mx-1" size={16} />
                    <input type="date" name="fechaInicio" value={safeData.fechaInicio || ''} onChange={handleChange} className="bg-transparent text-[10px] md:text-xs font-bold text-slate-700 outline-none w-full min-w-0" />
                    <span className="text-slate-400 text-[10px] mx-0.5 shrink-0">➜</span>
                    <input type="date" name="fechaFin" value={safeData.fechaFin || ''} onChange={handleChange} className="bg-transparent text-[10px] md:text-xs font-bold text-slate-700 outline-none w-full min-w-0" />
                  </div>
                </div>
              </div>
            </div>

            <div className={panelClass}>
               <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
                <Layers className="text-[#135bec]" size={20}/> Ejes Articuladores
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {ejes.map(eje => (
                  <div key={eje} onClick={() => handleCheckbox('ejes', eje)} className={`cursor-pointer px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-bold select-none flex items-center gap-2 ${(safeData.ejes || []).includes(eje) ? btnSelected : btnUnselected}`}>
                    {(safeData.ejes || []).includes(eje) && <CheckCircle2 size={16}/>}
                    {eje}
                  </div>
                ))}
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
                <PenTool className="text-[#135bec]" size={20}/> Evaluación Formativa
              </h2>
              
              <div className="mb-6">
                <label className={labelClass}>Estrategia (Quién evalúa)</label>
                <div className="flex flex-wrap gap-2.5">
                  {tiposEvaluacion.map(tipo => (
                    <div key={tipo} onClick={() => handleCheckbox('estrategiaEvaluacion', tipo)} className={`cursor-pointer w-full md:w-auto flex-1 p-3 md:p-4 rounded-xl flex items-center justify-between gap-4 text-xs md:text-sm font-bold uppercase select-none ${(safeData.estrategiaEvaluacion || []).includes(tipo) ? btnSelected : btnUnselected}`}>
                      <span>{tipo}</span>
                      {(safeData.estrategiaEvaluacion || []).includes(tipo) ? <CheckCircle2 size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Instrumentos (Con qué)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {herramientas.map(herr => (
                    <div key={herr} onClick={() => handleCheckbox('herramientas', herr)} className={`cursor-pointer p-3 rounded-xl flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase select-none ${(safeData.herramientas || []).includes(herr) ? btnSelected : btnUnselected}`}>
                      {(safeData.herramientas || []).includes(herr) ? <CheckCircle2 size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
                      <span className="truncate">{herr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={onComplete}
              disabled={!isFormValid}
              className={`w-full py-4 md:py-5 rounded-2xl text-base md:text-lg font-black tracking-wide flex items-center justify-center gap-3 transition-all duration-300 group
                ${isFormValid 
                  ? 'bg-[#135bec] text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-xl cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              IR AL LIENZO DE PLANEACIÓN
              <ArrowRight size={22} className={isFormValid ? "group-hover:translate-x-1 transition-transform" : ""} />
            </button>
            
          </div>
        </main>
      </div>
    </div>
  );
};