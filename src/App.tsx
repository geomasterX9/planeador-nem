import { exportToWord } from './herramientas/exportUtils';
import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { GraduationCap, LogOut, BookMarked, Cloud, LayoutTemplate, Layers, CheckSquare, Menu, X, Calendar, FileDown, Target, PenTool, Settings } from 'lucide-react';

import nemData from './data/nemData.json';
import { SourceCard } from './components/planner/SourceCard';
import { PlannerCanvas } from './components/planner/PlannerCanvas';
import { SetupScreen } from './components/planner/SetupScreen'; 
import { SequenceScreen } from './components/planner/SequenceScreen';
import { EvaluationScreen } from './components/planner/EvaluationScreen';

function App() {
  // 1. SEGURIDAD (Siempre empieza en false al refrescar)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const CLAVE_ACCESO = "Tecnica84";

  // 2. ESTADOS DE LA APP
  const [currentView, setCurrentView] = useState<'setup' | 'planner' | 'sequence' | 'evaluation'>('setup');
  const [projectData, setProjectData] = useState({
    maestro: '', grado: '1', grupo: [] as string[], trimestre: '', estrategia: '', estrategiaEvaluacion: [] as string[], proyecto: '', fechaInicio: '', fechaFin: '', ejes: [] as string[], herramientas: [] as string[]
  });
  
  const [plannedItems, setPlannedItems] = useState<any[]>([]);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [actividades, setActividades] = useState<Record<string, string>>({});
  const [recursos, setRecursos] = useState<Record<string, string>>({});

  const [selectedCampoIndex, setSelectedCampoIndex] = useState(0); 
  const [selectedDisciplinaIndex, setSelectedDisciplinaIndex] = useState(0); 
  const [selectedGrado, setSelectedGrado] = useState(1); 

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Cargar datos guardados
  useEffect(() => {
    try {
      localStorage.removeItem('planeador_data');
      localStorage.removeItem('planeador_items');

      const savedData = sessionStorage.getItem('planeador_data');
      const savedItems = sessionStorage.getItem('planeador_items');
      const savedRecursos = sessionStorage.getItem('planeador_recursos'); // NUEVO

      if (savedData) setProjectData(JSON.parse(savedData));
      if (savedItems) setPlannedItems(JSON.parse(savedItems));
      if (savedRecursos) setRecursos(JSON.parse(savedRecursos)); // NUEVO
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  }, []);

  // Guardar cambios
  // Cargar datos guardados
  useEffect(() => {
    try {
      localStorage.removeItem('planeador_data');
      localStorage.removeItem('planeador_items');

      const savedData = sessionStorage.getItem('planeador_data');
      const savedItems = sessionStorage.getItem('planeador_items');
      const savedRecursos = sessionStorage.getItem('planeador_recursos'); // NUEVO

      if (savedData) setProjectData(JSON.parse(savedData));
      if (savedItems) setPlannedItems(JSON.parse(savedItems));
      if (savedRecursos) setRecursos(JSON.parse(savedRecursos)); // NUEVO
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  }, []);

  // Guardar cambios
  useEffect(() => {
    sessionStorage.setItem('planeador_data', JSON.stringify(projectData));
    sessionStorage.setItem('planeador_items', JSON.stringify(plannedItems));
    sessionStorage.setItem('planeador_recursos', JSON.stringify(recursos)); // NUEVO
  }, [projectData, plannedItems, recursos]);

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

  // --- PASO 1: VERIFICAR LA LLAVE ---
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0f172a] font-sans p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center border border-slate-100">
          <div className="bg-[#4f46e5] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 text-white shadow-lg rotate-3">
            <GraduationCap size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Acceso Docente</h1>
          <p className="text-slate-500 mb-8 text-sm font-medium">Introduce el código de Acceso</p>
          
          <div className="space-y-4">
            <input 
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && passwordInput === CLAVE_ACCESO && setIsAuthenticated(true)}
              placeholder="••••••••"
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#4f46e5] focus:bg-white outline-none transition-all text-center text-xl tracking-[0.5em] font-bold"
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
              className="w-full bg-[#4f46e5] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4338ca] transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
            >
              Entrar al Planeador
            </button>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-50 flex flex-col gap-2">
            <p className="text-[16px] text-slate-400/80 font-medium tracking-wide leading-relaxed">
              © {new Date().getFullYear()} Copyright derechos reservados<br />
              Mtro. Jorge Alfonso López Cruz
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- PASO 2: MOSTRAR CONTENIDO SOLO SI PASÓ LA LLAVE ---
  if (currentView === 'setup') {
    return <SetupScreen data={projectData} onChange={handleDataChange} onComplete={() => setCurrentView('planner')} />;
  }

  if (currentView === 'sequence') {
    return (
      <SequenceScreen 
        projectData={projectData}
        plannedItems={plannedItems}
        actividades={actividades}
        setActividades={setActividades}
        recursos={recursos}         // NUEVO
        setRecursos={setRecursos}   // NUEVO
        onBack={() => setScreen('lienzo')}
        onGoToEvaluation={() => setScreen('evaluacion')}
/>
    );
  }

  if (currentView === 'evaluation') {
    return (
      <EvaluationScreen 
        projectData={projectData} 
        plannedItems={plannedItems} 
        actividades={actividades}
        onBack={() => setCurrentView('sequence')} 
      />
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
            <aside className="w-[280px] border-r border-slate-200 bg-white flex flex-col shrink-0">
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

            <aside className="w-[300px] border-r border-slate-200 bg-white flex flex-col shrink-0">
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
            <div className="absolute inset-0 overflow-y-auto p-8 flex flex-col items-center">
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
                {itemsVisibleInCanvas.length === 0 && (
                  <div className="w-full border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-20 text-center bg-white/50 mt-4">
                    <PenTool size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">Arrastra aquí tus elementos</h3>
                  </div>
                )}
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