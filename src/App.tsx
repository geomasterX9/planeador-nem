import { GoogleOAuthProvider } from '@react-oauth/google'; // ✨ Esta es la línea que falta
import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
  Layers, Sparkles, FolderOpen, UploadCloud, FileEdit, UserCircle,
  BookOpen, Target, LayoutTemplate, PenTool, CheckCircle2, Lock,
  X, Clock, Calendar, FileText, ArrowRight, BarChart3, Filter,
  GraduationCap, LogOut, LayoutGrid, List, Check, Zap, Shield,
  ArrowRightCircle, AlertTriangle, Info, Loader2 // <--- Agregamos Loader2 aquí
} from 'lucide-react';


import { AdminPanel } from './components/auth/AdminPanel';
// Borramos la otra línea de Zap y ArrowRight para evitar el error de duplicados


import nemData from './data/secundariaData.json';
import { SourceCard } from './components/planner/SourceCard';
import { PlannerCanvas } from './components/planner/PlannerCanvas';
import { SetupScreen } from './components/planner/SetupScreen';
import { SequenceScreen } from './components/planner/SequenceScreen';
import { EvaluationScreen } from "./components/planner/EvaluationScreen";
import ScheduleScreen from './components/planner/ScheduleScreen';

import { AuthSandbox } from './components/auth/AuthSandbox';
import { supabase } from './lib/supabaseClient';
import { Dashboard } from './components/auth/Dashboard';
import { PublicViewer } from './components/planner/PublicViewer';
import { SubscriptionModal } from './components/SubscriptionModal';

const GOOGLE_CLIENT_ID = "77099002011-s8ek3lmkchak77m1dpk5tockb3rh3a5t.apps.googleusercontent.com";

const VIP_EMAILS = [
  'geomaster9@gmail.com',
  'sectec84@gmail.com',
];

