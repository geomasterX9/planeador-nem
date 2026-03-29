import { GoogleOAuthProvider } from '@react-oauth/google';
import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { GraduationCap, LogOut, BookMarked, Cloud, LayoutTemplate, Layers, CheckSquare, Menu, X, Calendar, FileDown, Target, PenTool, Settings, Sparkles, ChevronRight, Zap, ShieldCheck } from 'lucide-react';

import nemData from './data/nemData.json';
import { SourceCard } from './components/planner/SourceCard';
import { PlannerCanvas } from './components/planner/PlannerCanvas';
import { SetupScreen } from './components/planner/SetupScreen'; 
import { SequenceScreen } from './components/planner/SequenceScreen';
import { EvaluationScreen } from "./components/planner/EvaluationScreen";
import ScheduleScreen from './components/planner/ScheduleScreen'; // <-- 1. IMPORTACIÓN DEL HORARIO

// === CONFIGURACIÓN DE SEGURIDAD GOOGLE ===
const GOOGLE_CLIENT_ID = "77099002011-s8ek3lmkchak77m1dpk5tockb3rh3a5t.apps.googleusercontent.com";

function App() {
  // 0. ESTADO DE LA LANDING PAGE (La Cerezota en el pastel)
  const [showLanding, setShowLanding] = useState(true);

  // 1. SEGURIDAD 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const CLAVE_ACCESO = "Tecnica84";

  // 2. ESTADOS DE LA APP
  const [currentView, setCurrentView] = useState<'setup' | 'planner' | 'sequence' | 'evaluation'>('setup');
  const [showSchedule, setShowSchedule] = useState(false); // <-- 2. ESTADO DEL HORARIO

  const [projectData, setProjectData] = useState({
    maestro: '', grado: '1', grupo: [] as string[], trimestre: '', estrategia: '', estrategiaEvaluacion: [] as string[], proyecto: '', fechaInicio: '', fechaFin: '', ejes: [] as string[], herramientas: [] as string[]
  });
  
  const [plannedItems, setPlannedItems] = useState<any[]>([]);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [actividades, setActividades] = useState<Record<string, string>>({});
  const [recursos, setRecursos] = useState<Record<string, string>>({});

  const [selectedCampoIndex, setSelectedCampoIndex] = useState(0); 
  const [selectedDisciplinaIndex, setSelectedDisciplinaIndex] = useState(0); 
  
  // <-- AJUSTE 1: Inicializamos el grado con el que viene del Setup -->
  const [selectedGrado, setSelectedGrado] = useState(Number(projectData.grado) || 1); 

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // <-- AJUSTE 1.1: Sincronizamos automáticamente si el maestro cambia el grado en el Setup -->
  useEffect(() => {
    if (projectData.grado) {
      setSelectedGrado(Number(projectData.grado));
    }
  }, [projectData.grado]);

  // Cargar datos guardados
  useEffect(() => {
    try {
      localStorage.removeItem('planeador_data');
      localStorage.removeItem('planeador_items');

      const savedData = sessionStorage.getItem('planeador_data');
      const savedItems = sessionStorage.getItem('planeador_items');
      const savedRecursos = sessionStorage.getItem('planeador_recursos');

      if (savedData) setProjectData(JSON.parse(savedData));
      if (savedItems) setPlannedItems(JSON.parse(savedItems));
      if (savedRecursos) setRecursos(JSON.parse(savedRecursos));
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  }, []);

  // Guardar cambios
  useEffect(() => {
    sessionStorage.setItem('planeador_data', JSON.stringify(projectData));
    sessionStorage.setItem('planeador_items', JSON.stringify(plannedItems));
    sessionStorage.setItem('planeador_recursos', JSON.stringify(recursos));
  }, [projectData, plannedItems, recursos]);

  // <-- 3. EL CEREBRO DE ONBOARDING INTELIGENTE -->
  useEffect(() => {
    if (isAuthenticated && currentView === 'setup') {
      const isScheduleComplete = localStorage.getItem('nem_schedule_setup_complete');
      if (!isScheduleComplete) {
        setShowSchedule(true);
      }
    }
  }, [isAuthenticated, currentView]);

  const handleDataChange = (field: string, value: any) => setProjectData(prev => ({ ...prev, [field]: value }));
  
  const handleCampoChange = (index: number) => {
    setSelectedCampoIndex(index);
    setSelectedDisciplinaIndex(0); 
  };

  const handleGradoChange = (grado: number) => {
    setSelectedGrado(grado);
    setSelectedDisciplinaIndex(0);
  };

  const campos = nemData?.campos || [];
  const currentCampo = campos[selectedCampoIndex] || { nombre: '', disciplinas: [] };
  const disciplinasValidas = (currentCampo.disciplinas || []).filter(
    (d: any) => !d.grados || d.grados.includes(selectedGrado)
  );
  const currentDisciplina = disciplinasValidas[selectedDisciplinaIndex] || { nombre: 'General', contenidos: [] };
  const itemsVisibleInCanvas = plannedItems.filter(item => item.grado === selectedGrado);

  function handleDragStart(event: DragStartEvent) {
    setActiveItem(event.active.data.current);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && over.id === 'planner-canvas') {
      const textoArrastrado = active.data.current?.text;
      const yaExiste = plannedItems.some(item => item.text === textoArrastrado);
      if (!yaExiste) {
        const newItem = {
          id: `${active.id}-${Date.now()}`,
          type: active.data.current?.type,
          text: textoArrastrado,
          sourceInfo: active.data.current?.sourceInfo,
          grado: selectedGrado, 
          disciplina: currentDisciplina?.nombre || "General"
        };
        setPlannedItems([...plannedItems, newItem]);
      }
    }
    setActiveItem(null);
  }

  // --- PASO 0: LANDING PAGE PREMIUM ---
  if (showLanding) {
    return (
      <div className="h-screen bg-slate-50 font-sans selection:bg-indigo-100 flex flex-col relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header simple */}
        <header className="px-6 py-4 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#4f46e5] p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={24} />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">Planeador NEM <span className="text-[#4f46e5]">Pro</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-500">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Innovación</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Tecnología</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">NEM</span>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 relative z-10 text-center py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] md:text-xs font-bold tracking-wide mb-4 animate-fade-in-up">
            <Sparkles size={14} className="text-indigo-500" />
            <span>Versión 1.0 con Inteligencia Artificial Integrada</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-[1.1] mb-4">
            La revolución de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4f46e5] to-blue-500">planeación docente</span> ha llegado.
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mb-8 font-medium leading-relaxed">
            Diseña, estructura y evalúa proyectos para la Nueva Escuela Mexicana en minutos. Una plataforma inteligente creada por docentes, para docentes.
          </p>
          
          <button 
            onClick={() => setShowLanding(false)}
            className="group relative inline-flex items-center justify-center gap-3 px-6 py-3 bg-[#4f46e5] text-white rounded-full font-black text-base overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_-10px_rgba(79,70,229,0.5)] active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              Ingresar al Sistema <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </main>

        {/* Cards de características */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto w-full px-4 pb-6 relative z-10 shrink-0">
          <div className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
              <Layers size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Lienzo Interactivo</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Arrastra y suelta Contenidos y PDAs directamente desde los programas sintéticos oficiales.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Evaluación con IA</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Genera rúbricas, listas de cotejo y exámenes contextualizados a tu comunidad en segundos.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Exportación Segura</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Descarga en Word institucional o respalda directamente en tu Google Drive personal.</p>
          </div>
        </div>

        {/* Footer Premium Autoría */}
        <footer className="py-4 flex flex-col items-center justify-center gap-0.5 text-center text-slate-500 text-xs font-medium border-t border-slate-200/50 relative z-10 bg-white/50 backdrop-blur-sm shrink-0">
          <p className="tracking-wide">© {new Date().getFullYear()} Copyright derechos reservados</p>
          <p className="font-bold text-slate-700 text-sm">Mtro. Jorge Alfonso López Cruz</p>
        </footer>
      </div>
    );
  }

  // --- PASO 1: VERIFICAR LA LLAVE (LOGIN) ---
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0f172a] font-sans p-4 relative overflow-hidden">
        {/* Decoración de fondo del login */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center border border-slate-100 relative z-10">
          <div className="bg-gradient-to-br from-[#4f46e5] to-blue-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white shadow-xl shadow-indigo-200 rotate-3">
            <GraduationCap size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Acceso Seguro</h1>
          <p className="text-slate-500 mb-10 text-sm font-medium">Introduce tu código de acceso docente</p>
          
          <div className="space-y-5">
            <input 
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && passwordInput === CLAVE_ACCESO && setIsAuthenticated(true)}
              placeholder="••••••••"
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#4f46e5] focus:bg-white outline-none transition-all text-center text-2xl tracking-[0.5em] font-black text-slate-800"
              autoFocus
            />
            
            <button 
              onClick={() => {
                if (passwordInput === CLAVE_ACCESO) {
                  setIsAuthenticated(true);
                } else {
                  alert("Código incorrecto ❌");
                  setPasswordInput('');
                }
              }}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
            >
              Ingresar
            </button>
            <button 
              onClick={() => setShowLanding(true)}
              className="w-full text-slate-400 text-sm font-bold hover:text-slate-600 mt-4"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- PASO 2: MOSTRAR CONTENIDO SOLO SI PASÓ LA LLAVE ---
  
  // <-- 4. PANTALLA DE HORARIO (INTERCEPTOR) -->
  if (showSchedule) {
    return <ScheduleScreen onBack={() => setShowSchedule(false)} />;
  }

  // <-- 5. PANTALLA DE SETUP CON EL PUENTE CONECTADO -->
  if (currentView === 'setup') {
    return (
      <SetupScreen 
        data={projectData} 
        onChange={handleDataChange} 
        onComplete={() => setCurrentView('planner')} 
        onOpenSchedule={() => setShowSchedule(true)} 
      />
    );
  }

  if (currentView === 'sequence') {
    return (
      <SequenceScreen 
        projectData={projectData}
        plannedItems={plannedItems}
        actividades={actividades}
        setActividades={setActividades}
        recursos={recursos}         
        setRecursos={setRecursos}   
        onBack={() => setCurrentView('planner')} 
        onGoToEvaluation={() => setCurrentView('evaluation')} 
      />
    );
  }

  if (currentView === 'evaluation') {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <EvaluationScreen 
          projectData={projectData} 
          plannedItems={plannedItems} 
          actividades={actividades}
          onBack={() => setCurrentView('sequence')} 
        />
      </GoogleOAuthProvider>
    );
  }

  const countContenidos = itemsVisibleInCanvas.filter(i => i.type === 'content').length;
  const countPDAs = itemsVisibleInCanvas.filter(i => i.type === 'pda').length;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans relative">
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#4f46e5] p-2 rounded-xl text-white shadow-indigo-100 shadow-lg">
                <GraduationCap size={22} />
              </div>
              <div>
                <h1 className="text-sm font-black leading-tight tracking-tight text-slate-900">Planeador NEM <span className="text-[#4f46e5]">Pro</span></h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider"></p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('setup')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow">
              <Settings size={16} className="text-indigo-500" />
              Editar Datos Iniciales
            </button>
          </div>
        </header>

        {/* CONTROLES DE CAMPOS, GRADOS Y DISCIPLINAS */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 z-30 shrink-0">
          <div className="flex flex-col gap-3">
            
            {/* BOTONES DE CAMPOS FORMATIVOS */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <div className="bg-slate-50 p-1 rounded-xl flex items-center gap-1 min-w-max border border-slate-100">
                {campos.map((campo: any, index: number) => (
                  <button 
                    key={campo.slug || index} 
                    onClick={() => handleCampoChange(index)} 
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all 
                    ${selectedCampoIndex === index ? 'bg-white shadow-md text-[#4f46e5] border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {campo.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* BOTONES DE GRADO Y DISCIPLINAS */}
            <div className="flex flex-wrap items-center gap-4">
              
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                {[1, 2, 3].map((grado) => (
                  <button 
                    key={grado} 
                    onClick={() => handleGradoChange(grado)} 
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      selectedGrado === grado 
                      ? 'bg-white shadow-sm text-slate-800 border border-slate-200' 
                      : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {grado}° Grado
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {disciplinasValidas.map((disc: any, index: number) => (
                  <button 
                    key={disc.slug || index} 
                    onClick={() => setSelectedDisciplinaIndex(index)} 
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg whitespace-nowrap transition-all ${
                      selectedDisciplinaIndex === index 
                      ? 'bg-indigo-50 text-[#4f46e5] border border-indigo-100' 
                      : 'text-slate-500 border border-transparent hover:bg-slate-50'
                    }`}
                  >
                    {disc.nombre}
                  </button>
                ))}
              </div>

            </div>

          </div>
        </div>

        <main className="flex-1 flex overflow-hidden relative">
          <div className={`absolute lg:static inset-y-0 left-0 z-30 flex flex-row h-full bg-white transition-transform duration-300 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
            
            {/* SIDEBAR CONTENIDOS - ANCHO AJUSTADO */}
            <aside className="w-[220px] xl:w-[280px] border-r border-slate-200 bg-white flex flex-col shrink-0 transition-all">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <BookMarked size={14} /> Contenidos
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                 {currentDisciplina?.contenidos?.map((contenido: any, idx: number) => (
                    <SourceCard key={contenido.id || idx} id={`content-${contenido.id}`} type="content" text={contenido.tema} sourceInfo={`Tema ${idx + 1}`} />
                 ))}
              </div>
            </aside>

            {/* SIDEBAR PDAs - ANCHO AJUSTADO */}
            <aside className="w-[250px] xl:w-[300px] border-r border-slate-200 bg-white flex flex-col shrink-0 transition-all">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} /> PDAs
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                 {currentDisciplina?.contenidos?.map((contenido: any) => {
                    const pdaDelGrado = (contenido.pdas || []).find((p: any) => p.grado === selectedGrado);
                    if (!pdaDelGrado) return null;
                    return (
                      <SourceCard key={`${contenido.id}-pda-${selectedGrado}`} id={`pda-${contenido.id}-${selectedGrado}`} type="pda" text={pdaDelGrado.texto} sourceInfo={`PDA • ${currentDisciplina.nombre.toUpperCase()}`} />
                    );
                 })}
              </div>
            </aside>
          </div>

          <div className="flex-1 flex flex-col min-w-0 relative bg-[#f8fafc]">
            {/* PADDING DEL LIENZO REDUCIDO EN PANTALLAS PEQUEÑAS (p-4 en lugar de p-8) */}
            <div className="absolute inset-0 overflow-y-auto p-4 lg:p-8 flex flex-col items-center">
              <div className="w-full max-w-4xl flex items-center justify-between mb-8">
                 <h2 className="text-sm font-black text-slate-700 flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">
                    <LayoutTemplate size={20} className="text-[#4f46e5]" />
                    Lienzo de Planeación
                 </h2>
                 <button onClick={() => setCurrentView('sequence')} className="bg-[#4f46e5] text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-[#4338ca] transition-all flex items-center gap-2">
                    <Layers size={16}/> Crear Planeación Didáctica
                 </button>
              </div>
              
              <div className="w-full max-w-4xl">
                <PlannerCanvas 
                   items={itemsVisibleInCanvas} 
                   onRemoveItem={(id) => setPlannedItems(items => items.filter(i => i.id !== id))} 
                />
                {/* <-- AJUSTE 2: Eliminado el cuadro duplicado de arrastrar --> */}
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-[11px] font-bold text-slate-400 shrink-0">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Sistema Sincronizado
            </span>
            <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
            <span className="hidden md:inline">Contenidos: {countContenidos}</span>
            <span className="hidden md:inline">PDAs: {countPDAs}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="text-[11px] font-medium text-slate-400 border-r border-slate-200 pr-4 hidden lg:inline">
              © {new Date().getFullYear()} Copyright derechos reservados Mtro. Jorge Alfonso López Cruz
            </span>
            <span>
              Proyecto: <span className="text-[#4f46e5]">{projectData.proyecto || "Sin nombre"}</span>
            </span>
          </div>
        </footer>

        <DragOverlay>
          {activeItem ? (
            <div className="w-72 cursor-grabbing opacity-90 shadow-2xl scale-105 transform">
               <SourceCard id="temp" type={activeItem.type} text={activeItem.text} sourceInfo={activeItem.sourceInfo} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default App;