import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, Calendar, Layers, PenTool, ArrowLeft, BookOpen, Clock, CheckCircle2, Building2, ImagePlus, X, Settings, Map, Sparkles, UploadCloud, FolderOpen, ArrowRight, UserCircle, Lock, Target, CheckSquare, UserCheck, FileText } from 'lucide-react';

interface SetupScreenProps {
  data: any;
  onChange: (field: string, value: any) => void;
  onComplete: () => void;
  onOpenSchedule: () => void;
  onBackToDashboard?: () => void;
  saveToCloud?: () => void;
  isSaving?: boolean;
  user?: any;
  isPremium?: boolean;
  onLogout?: () => void;
  onPremiumClick?: () => void;
  freeCredits?: number;
  consumeCredit?: () => boolean;
}

export const SetupScreen = ({ data, onChange, onComplete, onOpenSchedule, onBackToDashboard, saveToCloud, isSaving, user, isPremium, onLogout, onPremiumClick, freeCredits }: SetupScreenProps) => {
  const safeData = data || {};
  const [showUserMenu, setShowUserMenu] = useState(false);

  const scheduleData = JSON.parse(localStorage.getItem('nem_schedule') || '{}');
  const hasActiveSchedule = Object.keys(scheduleData).length > 0;

  // 🔓 CANDADO ELIMINADO: Ahora todos ven el banner verde si tienen horario guardado
  const displayActiveSchedule = hasActiveSchedule;

  const contextoRef = useRef<HTMLTextAreaElement>(null);

  // ✨ MOTOR DE ARRASTRE PERSONALIZADO (PREMIUM UX) ✨
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = contextoRef.current?.getBoundingClientRect().height || 250;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (contextoRef.current) {
        const newHeight = Math.max(250, startHeight + (moveEvent.clientY - startY));
        contextoRef.current.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // 🔓 MOTOR DE CÁLCULO LIBERADO PARA TODOS
  useEffect(() => {
    if (safeData.fechaInicio && safeData.fechaFin && safeData.grado && safeData.grupo && safeData.grupo.length > 0) {
      try {
        const savedGroups = JSON.parse(localStorage.getItem('nem_groups') || '[]');
        const schedule = JSON.parse(localStorage.getItem('nem_schedule') || '{}');

        const gradoBuscado = String(safeData.grado).trim();
        const gruposBuscados = safeData.grupo.map((g: string) => String(g).trim().toUpperCase());

        // ✨ BLINDAJE 1: RASTREADOR DIFUSO DE GRUPOS
        const targetGroupIds = savedGroups.filter((g: any) => {
          if (!g || !g.id || !g.name) return false;
          const cleanName = String(g.name).toUpperCase().replace(/[\s°º\-_]/g, '');
          return gruposBuscados.some(grupo => cleanName.includes(`${gradoBuscado}${grupo}`));
        }).map((g: any) => String(g.id));

        if (targetGroupIds.length > 0) {
          const modulesPerDay: Record<string, number> = { 'LUNES': 0, 'MARTES': 0, 'MIERCOLES': 0, 'JUEVES': 0, 'VIERNES': 0 };

          // ✨ BLINDAJE 2: ESCÁNER DE HORARIOS OMNIDIRECCIONAL
          Object.entries(schedule).forEach(([key, cellValue]) => {
            const cellGroups = Array.isArray(cellValue) ? cellValue.map(String) : [String(cellValue)];
            const isOurGroup = targetGroupIds.some(id => cellGroups.includes(id));

            if (isOurGroup) {
              const keyUpper = String(key).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              if (keyUpper.includes('LUNES')) modulesPerDay['LUNES']++;
              else if (keyUpper.includes('MARTES')) modulesPerDay['MARTES']++;
              else if (keyUpper.includes('MIERCOLES')) modulesPerDay['MIERCOLES']++;
              else if (keyUpper.includes('JUEVES')) modulesPerDay['JUEVES']++;
              else if (keyUpper.includes('VIERNES')) modulesPerDay['VIERNES']++;
            }
          });

          // ✨ BLINDAJE 3: NEUTRALIZADOR DE ZONAS HORARIAS (T12:00:00)
          const start = new Date(safeData.fechaInicio + 'T12:00:00');
          const end = new Date(safeData.fechaFin + 'T12:00:00');
          let totalSessions = 0;
          const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

          let current = new Date(start);
          while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              totalSessions += modulesPerDay[dayNames[dayOfWeek]];
            }
            current.setDate(current.getDate() + 1);
          }

          // ✨ BLINDAJE 4: ACTUALIZACIÓN SEGURA DE ESTADO
          if (String(safeData.sesiones) !== String(totalSessions) && totalSessions > 0) {
            onChange('sesiones', String(totalSessions));
          }
        }
      } catch (error) {
        console.error("🔥 Error real en motor de cálculo de sesiones:", error);
      }
    }
  }, [safeData.fechaInicio, safeData.fechaFin, safeData.grado, safeData.grupo]); // <-- Quitamos isPremium de las dependencias

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (e.target.type === 'text') value = value.toUpperCase();
    onChange(e.target.name, value);
  };

  const handleCheckbox = (field: string, value: string) => {
    const currentList = safeData[field] || [];
    let newList = currentList.includes(value) ? currentList.filter((item: string) => item !== value) : [...currentList, value];
    if (field === 'grupo') newList.sort();
    onChange(field, newList);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(field, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const estadosMexico = ["Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"];
  const modalidadesSecundaria = ["Secundaria Técnica", "Secundaria General", "Telesecundaria"];
  const ejes = ["Igualdad de género", "Inclusión", "Apropiación de las culturas", "Interculturalidad crítica", "Arte y experiencias estéticas", "Vida saludable", "Pensamiento crítico"];
  const herramientas = ["Rúbricas", "Listas de cotejo", "Guías de observación", "Escalas estimativas", "Cuestionarios", "Exámenes escritos"];
  const tiposEvaluacion = ["Autoevaluación", "Coevaluación", "Heteroevaluación"];

  const panelClass = "bg-white/90 backdrop-blur-md rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-white/60 relative overflow-hidden group";
  const inputClass = "w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#135bec]/10 focus:border-[#135bec] outline-none transition-all text-slate-700 font-bold placeholder:text-slate-400 text-sm shadow-inner";
  const selectClass = "w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#135bec]/10 focus:border-[#135bec] outline-none transition-all text-slate-700 font-bold text-sm shadow-inner cursor-pointer";
  const labelClass = "block text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1";

  const btnUnselected = "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all";
  const btnGlossy = "relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all active:scale-95 after:absolute after:top-0 after:-left-[100%] hover:after:left-[200%] after:w-[50%] after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:skew-x-[-20deg] after:transition-all after:duration-[1500ms] after:ease-out";
  const btnSelected = `border-transparent transform scale-[1.02] ${btnGlossy}`;

  const isFormValid = safeData.proyecto && safeData.maestro && safeData.estrategia && (safeData.grupo && safeData.grupo.length > 0) && safeData.trimestre;

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden selection:bg-[#135bec]/20 relative">
      <div className="absolute top-0 left-1/4 w-1/2 h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="h-14 md:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-[#135bec]">
            <div className="bg-[#135bec] p-2 rounded-xl text-white shadow-md"><Layers size={22} /></div>
            <div className="flex flex-col justify-center">
              <h2 className="text-base md:text-lg font-bold tracking-tight text-slate-900 leading-none mb-1">Planeador NEM <span className="text-[#135bec]/80">Pro</span></h2>
              {isPremium ? (
                <div className="hidden sm:flex items-center gap-1.5 w-fit px-2 py-0.5 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-full shadow-sm">
                  <Sparkles size={10} className="text-amber-500" />
                  <span className="text-[9px] font-black text-amber-700 tracking-widest uppercase">CUENTA PREMIUM ACTIVA</span>
                </div>
              ) : (
                <div onClick={onPremiumClick} className="hidden sm:flex items-center gap-1.5 w-fit px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full shadow-sm mt-1 cursor-pointer hover:bg-slate-200 transition-colors">
                  <Lock size={10} className="text-slate-500" />
                  <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">VERSIÓN GRATUITA</span>
                </div>
              )}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
            <Settings size={16} />
            <span>Configurar Datos Generales</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {isPremium ? (
            <button onClick={onBackToDashboard} className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all">
              <FolderOpen size={16} className="text-slate-500 group-hover:text-[#135bec] transition-colors" />
              <span className="hidden md:inline text-xs font-bold text-slate-700">Mis Planeaciones</span>
            </button>
          ) : (
            <button onClick={onPremiumClick} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer">
              <Lock size={14} className="text-slate-400" />
              <span className="hidden md:inline text-xs font-bold text-slate-500">Mis Planeaciones</span>
            </button>
          )}

          {isPremium ? (
            <button onClick={saveToCloud} disabled={isSaving} className={`flex items-center gap-2 px-5 py-2 rounded-xl border border-transparent ${btnGlossy}`}>
              <UploadCloud size={16} className={isSaving ? "animate-bounce" : ""} />
              <span className="hidden md:inline text-xs font-bold tracking-wide">{isSaving ? 'Guardando...' : 'Guardar en la nube'}</span>
            </button>
          ) : (
            <button onClick={onPremiumClick} className="flex items-center gap-2 px-5 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer">
              <Lock size={14} className="text-slate-400" />
              <span className="hidden md:inline text-xs font-bold text-slate-500 tracking-wide">Guardar en la nube</span>
            </button>
          )}

          {user && onLogout && (
            <div className="relative ml-1 md:ml-2 user-menu-container">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-all focus:outline-none group" title="Mi Cuenta">
                <UserCircle size={24} className="text-slate-500 group-hover:text-[#135bec] transition-colors" />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
              </button>
              {showUserMenu && (
                <div className="absolute top-14 right-0 w-64 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 z-50 animate-fade-in-down">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                    <div className="bg-[#135bec]/10 p-2 rounded-xl text-[#135bec]"><UserCircle size={28} /></div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate" title={user.email}>{user.email}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{isPremium ? 'Docente Premium' : 'Docente Básico'}</p>
                      {!isPremium && <p className="text-[10px] font-bold text-amber-500">⚡ {freeCredits} chispas restantes</p>}
                    </div>
                  </div>
                  <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-rose-50 hover:border-rose-200 transition-colors group">
                    <img src="/exit.png" alt="Salir" className="w-5 h-5 drop-shadow-sm group-hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'inline'; }} />
                    <span className="text-xl drop-shadow-sm hidden">🚪</span>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-rose-600">Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        <aside className="hidden md:flex w-52 lg:w-60 xl:w-72 bg-[#0f172a] text-slate-300 flex-col shrink-0 z-20 shadow-2xl">
          <div className="p-4 xl:p-6 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-white font-bold text-base xl:text-lg flex items-center gap-2"><Sparkles size={16} className="text-[#135bec]" /> Configuración Inicial</h3>
            <p className="text-[10px] xl:text-xs text-slate-400 mt-1">Configuración del proyecto</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 xl:p-6 scrollbar-thin">
            <div>
              <h4 className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Instrucciones</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Llena los datos institucionales y pedagógicos para contextualizar tus planeaciones.</p>
            </div>
            <div className="mt-6">
              <h4 className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Progreso</h4>
              <ul className="space-y-3 text-xs font-medium">
                <li className={`flex items-center gap-2 transition-colors ${safeData.escuela ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}><CheckCircle2 size={16} /> Escuela / CCT</li>
                <li className={`flex items-center gap-2 transition-colors ${safeData.trimestre ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}><CheckCircle2 size={16} /> Trimestre</li>
                <li className={`flex items-center gap-2 transition-colors ${safeData.contexto ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}><CheckCircle2 size={16} /> Contexto Analítico</li>
                <li className={`flex items-center gap-2 transition-colors ${safeData.proyecto ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}><CheckCircle2 size={16} /> Proyecto / Docente</li>
                <li className={`flex items-center gap-2 transition-colors ${(safeData.ejes && safeData.ejes.length > 0) ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}><CheckCircle2 size={16} /> Ejes Articuladores</li>
                <li className={`flex items-center gap-2 transition-colors ${(safeData.estrategiaEvaluacion && safeData.estrategiaEvaluacion.length > 0) ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}><CheckCircle2 size={16} /> Estrategias Eval.</li>
                <li className={`flex items-center gap-2 transition-colors ${(safeData.herramientas && safeData.herramientas.length > 0) ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}><CheckCircle2 size={16} /> Eval. Formativa</li>
              </ul>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-transparent p-4 lg:p-6 xl:p-8 scrollbar-thin">
          <div className="max-w-4xl mx-auto flex flex-col gap-6 lg:gap-8 pb-10 animate-fade-in-up">

            {displayActiveSchedule ? (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500/20 rounded-[2rem] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md relative overflow-hidden mb-2">
                <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex items-start sm:items-center gap-4 relative z-10">
                  <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-md shadow-emerald-500/20 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-900 tracking-tight">Tu horario está guardado</h3>
                    <p className="text-xs sm:text-sm text-emerald-700 mt-1 font-medium leading-relaxed max-w-xl">La plataforma calculará automáticamente tus sesiones semanales.</p>
                  </div>
                </div>
                <button type="button" onClick={onOpenSchedule} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-emerald-200 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm active:scale-95 shrink-0 relative z-10 flex items-center justify-center gap-2">
                  <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200 tracking-widest font-black">PASO 1</span> Revisar o cambiar
                </button>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-[2rem] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md relative overflow-hidden mb-2">
                <div className="flex items-start sm:items-center gap-4 relative z-10">
                  <div className="bg-slate-100 text-slate-500 p-3 rounded-xl shrink-0 border border-slate-200"><Calendar className="text-slate-600" size={24} /></div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight">Crea tu horario para la generación de actividades</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed max-w-xl">Configura tu horario para cálculo automático de tus sesiones</p>
                  </div>
                </div>
                <button type="button" onClick={onOpenSchedule} className={`w-full sm:w-auto px-5 py-2.5 text-sm font-bold rounded-xl shrink-0 border border-transparent flex items-center justify-center gap-2 ${btnGlossy}`}>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] border border-white/10 tracking-widest font-black">PASO 1</span> <Calendar size={14} /> Configurar Horario
                </button>
              </div>
            )}

            <div className="mb-4 animate-fade-in-up mt-4 inline-block">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-md shadow-violet-500/30 border border-transparent">
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] border border-white/10 tracking-widest font-black text-white">PASO 2</span>
                <h3 className="text-sm font-bold text-white tracking-wide">Captura tus datos institucionales y pedagógicos</h3>
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5 relative z-10">
                <Building2 className="text-[#135bec]" size={20} /> Datos Institucionales
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 relative z-10">
                <div className="md:col-span-2">
                  <label className={labelClass}>Nombre de la Escuela</label>
                  <div className="relative group">
                    <Building2 className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-[#135bec] transition-colors" size={18} />
                    <input name="escuela" type="text" value={safeData.escuela || ''} onChange={handleChange} placeholder="Ej. SECUNDARIA TÉCNICA NO. 84" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Estado de la República</label>
                  <select name="estado" value={safeData.estado || ''} onChange={handleChange} className={selectClass}>
                    <option value="">Seleccione su estado...</option>
                    {estadosMexico.map(est => <option key={est} value={est}>{est}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Modalidad</label>
                  <select name="modalidad" value={safeData.modalidad || ''} onChange={handleChange} className={selectClass}>
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
                  <select name="turno" value={safeData.turno || ''} onChange={handleChange} className={selectClass}>
                    <option value="">Seleccione...</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Tiempo Completo">Tiempo Completo</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Trimestre del Ciclo Escolar</label>
                  <select name="trimestre" value={safeData.trimestre || ''} onChange={handleChange} className={selectClass}>
                    <option value="">Seleccione el trimestre de trabajo...</option>
                    <option value="Primer Trimestre">Primer Trimestre</option>
                    <option value="Segundo Trimestre">Segundo Trimestre</option>
                    <option value="Tercer Trimestre">Tercer Trimestre</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5 relative z-10">
                <ImagePlus className="text-[#135bec]" size={20} /> Logos Institucionales (Exportación a Word)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                  <label className={labelClass}>Logo Izquierdo (SEP / Estado)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoIzquierdo')} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#135bec]/10 file:text-[#135bec] hover:file:bg-[#135bec]/20 transition-all cursor-pointer" />
                  {safeData.logoIzquierdo && <img src={safeData.logoIzquierdo} alt="Logo Izquierdo" className="mt-4 h-16 object-contain rounded-md border border-slate-200 shadow-sm bg-white p-1" />}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                  <label className={labelClass}>Logo Derecho (Escuela)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoDerecho')} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#135bec]/10 file:text-[#135bec] hover:file:bg-[#135bec]/20 transition-all cursor-pointer" />
                  {safeData.logoDerecho && <img src={safeData.logoDerecho} alt="Logo Derecho" className="mt-4 h-16 object-contain rounded-md border border-slate-200 shadow-sm bg-white p-1" />}
                </div>
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5 relative z-10">
                <Map className="text-[#135bec]" size={20} /> Diagnóstico y Programa Analítico
              </h2>

              <div className="relative z-10 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm transition-all focus-within:ring-4 focus-within:ring-[#135bec]/10 focus-within:border-[#135bec]">

                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 rounded-t-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm text-[#135bec]">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Contexto Socioeducativo</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Copia y pega aquí tu diagnóstico institucional</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 border border-blue-100 rounded-lg shrink-0">
                    <Sparkles size={14} className="text-[#135bec]" />
                    <span className="text-[9px] font-bold text-[#135bec] uppercase tracking-wider">Lectura IA Activada</span>
                  </div>
                </div>

                <textarea
                  ref={contextoRef}
                  name="contexto"
                  value={safeData.contexto || ''}
                  onChange={handleChange}
                  placeholder="Escribe o pega aquí las características de tu escuela, grupo y comunidad...&#10;&#10;La Inteligencia Artificial leerá este texto para adaptar las actividades de tu secuencia a tu realidad educativa."
                  className="w-full px-5 py-4 bg-transparent outline-none text-slate-700 text-sm resize-none min-h-[250px] font-medium leading-relaxed"
                />

                <div className="bg-slate-50 px-4 py-2 rounded-b-xl border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium relative h-12">
                  <span>💡 Arrastra la esquina azul para hacer más grande este cuadro ↘</span>

                  <div
                    onMouseDown={handleResizeMouseDown}
                    title="Arrastrar para ajustar tamaño"
                    className="absolute bottom-0 right-0 bg-[#135bec] text-white p-2.5 rounded-br-xl rounded-tl-xl shadow-md cursor-nwse-resize hover:bg-[#135bec]/90 transition-colors active:bg-blue-800 flex items-center justify-center"
                  >
                    <ArrowRight size={16} className="transform rotate-45 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5 relative z-10">
                <BookOpen className="text-[#135bec]" size={20} /> Datos Pedagógicos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
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
                    <input name="proyecto" type="text" value={safeData.proyecto || ''} onChange={handleChange} placeholder="Nombre del proyecto..." className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 relative z-10">
                <div>
                  <label className={labelClass}>Grado</label>
                  <div className="flex gap-2">
                    {['1', '2', '3'].map(g => (
                      <div key={g} onClick={() => onChange('grado', g)} className={`cursor-pointer flex-1 rounded-2xl py-3.5 flex items-center justify-center text-sm font-bold select-none ${safeData.grado === g ? btnSelected : btnUnselected}`}>{g}°</div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Grupo (s)</label>
                  <div className="flex gap-2">
                    {['A', 'B', 'C', 'D'].map(g => (
                      <div key={g} onClick={() => handleCheckbox('grupo', g)} className={`cursor-pointer flex-1 rounded-2xl py-3.5 flex items-center justify-center text-sm font-bold select-none ${(safeData.grupo || []).includes(g) ? btnSelected : btnUnselected}`}>{g}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5 mt-5 relative z-10">
                <div className="md:col-span-2 xl:col-span-5">
                  <label className={labelClass}>Metodología Didáctica</label>
                  <select name="estrategia" value={safeData.estrategia || ''} onChange={handleChange} className={selectClass}>
                    <option value="">Seleccione...</option>
                    <option value="Aprendizaje Basado en Problemas">Aprendizaje Basado en Problemas</option>
                    <option value="Aprendizaje basado en indagación STEAM">Indagación STEAM</option>
                    <option value="Aprendizaje Comunitario">Proyectos Comunitarios</option>
                    <option value="Aprendizaje Servicio">Aprendizaje Servicio</option>
                    <option value="Secuencia Didáctica">Secuencia Didáctica</option>
                  </select>
                </div>
                <div className="md:col-span-1 xl:col-span-4">
                  <label className={labelClass}>Periodo de Aplicación</label>
                  <div className="flex items-center gap-1 bg-slate-50/80 shadow-inner rounded-2xl border border-slate-200 p-2.5 focus-within:ring-4 focus-within:ring-[#135bec]/10 focus-within:border-[#135bec] focus-within:bg-white transition-all min-h-[50px]">
                    <Calendar className="text-slate-400 shrink-0 mx-1" size={16} />
                    <input type="date" name="fechaInicio" value={safeData.fechaInicio || ''} onChange={handleChange} className="bg-transparent text-[10px] md:text-xs font-bold text-slate-700 outline-none w-full min-w-0" />
                    <span className="text-slate-400 text-[10px] mx-0.5 shrink-0">➜</span>
                    <input type="date" name="fechaFin" value={safeData.fechaFin || ''} onChange={handleChange} className="bg-transparent text-[10px] md:text-xs font-bold text-slate-700 outline-none w-full min-w-0" />
                  </div>
                </div>
                <div className="md:col-span-1 xl:col-span-3">
                  <label className={labelClass}>Total Sesiones</label>
                  <div className="relative group">
                    <Clock className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-[#135bec] transition-colors" size={18} />
                    <input type="number" min="1" max="99" name="sesiones" value={safeData.sesiones || ''} onChange={handleChange} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5 relative z-10">
                <Target className="text-[#135bec]" size={20} /> Ejes Articuladores
              </h2>
              <div className="flex flex-wrap gap-2 md:gap-3 relative z-10">
                {ejes.map(eje => (
                  <label key={eje} className={`cursor-pointer flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border text-[10px] md:text-xs font-bold transition-all select-none ${(safeData.ejes || []).includes(eje) ? btnSelected : btnUnselected}`}>
                    <input type="checkbox" className="hidden" checked={(safeData.ejes || []).includes(eje)} onChange={() => handleCheckbox('ejes', eje)} />
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${(safeData.ejes || []).includes(eje) ? 'bg-white border-transparent shadow-sm' : 'border-slate-300 bg-white'}`}>
                      {(safeData.ejes || []).includes(eje) && <CheckCircle2 size={12} className="text-[#135bec]" />}
                    </div>
                    {eje}
                  </label>
                ))}
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5 relative z-10">
                <UserCheck className="text-[#135bec]" size={20} /> Estrategias de Evaluación
              </h2>
              <div className="flex flex-wrap gap-2 md:gap-3 relative z-10">
                {tiposEvaluacion.map(tipo => (
                  <label key={tipo} className={`cursor-pointer flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border text-[10px] md:text-xs font-bold transition-all select-none ${(safeData.estrategiaEvaluacion || []).includes(tipo) ? btnSelected : btnUnselected}`}>
                    <input type="checkbox" className="hidden" checked={(safeData.estrategiaEvaluacion || []).includes(tipo)} onChange={() => handleCheckbox('estrategiaEvaluacion', tipo)} />
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${(safeData.estrategiaEvaluacion || []).includes(tipo) ? 'bg-white border-transparent shadow-sm' : 'border-slate-300 bg-white'}`}>
                      {(safeData.estrategiaEvaluacion || []).includes(tipo) && <CheckCircle2 size={12} className="text-[#135bec]" />}
                    </div>
                    {tipo}
                  </label>
                ))}
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100 mb-5 relative z-10">
                <CheckSquare className="text-[#135bec]" size={20} /> Herramientas de Evaluación Formativa
              </h2>
              <div className="flex flex-wrap gap-2 md:gap-3 relative z-10">
                {herramientas.map(herr => (
                  <label key={herr} className={`cursor-pointer flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border text-[10px] md:text-xs font-bold transition-all select-none ${(safeData.herramientas || []).includes(herr) ? btnSelected : btnUnselected}`}>
                    <input type="checkbox" className="hidden" checked={(safeData.herramientas || []).includes(herr)} onChange={() => handleCheckbox('herramientas', herr)} />
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${(safeData.herramientas || []).includes(herr) ? 'bg-white border-transparent shadow-sm' : 'border-slate-300 bg-white'}`}>
                      {(safeData.herramientas || []).includes(herr) && <CheckCircle2 size={12} className="text-[#135bec]" />}
                    </div>
                    {herr}
                  </label>
                ))}
              </div>
            </div>

            <div className="relative mt-6 mb-4">
              {isFormValid && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] md:text-xs font-bold px-4 py-2 rounded-xl shadow-xl animate-bounce whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800 z-20">
                  ¡Datos completos! Haz clic aquí para continuar
                </div>
              )}
              <button
                onClick={onComplete}
                disabled={!isFormValid}
                className={`w-full py-4 md:py-5 rounded-2xl text-base md:text-lg font-black tracking-wide flex items-center justify-center gap-3 transition-all duration-300 border border-transparent group relative z-10
                  ${isFormValid
                    ? `${btnGlossy} ring-4 ring-[#135bec]/20`
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                <span className={`px-2 py-1 rounded-lg text-[10px] md:text-xs border tracking-widest transition-colors ${isFormValid ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-300 border-slate-300 text-slate-500'}`}>PASO 3</span>
                IR AL LIENZO DE PLANEACIÓN
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};