function App() {
  // 1️⃣ PRIMERO: NACEN TODAS LAS VARIABLES Y ESTADOS
  const [isSharedView, setIsSharedView] = useState(false);
  const [sharedProjectId, setSharedProjectId] = useState<string | null>(null);

  // --- ESTADOS DE SESIÓN Y VISTA ---
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [user, setUser] = useState<any>(null); // ✨ AQUÍ NACE USER
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- ESTADOS DE INTERFAZ ---
  const [isSaving, setIsSaving] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'grado1' | 'grado2' | 'grado3'>('grado1');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // --- ESTADOS DE PROYECTO ---
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('planeador_project_id');
    return saved === 'null' ? null : saved;
  });

  // 2️⃣ SEGUNDO: LOS EFECTOS (Ahora sí pueden usar la variable 'user')
  useEffect(() => {
    const search = window.location.search;
    const path = window.location.pathname;

    if (path.startsWith('/v/')) {
      const id = path.split('/v/')[1];
      if (id) {
        setSharedProjectId(id);
        setIsSharedView(true);
      }
    }
    else if (search.includes('collection_id') || search.includes('status')) {
      window.history.replaceState({}, document.title, "/");
    }
  }, [user]);

  // 3️⃣ A PARTIR DE AQUÍ CONTINÚA TU CÓDIGO ORIGINAL INTACTO
  const [currentView, setCurrentView] = useState<'dashboard' | 'setup' | 'planner' | 'sequence' | 'evaluation'>(() => {
    const saved = sessionStorage.getItem('planeador_view');
    return (saved as any) || 'dashboard';
  }); // ✨ ¡ESTE ES EL CIERRE QUE SEGURAMENTE FALTABA!

  const [displayState, setDisplayState] = useState(() => {
    const saved = sessionStorage.getItem('planeador_view');
    return { view: (saved as any) || 'dashboard', schedule: false };
  });

  const [projectData, setProjectData] = useState<any>(() => {
    try {
      const saved = sessionStorage.getItem('planeador_data');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return { maestro: '', grado: '1', grupo: [], trimestre: '', estrategia: '', estrategiaEvaluacion: [], proyecto: '', fechaInicio: '', fechaFin: '', ejes: [], herramientas: [] };
  });

  const [plannedItems, setPlannedItems] = useState<any[]>(() => {
    try {
      const saved = sessionStorage.getItem('planeador_items');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return [];
  });

  const [activeItem, setActiveItem] = useState<any>(null);

  const [actividades, setActividades] = useState<Record<string, string>>(() => {
    try {
      const saved = sessionStorage.getItem('planeador_actividades');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return {};
  });

  const [recursos, setRecursos] = useState<Record<string, string>>(() => {
    try {
      const saved = sessionStorage.getItem('planeador_recursos');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return {};
  });

  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (currentView !== displayState.view || showSchedule !== displayState.schedule) {
      setIsFading(true);
      const t = setTimeout(() => {
        setDisplayState({ view: currentView, schedule: showSchedule });
        setIsFading(false);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [currentView, showSchedule, displayState.view, displayState.schedule]);

  const [isPremium, setIsPremium] = useState(false);
  const [isCheckingPremium, setIsCheckingPremium] = useState(true);

  const [toast, setToast] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'info', title: string, message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ isOpen: true, type, title, message });
    setTimeout(() => setToast(null), 12000);
  };

  const [freeCredits, setFreeCredits] = useState<number>(0);

  const consumeCredit = (): boolean => {
    if (isPremium) return true;
    if (freeCredits > 0) {
      const nuevasChispas = freeCredits - 1;
      setFreeCredits(nuevasChispas);

      if (user?.email) {
        supabase.from('usuarios_premium')
          .update({ chispas_gratuitas: nuevasChispas })
          .eq('email', user.email)
          .then(({ error }) => {
            if (error) console.error("Error descontando chispa en BD:", error);
          });
      }
      return true;
    }
    setShowPremiumModal(true);
    return false;
  };

  const [selectedCampoIndex, setSelectedCampoIndex] = useState(0);
  const [selectedDisciplinaIndex, setSelectedDisciplinaIndex] = useState(0);
  const [selectedGrado, setSelectedGrado] = useState(Number(projectData.grado) || 1);

  const checkPremiumStatus = async (email: string) => {
    setIsCheckingPremium(true);
    try {
      if (VIP_EMAILS.includes(email)) {
        setIsPremium(true);
        setFreeCredits(999);
        return;
      }

      // ✨ INYECCIÓN 1: Agregamos "premium_until" a la consulta
      const { data, error } = await supabase
        .from('usuarios_premium')
        .select('is_premium, chispas_gratuitas, premium_until') 
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        let esPremiumReal = data.is_premium === true;

        // ✨ INYECCIÓN 2: La lógica del Reloj de Arena
        if (esPremiumReal && data.premium_until) {
          const fechaVencimiento = new Date(data.premium_until);
          const hoy = new Date();

          if (hoy > fechaVencimiento) {
            esPremiumReal = false; // ¡El año expiró! Le quitamos el acceso Premium en la app.
            
            // Le avisamos silenciosamente a la base de datos para que apague el switch permanente
            await supabase
              .from('usuarios_premium')
              .update({ is_premium: false })
              .eq('email', email);

            // ✨ INYECCIÓN 3: El aviso amigable y la puerta de renovación
            showToast(
              'info', 
              '¡Tu suscripción venció!', 
              'Tu año de Planeador NEM Pro ha concluido. ¡Renueva ahora mismo para no perder tus superpoderes!'
            );
            setShowPremiumModal(true);
          }
        }

        setIsPremium(esPremiumReal);
        setFreeCredits(Number(data.chispas_gratuitas) || 0);
      } else {
        setIsPremium(false);
        setFreeCredits(0);
      }
    } catch (error) {
      setIsPremium(false);
      setFreeCredits(0);
    } finally {
      setIsCheckingPremium(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        checkPremiumStatus(session.user.email || '');
      } else {
        setIsCheckingPremium(false);
      }
      setIsRestoringSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        checkPremiumStatus(session.user.email || '');
      } else {
        setUser(null);
        setIsPremium(false);
        setIsCheckingPremium(false);
      }
      setIsRestoringSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🛡️ BARRERA ACTIVA: Si eres gratuito y entras, te mandamos directo a "setup"
  useEffect(() => {
    if (user && !isCheckingPremium && !isPremium && currentView === 'dashboard') {
      setCurrentView('setup');
    }
  }, [user, isPremium, isCheckingPremium, currentView]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    setIsPremium(false);
    sessionStorage.removeItem('planeador_view');
    sessionStorage.removeItem('planeador_project_id');
  };

  const handlePremiumAlert = () => setShowPremiumModal(true);

  const handleSelectProject = (project: any) => {
    setCurrentProjectId(project.id);
    setProjectData(project.project_data || {});
    setPlannedItems(project.planned_items || []);
    setActividades(project.actividades || {});
    setRecursos(project.recursos || {});
    setCurrentView('setup');
  };

  const saveToCloud = async () => {
    if (!isPremium) return handlePremiumAlert();
    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        nombre_proyecto: projectData.proyecto || 'Proyecto sin nombre',
        project_data: projectData,
        planned_items: plannedItems,
        actividades: actividades,
        recursos: recursos
      };

      if (currentProjectId) {
        const { error } = await supabase.from('proyectos').update(payload).eq('id', currentProjectId);
        if (error) throw error;
        showToast('success', 'Proyecto actualizado', 'Los cambios se han guardado correctamente.');
      } else {
        const { data, error } = await supabase.from('proyectos').insert([payload]).select().single();
        if (error) throw error;
        setCurrentProjectId(data.id);
        showToast('success', 'Proyecto guardado', 'La planeación está segura en la nube.');
      }
    } catch (error: any) {
      showToast('error', 'Error al guardar', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (projectData.grado) setSelectedGrado(Number(projectData.grado));
  }, [projectData.grado]);

  useEffect(() => {
    sessionStorage.setItem('planeador_data', JSON.stringify(projectData));
    sessionStorage.setItem('planeador_items', JSON.stringify(plannedItems));
    sessionStorage.setItem('planeador_actividades', JSON.stringify(actividades));
    sessionStorage.setItem('planeador_recursos', JSON.stringify(recursos));
    sessionStorage.setItem('planeador_view', currentView);
    sessionStorage.setItem('planeador_project_id', currentProjectId || 'null');
  }, [projectData, plannedItems, actividades, recursos, currentView, currentProjectId]);

  const handleDataChange = (f: string, v: any) => setProjectData((p: any) => ({ ...p, [f]: v }));
  const handleCampoChange = (i: number) => { setSelectedCampoIndex(i); setSelectedDisciplinaIndex(0); };

  const handleGradoChange = (g: number) => {
    if (plannedItems.length > 0 && selectedGrado !== g) {
      showToast('error', 'Grado Bloqueado', 'No puedes combinar contenidos de distintos grados. Elimina los elementos del lienzo actual si deseas cambiar.');
      return;
    }
    setSelectedGrado(g);
    setSelectedDisciplinaIndex(0);
  };

  const campos = nemData?.campos || [];
  const currentCampo = campos[selectedCampoIndex] || { nombre: '', disciplinas: [] };

  const disciplinasValidas = (currentCampo.disciplinas || []).filter((d: any) => {
    return d.contenidos?.some((c: any) =>
      c.pdas?.some((p: any) => p.grado == selectedGrado)
    );
  });

  const currentDisciplina = disciplinasValidas[selectedDisciplinaIndex] || { nombre: 'General', contenidos: [] };
  const itemsVisibleInCanvas = plannedItems.filter(item => item.grado === selectedGrado);

  const countContenidos = itemsVisibleInCanvas.filter(i => i.type === 'content').length;
  const countPDAs = itemsVisibleInCanvas.filter(i => i.type === 'pda').length;

  function handleDragStart(e: DragStartEvent) { setActiveItem(e.active.data.current); }
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;

    if (over && over.id === 'planner-canvas') {
      const dragData = active.data.current || activeItem;
      if (dragData) {
        const txt = dragData.text;
        setPlannedItems((prevItems) => {
          if (prevItems.some(i => i.text === txt)) return prevItems;
          return [...prevItems, {
            id: `${active.id}-${Date.now()}`,
            type: dragData.type,
            text: txt,
            sourceInfo: dragData.sourceInfo,
            grado: selectedGrado,
            campo: currentCampo?.nombre || "General",
            disciplina: currentDisciplina?.nombre || "General"
          }];
        });
      }
    }
    setActiveItem(null);
  }

  const btnGlossy = "relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all active:scale-95 after:absolute after:top-0 after:-left-[100%] hover:after:left-[200%] after:w-[50%] after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:skew-x-[-20deg] after:transition-all after:duration-[1500ms] after:ease-out";

  if (isSharedView && sharedProjectId) {
    return <PublicViewer projectId={sharedProjectId} />;
  }

  if (isRestoringSession) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] font-sans">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#135bec] rounded-full animate-spin mb-4 shadow-sm"></div>
        <p className="text-sm font-bold text-slate-500 animate-pulse tracking-wide">Restaurando sesión segura...</p>
      </div>
    );
  }

  // 🛡️ LANDING PREMIUM UNIFICADA: Solo depende de si hay usuario o no
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white relative overflow-hidden font-sans selection:bg-blue-500/30 flex flex-col">

        {/* 🏆 Ribbon de Nivel Educativo */}
        <div className="absolute top-0 left-0 h-80 w-80 overflow-hidden pointer-events-none z-[60]">
          <div className="absolute top-20 -left-24 w-[400px] rotate-[-45deg] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 py-6 text-center shadow-[0_10px_50px_rgba(0,0,0,0.6)] border-y-2 border-white/20">
            <div className="flex flex-col items-center leading-none">
              <span className="text-[20px] font-black text-white uppercase tracking-[0.3em] drop-shadow-2xl">Solo Secundaria</span>
              <span className="text-[11px] font-bold text-blue-100 mt-2 opacity-95 italic tracking-widest">Próximamente Primaria y Preescolar</span>
            </div>
          </div>
        </div>

        {/* 🌌 Fondos Deep Blue Premium */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse pointer-events-none"></div>

        {/* 📱 Navegación Superior: Restaurada y Mejorada */}
        <header className="relative z-50 flex justify-between items-center p-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg">
              <Layers size={22} fill="white" />
            </div>
            {/* Identidad de Marca Planeador NEM PRO */}
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-0.5">Planeador</span>
              <span className="text-xl font-black tracking-tighter italic text-white uppercase">NEM PRO</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* ❌ Antes: onClick={() => setShowLanding(false)} */}
            <button 
              onClick={() => setShowAuthModal(true)} 
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors tracking-widest uppercase border-b border-transparent hover:border-blue-500 pb-1"
            >
              Iniciar Sesión
            </button>
            {/* ❌ Antes: onClick={() => setShowLanding(false)} */}
            <button 
              onClick={() => setShowAuthModal(true)} 
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-transform hover:scale-105 active:scale-95 ${btnGlossy}`}
            >
              Empezar Ahora
            </button>
          </div>
        </header>

        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-20 text-center flex flex-col items-center shrink-0">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Planea en minutos. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-indigo-400">No en horas.</span>
          </h1>
          <p className="text-base md:text-xl text-slate-400 max-w-2xl mb-12 font-medium leading-relaxed">
            El asistente pedagógico con IA especializado en <span className="text-white font-bold border-b-2 border-blue-600">Secundaria</span> y la Nueva Escuela Mexicana.
          </p>
        </main>

        {/* 💳 SECCIÓN DE TARJETAS: MARKETING & ANIMACIÓN PREMIUM */}
        {/* 💳 SECCIÓN DE TARJETAS: MARKETING & ESTRATEGIA NEM PRO */}
        <section className="relative z-20 max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-2 gap-10 w-full">

          {/* Tarjeta 1: Plan Básico */}
          <div className="group bg-slate-900/40 backdrop-blur-md border border-white/5 p-10 rounded-[2.5rem] flex flex-col hover:bg-slate-900/60 transition-all duration-500 hover:-translate-y-2">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Plan Básico</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">Ideal para empezar</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:rotate-12 transition-transform">
                <LayoutGrid size={24} className="text-slate-400" />
              </div>
            </div>

            <div className="text-5xl font-black text-white mb-8 tracking-tighter italic uppercase">GRATIS</div>

            <ul className="space-y-5 mb-10 flex-1">
              <li className="flex items-start gap-3 text-slate-400 text-sm leading-tight">
                <Check size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <span>Acceso al <strong>Lienzo Inteligente</strong> de la NEM</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400 text-sm leading-tight">
                <Check size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <span>Catálogo oficial de PDAs y Contenidos</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400 text-sm leading-tight">
                <Clock size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <span><strong>Horarios Dinámicos:</strong> Automatiza tu número de sesiones</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400 text-sm leading-tight">
                <FileText size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <span>Exportación profesional a Word</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400 text-sm leading-tight">
                <Zap size={18} className="text-amber-500 mt-0.5 shrink-0 animate-pulse" />
                <span>15 Chispas de IA de bienvenida</span>
              </li>
            </ul>

            <button onClick={() => setShowLanding(false)} className="w-full py-4 rounded-2xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 uppercase text-xs tracking-widest">
              Comenzar gratis
            </button>
          </div>

          {/* Tarjeta 2: Plan Premium */}
          <div className="relative group p-[2px] rounded-[2.8rem] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_0_60px_rgba(79,70,229,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-[2.8rem] opacity-70 group-hover:opacity-100 transition-opacity"></div>

            <div className="relative bg-[#0f172a] rounded-[2.7rem] p-10 h-full flex flex-col overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                <Sparkles size={120} className="text-white" />
              </div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight flex items-center gap-2">
                    Plan Premium <Sparkles size={20} className="text-amber-400 fill-amber-400" />
                  </h3>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Todo lo del plan básico más...</p>
                </div>
                <div className="bg-blue-600/20 px-3 py-1 rounded-full border border-blue-500/30">
                  <span className="text-[10px] font-black text-blue-300 uppercase tracking-tighter">Acceso Total</span>
                </div>
              </div>

              <div className="mb-8 relative z-10">
                <div className="flex items-baseline gap-2 leading-none">
                  <span className="text-6xl font-black text-white tracking-tighter">$500</span>
                  <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">/ Ciclo</span>
                </div>
                <p className="text-slate-400 text-xs mt-3 italic font-medium">Recupera tus fines de semana por menos de lo que cuesta un café al mes.</p>
              </div>

              <ul className="space-y-5 mb-10 flex-1 relative z-10">
                <li className="flex items-start gap-4 text-slate-100 text-sm leading-tight">
                  <div className="bg-blue-500/20 p-1 rounded-lg"><Zap size={16} className="text-blue-400" /></div>
                  <span><strong>Generación IA Ilimitada:</strong> Planeaciones completas en segundos.</span>
                </li>
                <li className="flex items-start gap-4 text-slate-100 text-sm leading-tight">
                  <div className="bg-blue-500/20 p-1 rounded-lg"><Sparkles size={16} className="text-blue-400" /></div>
                  <span><strong>IA Contextual:</strong> Genera actividades basadas en tus PDAs, Contenidos y Horarios específicos.</span>
                </li>
                <li className="flex items-start gap-4 text-slate-100 text-sm leading-tight">
                  <div className="bg-blue-500/20 p-1 rounded-lg"><FolderOpen size={16} className="text-blue-400" /></div>
                  <span><strong>Bóveda Digital:</strong> Guarda y organiza tus proyectos por trimestre en la nube.</span>
                </li>
                <li className="flex items-start gap-4 text-slate-100 text-sm leading-tight">
                  <div className="bg-blue-500/20 p-1 rounded-lg"><BookOpen size={16} className="text-blue-400" /></div>
                  <span><strong>Biblioteca SEP:</strong> Libros de Texto Gratuitos vinculados por página.</span>
                </li>
                <li className="flex items-start gap-4 text-slate-100 text-sm leading-tight">
                  <div className="bg-blue-500/20 p-1 rounded-lg"><ArrowRightCircle size={16} className="text-blue-400" /></div>
                  <span><strong>Multi-Grupos:</strong> Duplica tus planeaciones para diferentes grupos al instante.</span>
                </li>
              </ul>

              <button
                onClick={() => setShowLanding(false)}
                className={`w-full py-6 rounded-2xl font-black text-white shadow-2xl transition-all relative z-10 hover:scale-[1.02] active:scale-95 group ${btnGlossy}`}
              >
                <div className="flex flex-col items-center gap-1">
                  {/* CTA Principal */}
                  <div className="flex items-center gap-2 text-xl tracking-tight">
                    <Sparkles size={20} className="text-amber-300 group-hover:rotate-12 transition-transform" />
                    Automatizar mis planeaciones
                  </div>

                  {/* Beneficio con el '¡Ahora!' resaltado */}
                  <div className="text-[11px] font-medium text-blue-100 opacity-90 tracking-wide flex items-center gap-1.5">
                    y recuperar mi tiempo
                    <span className="bg-amber-400 text-blue-950 px-2 py-0.5 rounded-md font-black animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                      ¡AHORA!
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* ---------------- RESTAURAMOS EL FOOTER ---------------- */}
        <footer className="mt-auto py-8 text-center border-t border-white/5 opacity-50">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em]">© {new Date().getFullYear()} Planeador NEM PRO • San Luis Potosí, México</p>
        </footer>

        {/* ---------------- RESTAURAMOS EL MODAL DE LOGIN ---------------- */}
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a]/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-md">
              <button onClick={() => setShowAuthModal(false)} className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                <X size={20} /> Cerrar
              </button>
              
              {/* ✨ AQUÍ ESTÁ EL ENVOLTORIO DE GOOGLE ✨ */}
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <AuthSandbox onLoginSuccess={() => setShowAuthModal(false)} onCancel={() => setShowAuthModal(false)} />
              </GoogleOAuthProvider>
              
            </div>
          </div>
        )}
      </div>
    );
  }

  const commonProps = {
    projectData, setProjectData, plannedItems, setPlannedItems,
    actividades, setActividades, recursos, setRecursos,
    saveToCloud, isSaving, user, isPremium, onLogout: handleLogout, onPremiumClick: handlePremiumAlert,
    freeCredits, consumeCredit,
    onOpenPDFLibrary: () => setShowLibrary(true)
  };

  const renderCurrentView = () => {
    if (isCheckingPremium) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-[#135bec] rounded-full animate-spin mb-4 shadow-sm"></div>
          <p className="text-sm font-bold text-slate-500 animate-pulse tracking-wide">Preparando tu entorno...</p>
        </div>
      );
    }

    if (displayState.view === 'dashboard') {
      if (isPremium) {
        return (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <Dashboard user={user} isPremium={isPremium} onPremiumClick={handlePremiumAlert} onSelectProject={handleSelectProject} onCreateNew={() => { setCurrentProjectId(null); setProjectData({ maestro: '', grado: '1', grupo: [], trimestre: '', estrategia: '', estrategiaEvaluacion: [], proyecto: '', fechaInicio: '', fechaFin: '', ejes: [], herramientas: [] }); setPlannedItems([]); setActividades({}); setRecursos({}); setCurrentView('setup'); }} />
          </GoogleOAuthProvider>
        );
      } else {
        // 🛡️ Mientras el useEffect redirige a los gratuitos al Setup, 
        // mostramos un loader bonito para que no vean la pantalla blanca.
        return (
          <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#135bec] rounded-full animate-spin mb-4 shadow-sm"></div>
            <p className="text-sm font-bold text-slate-500 animate-pulse tracking-wide">Cargando tu lienzo...</p>
          </div>
        );
      }
    }

    if (displayState.schedule) return <ScheduleScreen onBack={() => setShowSchedule(false)} />;

    if (displayState.view === 'setup') {
      return <SetupScreen data={projectData} onChange={handleDataChange} onComplete={() => setCurrentView('planner')} onOpenSchedule={() => setShowSchedule(true)} onBackToDashboard={() => setCurrentView('dashboard')} {...commonProps} />;
    }

    if (displayState.view === 'sequence') {
      return <SequenceScreen onBack={() => setCurrentView('planner')} onGoToEvaluation={() => setCurrentView('evaluation')} onBackToDashboard={() => setCurrentView('dashboard')} {...commonProps} />;
    }

    if (displayState.view === 'evaluation') {
      return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}><EvaluationScreen onBack={() => setCurrentView('sequence')} onBackToDashboard={() => setCurrentView('dashboard')} {...commonProps} /></GoogleOAuthProvider>;
    }

    return (
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">

          <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-3 z-40 shadow-sm shrink-0 sticky top-0">

            <div className="flex items-center gap-4">
              <div className="bg-[#135bec] p-2 rounded-xl text-white shadow-md"><Layers size={22} /></div>
              <div className="flex flex-col justify-center">
                <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 leading-none mb-1">Planeador NEM <span className="text-[#135bec]/80">Pro</span></h1>
                {isPremium ? (
                  <div className="hidden sm:flex items-center gap-1.5 w-fit px-2 py-0.5 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-full shadow-sm">
                    <Sparkles size={10} className="text-amber-500" /><span className="text-[9px] font-black text-amber-700 tracking-widest uppercase">CUENTA PREMIUM ACTIVA</span>
                  </div>
                ) : (
                  <div onClick={handlePremiumAlert} className="hidden sm:flex items-center gap-1.5 w-fit px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full shadow-sm mt-1 cursor-pointer hover:bg-slate-200 transition-colors">
                    <Lock size={10} className="text-slate-500" /><span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">VERSIÓN GRATUITA</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {isPremium ? (
                <button onClick={() => setCurrentView('dashboard')} className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all">
                  <FolderOpen size={16} className="text-slate-500 group-hover:text-[#135bec] transition-colors" /><span className="hidden md:inline text-xs font-bold text-slate-700">Mis Planeaciones</span>
                </button>
              ) : (
                <button onClick={handlePremiumAlert} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer">
                  <Lock size={14} className="text-slate-400" /><span className="hidden md:inline text-xs font-bold text-slate-500">Mis Planeaciones</span>
                </button>
              )}

              {isPremium ? (
                <button onClick={saveToCloud} disabled={isSaving} className={`flex items-center gap-2 px-5 py-2 rounded-xl border border-transparent ${btnGlossy}`}>
                  <UploadCloud size={16} className={isSaving ? "animate-bounce" : ""} /><span className="hidden md:inline text-xs font-bold tracking-wide">{isSaving ? 'Guardando...' : 'Guardar en la nube'}</span>
                </button>
              ) : (
                <button onClick={handlePremiumAlert} className="flex items-center gap-2 px-5 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer">
                  <Lock size={14} className="text-slate-400" /><span className="hidden md:inline text-xs font-bold text-slate-500 tracking-wide">Guardar en la nube</span>
                </button>
              )}

              <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

              <button onClick={() => setCurrentView('setup')} className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all">
                <FileEdit size={16} className="text-slate-500 group-hover:text-[#135bec] transition-colors" /><span className="hidden md:inline text-xs font-bold text-slate-700">Configurar Datos Generales</span>
              </button>

              {user && (
                <div className="relative ml-1 md:ml-2 user-menu-container">
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-all focus:outline-none group" title="Mi Cuenta">
                    <UserCircle size={24} className="text-slate-500 group-hover:text-[#135bec] transition-colors" /><span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute top-14 right-0 w-64 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 z-50 animate-fade-in-down">
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                        <div className="bg-[#135bec]/10 p-2 rounded-xl text-[#135bec]"><UserCircle size={28} /></div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-900 truncate" title={user.email}>{user.email}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{isPremium ? 'Docente Premium' : 'Docente Básico'}</p>
                        </div>
                      </div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-rose-50 hover:border-rose-200 transition-colors group">
                        <img src="/exit.png" alt="Salir" className="w-5 h-5 drop-shadow-sm group-hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'inline'; }} />
                        <span className="text-xl drop-shadow-sm hidden">🚪</span><span className="text-xs font-bold text-slate-600 group-hover:text-rose-600">Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          <div className="bg-white border-b border-slate-200 px-6 py-2.5 z-30 shrink-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                <div className="bg-slate-50 p-1 rounded-xl flex items-center gap-1 min-w-max border border-slate-100">
                  {campos.map((campo: any, index: number) => (
                    <button key={index} onClick={() => handleCampoChange(index)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${selectedCampoIndex === index ? 'bg-white shadow-sm border border-slate-200 text-[#135bec]' : 'text-slate-400 hover:text-slate-600 border border-transparent'}`}>
                      {campo.nombre}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 shadow-inner">
                  {[1, 2, 3].map((g) => (
                    <button key={g} onClick={() => handleGradoChange(g)} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedGrado === g ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                      {g}° Grado
                    </button>
                  ))}
                </div>
                <div className="h-4 w-px bg-slate-200"></div>
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  {disciplinasValidas.map((disc: any, index: number) => (
                    <button key={index} onClick={() => setSelectedDisciplinaIndex(index)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all ${selectedDisciplinaIndex === index ? 'bg-blue-50/50 text-[#135bec] border border-blue-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                      {disc.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <main className="flex-1 flex overflow-hidden relative">
            <div className={`flex flex-row h-full bg-white lg:translate-x-0`}>
              <aside className="w-[240px] border-r border-slate-200 bg-white flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-50">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={14} className="text-[#135bec]" /> Contenidos
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {currentDisciplina?.contenidos?.map((c: any, idx: number) => (
                    <SourceCard key={idx} id={`content-${c.id}`} type="content" text={c.tema} sourceInfo={`Tema ${idx + 1}`} />
                  ))}
                </div>
              </aside>
              <aside className="w-[260px] border-r border-slate-200 bg-white flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-50">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} className="text-[#135bec]" /> PDAs
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {(() => {
                    const pdasFiltrados = currentDisciplina?.contenidos?.map((c: any) => {
                      const pda = (c.pdas || []).find((p: any) => p.grado == selectedGrado);
                      return pda ? { ...pda, contentId: c.id } : null;
                    }).filter(Boolean);

                    if (pdasFiltrados && pdasFiltrados.length > 0) {
                      return pdasFiltrados.map((pda: any) => (
                        <SourceCard
                          key={`pda-${pda.contentId}`}
                          id={`pda-${pda.contentId}`}
                          type="pda"
                          text={pda.texto}
                          sourceInfo={`PDA • ${currentDisciplina.nombre}`}
                        />
                      ));
                    } else {
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-60">
                          <Target size={32} className="text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-500">Sin PDAs disponibles</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            No hay procesos de aprendizaje para {currentDisciplina?.nombre} en {selectedGrado}° Grado.
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </aside>
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-y-auto p-8">
              <div className="w-full max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-sm font-black text-slate-800 flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-200">
                    <LayoutTemplate size={20} className="text-[#135bec]" /> Lienzo de Planeación
                  </h2>
                  
                  {/* Cápsula del Paso 6 - Llamado a la Acción */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <button onClick={() => setCurrentView('sequence')} className={`relative flex items-center gap-3 px-6 py-3.5 rounded-xl border border-transparent ${btnGlossy} ring-4 ring-[#135bec]/10 hover:scale-[1.02] transition-all`}>
                      <span className="bg-white/20 px-2 py-1 rounded-lg border border-white/30 text-[10px] font-black tracking-widest text-white shadow-sm">PASO 6</span>
                      <PenTool size={16} className="text-white" /> 
                      <span className="text-sm font-bold tracking-wide">Crear Planeación Didáctica</span>
                    </button>
                  </div>
                </div>
                <PlannerCanvas items={itemsVisibleInCanvas} onRemoveItem={(id) => setPlannedItems(items => items.filter(i => i.id !== id))} />
              </div>
            </div>
          </main>

          <footer className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-[10px] font-bold text-slate-400 shrink-0">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> SaaS Activo</span>
              <span>Contenidos: {countContenidos}</span><span>PDAs: {countPDAs}</span>
            </div>
            <p>© {new Date().getFullYear()} Mtro. Jorge Alfonso López Cruz</p>
          </footer>

          <DragOverlay>
            {activeItem ? <div className="w-72 shadow-2xl scale-105 transform cursor-grabbing"><SourceCard id="temp" type={activeItem.type} text={activeItem.text} sourceInfo={activeItem.sourceInfo} /></div> : null}
          </DragOverlay>
        </div>
      </DndContext>
    );
  };

  const getLibraryFolderId = () => {
    switch (libraryTab) {
      case 'grado1': return '1rhYtsGKM2Oy9WzRCWHSnT7bagIXthXv1';
      case 'grado2': return '1RJ2o7nfyPY-jqW5XS_98WrAUXSX5m8kB';
      case 'grado3': return '1lXHRH7RS3Hq9O0AawGeJ9muoaDqR43E3';
      default: return '1lBilXv2PoGPoxgMvMRfALsomLOSv8ogk';
    }
  };

  return (
    <>
      <div className={`h-full w-full transform transition-all duration-300 ease-in-out ${isFading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>
        {renderCurrentView()}
      </div>

      {showLibrary && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 md:px-8 py-8">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={() => setShowLibrary(false)}></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full h-full max-w-6xl flex flex-col border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100"><BookOpen size={20} /></div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Biblioteca Digital SEP</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Libros de Texto Gratuitos (Fase 6)</p>
                </div>
              </div>
              <button onClick={() => setShowLibrary(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="Cerrar Biblioteca"><X size={20} /></button>
            </div>
            <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-50 border-b border-slate-200 z-10 shrink-0">
              <button onClick={() => setLibraryTab('grado1')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${libraryTab === 'grado1' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Primer Grado</button>
              <button onClick={() => setLibraryTab('grado2')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${libraryTab === 'grado2' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Segundo Grado</button>
              <button onClick={() => setLibraryTab('grado3')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${libraryTab === 'grado3' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Tercer Grado</button>
            </div>
            <div className="flex-1 bg-slate-50 relative w-full h-full flex flex-col">
              <iframe src={`https://drive.google.com/embeddedfolderview?id=${getLibraryFolderId()}#grid`} className="w-full h-full border-0 relative z-10" allow="autoplay"></iframe>
            </div>
          </div>
        </div>
      )}

      <SubscriptionModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        userEmail={user?.email || ''}
        userId={user?.id || ''}
      />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] max-w-sm w-full p-4 rounded-2xl shadow-2xl border flex gap-4 animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
          <div className="shrink-0 mt-0.5">{toast.type === 'success' && <CheckCircle2 size={20} className="text-emerald-500" />}{toast.type === 'error' && <AlertTriangle size={20} className="text-rose-500" />}{toast.type === 'info' && <Info size={20} className="text-blue-500" />}</div>
          <div className="flex-1"><h4 className="text-sm font-bold mb-1">{toast.title}</h4><p className="text-xs font-medium opacity-90 leading-relaxed">{toast.message}</p></div>
          <button onClick={() => setToast(null)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"><X size={16} /></button>
        </div>
      )}
    </>
  );
}

export default App;