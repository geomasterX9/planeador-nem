import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Layers, FileText, X, Check, Clipboard, GraduationCap, Plus, LogOut, Settings, ChevronRight, Sparkles, PenTool, Info, UploadCloud, FolderOpen, UserCircle, Lock, Search, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import librosData from '../../data/librosData.json';

const fasesMetodologias: Record<string, { id: string, titulo: string, desc: string, guia: string }[]> = {
  "Aprendizaje basado en proyectos comunitarios": [
    { id: 'f1', titulo: 'Identificación', desc: 'Momento 1. Proponer planteamientos genuinos.', guia: '• LECTURA DE LA REALIDAD:\nProponer planteamientos para identificar la problemática general vinculada a: "{{PDA}}".' },
    { id: 'f2', titulo: 'Recuperación', desc: 'Momento 2. Vinculación de conocimientos previos.', guia: '• DIÁLOGO:\nVincular conocimientos previos sobre el contenido a desarrollar.' },
    { id: 'f3', titulo: 'Planificación', desc: 'Momento 3. Negociación de los pasos a seguir.', guia: '• ACUERDOS:\nNegociar las acciones del proyecto (producciones, tiempos, tipos de acción).' },
    { id: 'f4', titulo: 'Acercamiento', desc: 'Momento 4. Exploración del problema a resolver.', guia: '• EXPLORACIÓN:\nFormular una primera aproximación a las diversas facetas del problema a resolver.' },
    { id: 'f5', titulo: 'Comprensión y producción', desc: 'Momento 5. Analizar aspectos y experimentar.', guia: '• ACCIONES EN MARCHA:\nRealizar las producciones necesarias, haciendo las experimentaciones y revisiones pertinentes.' },
    { id: 'f6', titulo: 'Reconocimiento', desc: 'Momento 6. Identificar avances y dificultades.', guia: '• PAUSA REFLEXIVA:\nIdentificar los avances y las dificultades en el proceso. Realizar ajustes.' },
    { id: 'f7', titulo: 'Concreción', desc: 'Momento 7. Primera versión del producto.', guia: '• PROTOTIPO:\nDesarrollar una primera versión del producto planteado.' },
    { id: 'f8', titulo: 'Integración', desc: 'Momento 8. Intercambio y retroalimentación.', guia: '• RETROALIMENTACIÓN:\nIntercambiar producciones, explicar lo que hicieron y recibir opiniones.' },
    { id: 'f9', titulo: 'Difusión', desc: 'Momento 9. Presentación del producto al aula.', guia: '• PRESENTACIÓN:\nMostrar el producto final al aula para dar cuenta de cómo se resolvió la problemática.' },
    { id: 'f10', titulo: 'Consideraciones', desc: 'Momento 10. Seguimiento y evaluación del impacto.', guia: '• SEGUIMIENTO:\nDar seguimiento y recibir opiniones sobre el impacto del producto en los escenarios.' },
    { id: 'f11', titulo: 'Avances', desc: 'Momento 11. Toma de decisiones y mejora.', guia: '• TOMA DE DECISIONES:\nAnalizar la retroalimentación recibida para mejorar en proyectos futuros.' }
  ],
  "Aprendizaje basado en indagación (STEAM como enfoque)": [
    { id: 'f1', titulo: 'Introducción al tema', desc: 'Fase 1. Uso de conocimientos previos e identificación de la problemática.', guia: '• SABERES PREVIOS:\nIntroducir el tema y usar conocimientos previos para generar disonancia. Identificar la problemática de: "{{PDA}}".' },
    { id: 'f2', titulo: 'Diseño de investigación', desc: 'Fase 2. Desarrollo de la indagación.', guia: '• PLANIFICACIÓN Y DISEÑO:\nAcordar: ¿Qué se va a hacer?, ¿quién?, ¿cómo?, ¿cuándo?, ¿donde? y ¿con qué?' },
    { id: 'f3', titulo: 'Organizar y estructurar', desc: 'Fase 3. Respuestas a las preguntas específicas de indagación.', guia: '• ANÁLISIS DE DATOS:\nOrganizar e interpretar datos, sintetizar ideas y clarificar conceptos.' },
    { id: 'f4', titulo: 'Presentación de resultados', desc: 'Fase 4. Presentación y aplicación.', guia: '• SOCIALIZACIÓN:\nPresentar los resultados de indagación y elaborar propuestas de acción para resolver el problema.' },
    { id: 'f5', titulo: 'Metacognición', desc: 'Fase 5. Reflexión sobre lo realizado.', guia: '• REFLEXIÓN:\nReflexionar sobre todo lo realizado: planes, actuaciones, logros y dificultades.' }
  ],
  "Aprendizaje Basado en Problemas (ABP)": [
    { id: 'f1', titulo: 'Presentemos', desc: '1. Plantea la reflexión inicial.', guia: '• REFLEXIÓN INICIAL:\nIntroducir el escenario mediante una imagen o lectura breve vinculada a: "{{PDA}}".' },
    { id: 'f2', titulo: 'Recolectemos', desc: '2. Exploran y recuperan saberes.', guia: '• EXPLORACIÓN:\nExplorar y recuperar de manera general los saberes previos respecto a la temática.' },
    { id: 'f3', titulo: 'Formulemos el problema', desc: '3. Determina con claridad el problema.', guia: '• DEFINICIÓN:\nDeterminar con claridad el problema sobre el cual se trabajará y las inquietudes de los alumnos.' },
    { id: 'f4', titulo: 'Organicemos la experiencia', desc: '4. Ruta de trabajo y proceso de indagación.', guia: '• RUTA DE TRABAJO:\nPlantear la ruta de indagación (objetivos, acuerdos, medios, recursos y tiempo).' },
    { id: 'f5', titulo: 'Vivamos la experiencia', desc: '5. Indagación documental o vivencial.', guia: '• INDAGACIÓN:\nGuiar la indagación documental o vivencial para aportar elementos que lleven a comprender e intervenir el problema.' },
    { id: 'f6', titulo: 'Resultados y análisis', desc: '6. Divulgación y evaluación de aprendizajes.', guia: '• CIERRE:\nRetomar el problema inicial, presentar los aprendizajes obtenidos y divulgar los resultados.' }
  ],
  "Aprendizaje Servicio (AS)": [
    { id: 'f1', titulo: 'Punto de partida', desc: 'Etapa 1. Interés o necesidad de la comunidad.', guia: '• SENSIBILIZACIÓN:\nPartir del interés de los alumnos o necesidad de la comunidad vinculada a: "{{PDA}}".' },
    { id: 'f2', titulo: 'Lo que sé y lo que quiero saber', desc: 'Etapa 2. Actividades de análisis y debates.', guia: '• DIAGNÓSTICO:\nRecabar información, identificar recursos y establecer vínculos con la familia/comunidad.' },
    { id: 'f3', titulo: 'Organicemos las activities', desc: 'Etapa 3. Herramientas básicas de planificación.', guia: '• PLANIFICACIÓN:\nArticular la intención pedagógica con el servicio (¿Qué? ¿Por qué? ¿Para qué? ¿A quiénes?).' },
    { id: 'f4', titulo: 'Creatividad en marcha', desc: 'Etapa 4. Puesta en práctica de lo planificado.', guia: '• PUESTA EN PRÁCTICA:\nMonitorear las actividades planificadas, los espacios y tiempos. Desarrollar el servicio.' },
    { id: 'f5', titulo: 'Compartimos y evaluamos lo aprendido', desc: 'Etapa 5. Evaluación de resultados y servicio.', guia: '• EVALUACIÓN FINAL:\nEvaluar el cumplimiento de los objetivos y reflexionar sobre el logro del proyecto.' }
  ],
  "Secuencia didáctica": [
    { id: 'f1', titulo: 'Inicio', desc: 'Activación de conocimientos previos y motivación.', guia: '• ACTIVACIÓN:\nRecuperar saberes previos y presentar el propósito (PDA: "{{PDA}}").\n\n• MOTIVACIÓN:\nGenerar interés mediante una pregunta detonadora o situación breve.' },
    { id: 'f2', titulo: 'Desarrollo', desc: 'Construcción del aprendizaje y práctica.', guia: '• CONSTRUCCIÓN DEL APRENDIZAJE:\nImplementar actividades prácticas o investigación.\n\n• ROL DEL DOCENTE:\nAcompañar, mediar y orientar el proceso.' },
    { id: 'f3', titulo: 'Cierre', desc: 'Síntesis, evaluación y retroalimentación.', guia: '• SÍNTESIS:\nRecapitular lo aprendido y socializar resultados.\n\n• EVALUACIÓN FORMATIVA:\nReflexionar sobre las dificultades y logros obtenidos.' }
  ]
};

interface SequenceScreenProps {
  projectData: any;
  plannedItems: any[];
  actividades: Record<string, string>;
  setActividades: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  recursos: Record<string, string>;
  setRecursos: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onBack: () => void;
  onGoToEvaluation: () => void;
  onBackToDashboard?: () => void;
  saveToCloud?: () => void;
  isSaving?: boolean;
  user?: any;
  isPremium?: boolean;
  onLogout?: () => void;
  onPremiumClick?: () => void;
  freeCredits?: number;
  consumeCredit?: () => Promise<boolean> | boolean;
  onOpenPDFLibrary?: () => void; 
}

export const SequenceScreen = ({ projectData, plannedItems, actividades, setActividades, recursos, setRecursos, onBack, onGoToEvaluation, onBackToDashboard, saveToCloud, isSaving, user, isPremium, onLogout, onPremiumClick, freeCredits, consumeCredit, onOpenPDFLibrary }: SequenceScreenProps) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLibraryMenuMain, setShowLibraryMenuMain] = useState(false); 
  
  const [toast, setToast] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'info', title: string, message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ isOpen: true, type, title, message });
    setTimeout(() => setToast(null), 12000); 
  };

  const [filtroGrado, setFiltroGrado] = useState(Number(projectData.grado) || 1);
  const [filtroCampo, setFiltroCampo] = useState('Lenguajes');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [proyectoCopiado, setProyectoCopiado] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (showLibraryMenuMain && !target.closest('.library-menu-main')) {
        setShowLibraryMenuMain(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showLibraryMenuMain]);

  const determinarCampo = (disciplina: string) => {
    const d = disciplina || "";
    if (["Español", "Inglés", "Artes"].includes(d)) return "Lenguajes";
    if (["Matemáticas", "Biología", "Física", "Química"].includes(d)) return "Saberes y Pensamiento Científico";
    if (["Geografía", "Historia", "Formación Cívica y Ética"].includes(d)) return "Ética, Naturaleza y Sociedades";
    if (["Educación Física", "Tecnología", "Tutoría / Ed. Socioemocional"].includes(d)) return "De lo Humano y lo Comunitario";
    return "Lenguajes"; 
  };

  const campoActual = plannedItems.length > 0 ? determinarCampo(plannedItems[0].disciplina) : "Lenguajes";

  const obtenerFases = (estrategia: string) => {
    const est = (estrategia || "").toLowerCase();
    if (est.includes("comunitario")) return fasesMetodologias["Aprendizaje basado en proyectos comunitarios"];
    if (est.includes("steam") || est.includes("indagación") || est.includes("indagacion")) return fasesMetodologias["Aprendizaje basado en indagación (STEAM como enfoque)"];
    if (est.includes("problemas") || est.includes("abp")) return fasesMetodologias["Aprendizaje Basado en Problemas (ABP)"];
    if (est.includes("servicio") || est.includes("as")) return fasesMetodologias["Aprendizaje Servicio (AS)"];
    return fasesMetodologias["Secuencia didáctica"];
  };

  const fases = obtenerFases(projectData.estrategia);

  useEffect(() => {
    if (Object.keys(actividades).length > 0) return;
    const pdaDestacado = plannedItems.find(item => item.type === 'pda')?.text || "el tema central definido en el proyecto";
    const sugerencias: Record<string, string> = {};
    fases.forEach((fase) => {
      sugerencias[fase.id] = (fase.guia || "").replace('{{PDA}}', pdaDestacado);
    });
    setActividades(sugerencias);
  }, [plannedItems, fases, actividades, setActividades]); 

  const generateAIActivity = async (faseId: string, faseTitulo: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
    if (!apiKey) {
      showToast('error', 'Sin Llave API', 'Falta configurar la Llave de Gemini en local o Vercel. Revisa el tutorial.');
      return;
    }
    setIsGenerating(faseId); 
    try {
        const gradoActual = Number(projectData.grado) || 1;
        const itemsDelGrado = plannedItems.filter(item => Number(item.grado) === gradoActual || !item.grado);
        
        const disciplinaDestacada = itemsDelGrado.length > 0 ? itemsDelGrado[itemsDelGrado.length - 1].disciplina : "la disciplina correspondiente";
        const campoActualTexto = itemsDelGrado.length > 0 ? itemsDelGrado[itemsDelGrado.length - 1].campo : campoActual;

        const itemsSaneados = itemsDelGrado.filter(item => item.disciplina === disciplinaDestacada);

        const pdasList = itemsSaneados.filter(item => item.type === 'pda').map(i => i.text);
        const pdaDestacado = pdasList.length > 0 ? pdasList.join(" | ") : "tema general";
        
        const contenidosList = itemsSaneados.filter(item => item.type === 'content').map(i => i.text);
        const contenidoDestacado = contenidosList.length > 0 ? contenidosList.join(" | ") : "contenido base";

        const faseActualObjeto = fases.find(f => f.id === faseId);
        const guiaFase = faseActualObjeto ? (faseActualObjeto.guia || "").replace('{{PDA}}', pdaDestacado) : "";
        const descFase = faseActualObjeto ? faseActualObjeto.desc : "";
        const contextoEscuela = projectData.contexto ? `\n\n🏫 CONTEXTO SOCIOEDUCATIVO DE LA ESCUELA:\n"${projectData.contexto}"\n-> OBLIGATORIO: Adapta las actividades al contexto de forma explícita.` : "";

        const totalSesiones = Number(projectData.sesiones) || 1;
        const totalMinutos = totalSesiones * 50; 
        const numFases = fases.length || 1;
        const minutosPorFase = Math.round(totalMinutos / numFases);
        const limiteActividades = minutosPorFase <= 60 ? "MÁXIMO 1 o 2 actividades" : minutosPorFase <= 120 ? "MÁXIMO 2 o 3 actividades" : "MÁXIMO 3 o 4 actividades";

        const prompt = `Eres un experto pedagogo y diseñador curricular de la Nueva Escuela Mexicana (NEM). 
        🚨 REGLA DE ORO INQUEBRANTABLE: La FASE METODOLÓGICA dicta las acciones. El Contenido/PDA es solo el pretexto o tema de fondo. 
        📌 CONTEXTO METODOLÓGICO ESTRICTO:
        - Metodología: ${projectData.estrategia || "Libre"}
        - Fase o Momento actual: ${faseTitulo}
        - Objetivo oficial de esta fase: ${descFase}
        - Instrucción pedagógica obligatoria para esta fase: ${guiaFase}
        ⏱️ GESTIÓN DEL TIEMPO (REGLA MATEMÁTICA ESTRICTA):
        - Tienes EXACTAMENTE ${minutosPorFase} MINUTOS en total. Debes generar ${limiteActividades}. LA SUMA MATEMÁTICA de los minutos TIENE QUE DAR EXACTAMENTE ${minutosPorFase}.
        📚 TEMA DE FONDO:
        - Campo Formativo: ${campoActualTexto}
        - Disciplina: ${disciplinaDestacada}
        - Contenidos: ${contenidoDestacado}
        - PDAs: ${pdaDestacado}${contextoEscuela}

        Reglas de formato inquebrantables:
        1. ESTRICTAMENTE PROHIBIDO inventar temas de otras materias. Tu redacción debe ser 100% enfocada a la disciplina de ${disciplinaDestacada}. NO mezcles conceptos de otras áreas.
        2. ESTRICTAMENTE PROHIBIDO incluir saludos, introducciones o conclusiones.
        3. NO uses asteriscos dobles (**) para negritas ni formato markdown.
        4. TÍTULOS VISIBLES Y SEPARADOS: Usa EXACTAMENTE este formato:
        🔸 NOMBRE DE LA ACTIVIDAD - XX MINUTOS 🔸
        --------------------------------------------------
        5. Deja un renglón en blanco después de la línea punteada y describe paso a paso qué hará el alumno y el docente. 
        6. Al final agrega un salto de línea y la palabra EXACTA "RECURSOS:" seguida de una lista de 4 o 5 materiales concretos.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      if (data.error) throw new Error(`API de Google: ${data.error.message}`);
      
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("La IA no devolvió respuesta.");
      
      const parts = rawText.split('RECURSOS:');
      const actividadesText = parts[0].replace(/\*\*/g, '').trim();
      const recursosText = parts.length > 1 ? parts[1].replace(/\*\*/g, '').trim() : "LTG, libreta, material impreso";
      
      setActividades(prev => ({ ...prev, [faseId]: actividadesText }));
      setRecursos(prev => ({ ...prev, [faseId]: recursosText }));

    } catch (error: any) {
      // CORRECCIÓN: Ahora imprimimos el error real en la consola para saber exactamente por qué falló
      console.error("Fallo detallado de IA al generar:", error);
      console.warn("Fallo en IA. Desplegando fallback.");
      showToast('info', 'Aviso de conexión', 'Hubo una interrupción en la señal, pero te preparamos una actividad base para que no te detengas. Puedes editarla o volver a generar.');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      const fallbackActivity = `🔸 ACTIVIDAD GUIADA - 15 MINUTOS 🔸\n--------------------------------------------------\nEl docente guiará a los alumnos para cumplir con el propósito de esta fase. Diálogo inicial.\n\n🔸 TRABAJO PRÁCTICO - 35 MINUTOS 🔸\n--------------------------------------------------\nLos alumnos desarrollarán los productos trabajando en equipos.`;
      setActividades(prev => ({ ...prev, [faseId]: fallbackActivity }));
      setRecursos(prev => ({ ...prev, [faseId]: "Libro de Texto, libreta, material de papelería." }));
    } finally {
      setIsGenerating(null); 
    }
  };

  const handleCopy = (proyecto: any) => {
    const texto = `Trabajar el proyecto: "${proyecto.nombre}" (Libro de Proyectos SEP, Páginas: ${proyecto.paginas}).`;
    setProyectoCopiado(texto);
    setCopiedId(proyecto.nombre);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handlePasteToFase = (faseId: string) => {
    if (proyectoCopiado) {
      const textoEnriquecido = `🔸 VINCULACIÓN CON LTG 🔸\n--------------------------------------------------\n${proyectoCopiado}\n\n1. Lectura comunitaria: Todos realizan la lectura guiada.\n2. Diálogo reflexivo: Plenaria para compartir puntos de vista.`;
      setActividades(prev => ({
        ...prev,
        [faseId]: prev[faseId] ? prev[faseId] + '\n\n' + textoEnriquecido : textoEnriquecido
      }));
      setProyectoCopiado(null);
    }
  };

  const camposDisponibles = ["Lenguajes", "Saberes y Pensamiento Científico", "Ética, Naturaleza y Sociedades", "De lo Humano y lo Comunitario"];
  const libroSeleccionado = librosData.libros?.find(l => l.grado === filtroGrado);
  const proyectosFiltrados = libroSeleccionado?.proyectos?.filter(p => p.campo === filtroCampo) || [];

  const btnGlossy = "relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all active:scale-95 after:absolute after:top-0 after:-left-[100%] hover:after:left-[200%] after:w-[50%] after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:skew-x-[-20deg] after:transition-all after:duration-[1500ms] after:ease-out";
  const btnGlossyAmber = btnGlossy.replace('from-violet-600 to-indigo-600', 'from-amber-400 to-orange-500').replace('shadow-violet-500/30', 'shadow-amber-500/30').replace('hover:shadow-violet-500/50', 'hover:shadow-amber-500/50');

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden selection:bg-[#135bec]/20 relative">
      <div className="absolute top-0 left-1/4 w-1/2 h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="h-14 md:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-3 text-[#135bec]">
            <div className="bg-[#135bec] p-1.5 rounded-lg text-white shadow-md"><Layers size={18} /></div>
            <div className="flex flex-col justify-center">
              <h2 className="text-base md:text-lg font-bold tracking-tight text-slate-900 leading-none">Planeador <span className="hidden sm:inline">NEM</span> <span className="text-[#135bec]/80">Pro</span></h2>
              {isPremium ? (
                <div className="hidden sm:flex items-center gap-1.5 w-fit px-2 py-0.5 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-full shadow-sm mt-1">
                   <Sparkles size={10} className="text-amber-500" />
                   <span className="text-[9px] font-black text-amber-700 tracking-widest uppercase">Cuenta Premium Activa</span>
                </div>
              ) : (
                <div onClick={onPremiumClick} className="hidden sm:flex items-center gap-1.5 w-fit px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full shadow-sm mt-1 cursor-pointer hover:bg-slate-200 transition-colors">
                   <Lock size={10} className="text-slate-500" />
                   <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">VERSIÓN GRATUITA</span>
                 </div>
              )}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
            <FileText size={16} />
            <span className="hidden sm:inline">Planeación Didáctica</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
            
            <button onClick={onBack} className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all">
              <ArrowLeft size={16} className="text-slate-500 group-hover:text-[#135bec] transition-colors" />
              <span className="hidden md:inline text-xs font-bold text-slate-700">Volver al Lienzo</span>
            </button>
            
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

            <button 
              onClick={onGoToEvaluation}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl border border-transparent ${btnGlossy}`}
            >
              <PenTool size={16} />
              <span className="hidden sm:inline text-xs font-bold tracking-wide">Siguiente: Evaluación</span>
            </button>

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
                         {!isPremium && <p className="text-[10px] font-bold text-amber-500 mt-1">⚡ {freeCredits} chispas restantes</p>}
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
        <aside className="w-48 lg:w-56 xl:w-64 bg-[#0f172a] text-slate-300 flex flex-col shrink-0 z-20 shadow-2xl">
          <div className="p-3 xl:p-6 border-b border-slate-800 bg-slate-900/50">
            <button onClick={onBack} className="flex items-center gap-2 text-[10px] xl:text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-[#135bec] transition-colors mb-4 xl:mb-6 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
              <span className="hidden lg:inline">Volver al Lienzo</span>
            </button>
            <div className="space-y-3 xl:space-y-4">
              <div>
                <span className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1"><Sparkles size={12} className="text-[#135bec]"/> Proyecto Activo</span>
                <h3 className="text-white font-bold text-sm xl:text-lg leading-snug truncate">{projectData.proyecto || "Proyecto sin nombre"}</h3>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2 text-[10px] xl:text-sm">
                  <Layers size={14} className="text-[#135bec] shrink-0" />
                  <span className="text-slate-400 font-medium truncate">{projectData.estrategia || "Metodología Libre"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 xl:p-6 scrollbar-thin">
            <div className="mb-8">
              <h4 className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 xl:mb-4">Elementos Seleccionados</h4>
              <div className="space-y-2 xl:space-y-3">
                {(() => {
                  const gradoActual = Number(projectData.grado) || 1;
                  const itemsDelGrado = plannedItems.filter(item => Number(item.grado) === gradoActual || !item.grado);
                  const disciplinaDestacada = itemsDelGrado.length > 0 ? itemsDelGrado[itemsDelGrado.length - 1].disciplina : null;
                  const itemsSaneados = disciplinaDestacada ? itemsDelGrado.filter(item => item.disciplina === disciplinaDestacada) : itemsDelGrado;

                  if (itemsSaneados.length === 0) {
                    return <p className="text-[10px] text-slate-500 italic">No hay contenidos seleccionados.</p>;
                  }

                  return itemsSaneados.map((item) => (
                    <div key={item.id} className="p-2 xl:p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                      <p className="text-[9px] xl:text-xs text-slate-300 leading-relaxed font-medium line-clamp-3">
                        <span className={`font-bold mr-1 ${item.type === 'content' ? 'text-blue-400' : 'text-emerald-400'}`}>[{item.type === 'content' ? 'C' : 'PDA'}]</span>
                        {item.text}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-transparent p-3 md:p-6 lg:p-8 scrollbar-thin relative scroll-smooth">
          <div className="w-full xl:max-w-[1450px] mr-auto flex flex-col">
            
            <div className="bg-white/90 backdrop-blur-md shadow-xl shadow-slate-200/40 border border-white/60 rounded-[2rem] min-h-[calc(100vh-10rem)] h-auto p-4 md:p-8 xl:p-16 mb-10 w-full relative z-10">
              
              <div className="mb-6 xl:mb-12 border-b border-slate-100 pb-4 xl:pb-8">
                <div className="flex items-center justify-between mb-3 xl:mb-6">
                  <div className="flex items-center gap-3 xl:gap-4">
                    <div className="p-2 xl:p-3 bg-[#135bec]/10 rounded-xl text-[#135bec] shrink-0 shadow-inner">
                      <FileText size={24} className="xl:w-7 xl:h-7" />
                    </div>
                    <div>
                      <h1 className="text-lg lg:text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight uppercase">Planeación Didáctica</h1>
                      <p className="text-[10px] xl:text-sm text-slate-500 mt-1 font-medium hidden sm:block">Sugerencias vinculadas a los LTG Plan 2022.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 xl:gap-3 z-30">
                    <button 
                      onClick={() => {
                        if (window.confirm("¿Estás seguro de que deseas borrar TODAS las actividades y recursos redactados? Esta acción no se puede deshacer.")) {
                          setActividades({});
                          setRecursos({});
                          showToast('info', 'Secuencia limpia', 'Se han borrado todas las actividades para empezar de nuevo.');
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2.5 text-xs md:text-sm font-bold text-slate-500 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all shadow-sm group"
                      title="Borrar todas las actividades"
                    >
                      <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                      <span className="hidden lg:inline">Limpiar Todo</span>
                    </button>

                    {!showLibrary && (
                      <div className="relative library-menu-main">
                        <button 
                          onClick={() => setShowLibraryMenuMain(!showLibraryMenuMain)} 
                          className="flex items-center gap-2 px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm font-bold text-[#135bec] bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 rounded-xl transition-all shadow-sm group"
                        >
                          <BookOpen size={18} className="group-hover:scale-110 transition-transform" />
                          <span className="hidden lg:inline">Biblioteca SEP</span>
                          <ChevronRight size={16} className={`transition-transform duration-300 ml-1 ${showLibraryMenuMain ? 'rotate-90' : ''}`} />
                        </button>

                        {showLibraryMenuMain && (
                          <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <button 
                              onClick={() => { setShowLibrary(true); setShowLibraryMenuMain(false); }} 
                              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/50 transition-colors text-left group"
                            >
                              <div className="bg-blue-50 text-[#135bec] p-2 rounded-lg shrink-0 group-hover:bg-[#135bec] group-hover:text-white transition-colors">
                                <Search size={18} />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">Buscador de Proyectos</h4>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">Encuentra páginas exactas para vincular.</p>
                              </div>
                            </button>
                            <div className="h-px bg-slate-100 my-1 mx-2"></div>
                            <button 
                              onClick={() => { onOpenPDFLibrary?.(); setShowLibraryMenuMain(false); }} 
                              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-50/50 transition-colors text-left group"
                            >
                              <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <FileText size={18} />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">Visor de Libros PDF <Sparkles size={10} className="text-emerald-500"/></h4>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">Lee los LTG completos sin salir de la app.</p>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 xl:p-4 rounded-2xl mb-6 flex items-start gap-3 shadow-sm">
                  <div className="bg-white text-[#135bec] p-1.5 rounded-lg shrink-0 mt-0.5 shadow-sm border border-blue-100">
                    <Info size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-[#135bec] mb-0.5 uppercase tracking-wider">Uso Responsable de Inteligencia Artificial</h4>
                    <p className="text-[10px] xl:text-[11px] text-slate-600 leading-relaxed font-medium">Esta herramienta elabora propuestas pedagógicas vinculadas al contexto de tu escuela. El tiempo de respuesta dependerá de tu conexión a internet.</p>
                  </div>
                </div>

                {proyectoCopiado && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 rounded-2xl mb-4 flex items-start gap-3 animate-in slide-in-from-top-4 shadow-sm">
                    <Clipboard size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-bold text-amber-900 mb-0.5 uppercase tracking-wider">Proyecto en portapapeles</h4>
                      <p className="text-[10px] text-amber-800/80 font-medium">Haz clic en <strong>"Insertar"</strong> en la fase correspondiente.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8 xl:space-y-14">
                {fases.map((fase, index) => (
                  <section key={fase.id}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 mb-3 xl:mb-6 gap-2 group">
                      <div className="flex items-center gap-2 xl:gap-3">
                        <span className="text-slate-300 font-extrabold text-base xl:text-2xl tabular-nums tracking-tighter">0{index + 1}.</span>
                        <h3 className="text-sm xl:text-lg font-bold text-slate-900 uppercase tracking-tight leading-none">{fase.titulo}</h3>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                        <span className="text-[9px] xl:text-xs text-slate-400 font-medium hidden lg:block truncate max-w-[150px] xl:max-w-[200px]">{fase.desc}</span>
                        
                        {(actividades[fase.id] || recursos[fase.id]) && (
                          <button
                            onClick={() => {
                              if(window.confirm(`¿Borrar el contenido de la fase: ${fase.titulo}?`)) {
                                setActividades(prev => ({ ...prev, [fase.id]: '' }));
                                setRecursos(prev => ({ ...prev, [fase.id]: '' }));
                              }
                            }}
                            className="p-1.5 xl:p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                            title="Borrar redacción de esta fase"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                        {/* CORRECCIÓN: Botón asíncrono para consumir chispas de forma segura */}
                        <button 
                          onClick={async () => {
                            if (isGenerating === fase.id) return;
                            
                            if (isPremium) {
                              await generateAIActivity(fase.id, fase.titulo);
                            } else {
                              // 1. Verificamos si hay chispas antes de empezar
                              if (freeCredits && freeCredits > 0) {
                                
                                // 2. Consumimos el crédito y guardamos el NUEVO valor directamente
                                // Si el saldo actual es 1, sabemos que después de esta acción será 0
                                const seraUltimaChispa = Number(freeCredits) === 1;

                                if (consumeCredit) {
                                  const canConsume = await consumeCredit();
                                  if (canConsume === false) return;
                                }

                                // 3. Ejecutamos la generación de la IA
                                await generateAIActivity(fase.id, fase.titulo);
                                
                                // 4. ✨ DISPARO AUTOMÁTICO CON AGRADECIMIENTO GARANTIZADO
                                if (seraUltimaChispa) {
                                  // 1. Primero lanzamos el agradecimiento inmediatamente al terminar la IA
                                  showToast(
                                    'success', 
                                    '¡Planeación Generada!', 
                                    'Gracias por confiar en NEM Pro. Has agotado tus chispas gratuitas. Te invitamos a renovar tu suscripción'
                                  );
                                  
                                  // 2. Le damos 2.5 segundos de gloria al mensaje para que el maestro lo lea bien
                                  setTimeout(() => {
                                    onPremiumClick && onPremiumClick();
                                  }, 12000); 
                                }
                                
                              } else {
                                // Si ya estaba en 0 desde el inicio
                                onPremiumClick && onPremiumClick();
                              }
                            }
                          }}
                          disabled={isGenerating === fase.id} 
                          className={`flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-[9px] xl:text-xs font-bold transition-all shrink-0 disabled:opacity-50 hover:scale-105 border ${isPremium || (freeCredits && freeCredits > 0) ? `border-transparent ${btnGlossy}` : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                        >
                          {isPremium ? <Sparkles size={14} className={isGenerating === fase.id ? "animate-spin" : ""} /> : (freeCredits && freeCredits > 0 ? <Sparkles size={14} className={isGenerating === fase.id ? "animate-spin text-amber-400" : "text-amber-400"} /> : <Lock size={12} />)} 
                          {isGenerating === fase.id ? "Generando..." : isPremium ? "Generar con IA" : `Generar (⚡ ${freeCredits})`}
                        </button>

                        {proyectoCopiado && (
                          <button onClick={() => handlePasteToFase(fase.id)} className={`flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-[9px] xl:text-xs font-bold border border-transparent ${btnGlossyAmber}`}>
                            <Check size={12} /> Insertar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative pl-4 xl:pl-10 group/area space-y-4">
                      <div className="absolute left-1 xl:left-3 top-1 bottom-1 w-px bg-slate-200 group-focus-within/area:bg-[#135bec] transition-colors"></div>
                      <div className="flex flex-col">
                        <textarea value={actividades[fase.id] || ''} onChange={(e) => setActividades({ ...actividades, [fase.id]: e.target.value })} className="w-full min-h-[160px] xl:min-h-[260px] text-slate-700 leading-relaxed text-[11px] lg:text-sm xl:text-[15px] outline-none border-b border-transparent focus:border-[#135bec]/30 pb-2 transition-all bg-transparent resize-y font-medium" placeholder="Redacta o edita las actividades aquí..."></textarea>
                      </div>
                      <div className="flex flex-col bg-slate-50/80 p-3 xl:p-5 rounded-2xl border border-slate-200 focus-within:border-[#135bec]/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#135bec]/10 transition-all shadow-inner">
                        <label className="text-[9px] xl:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Layers size={12} className="text-[#135bec]" /> Recursos para esta fase</label>
                        <textarea value={recursos[fase.id] || ''} onChange={(e) => setRecursos({ ...recursos, [fase.id]: e.target.value })} className="w-full min-h-[50px] text-slate-700 font-bold leading-relaxed text-[10px] xl:text-sm outline-none bg-transparent resize-y" placeholder="Ej. LTG Proyectos Escolares pág. 24, cartulina, marcadores..."></textarea>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </main>

        {showLibrary && (
          <aside className="w-56 lg:w-72 xl:w-80 bg-white/95 backdrop-blur-md border-l border-slate-200 flex flex-col shrink-0 z-20 shadow-2xl transition-all">
            <div className="p-3 xl:p-5 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4 xl:mb-6">
                <div className="flex items-center gap-2 xl:gap-3">
                  <div className="size-6 xl:size-8 bg-[#135bec] rounded-lg flex items-center justify-center text-white shadow-md shrink-0"><BookOpen size={14} /></div>
                  <div>
                    <h3 className="text-[10px] xl:text-sm font-bold text-slate-900 leading-tight uppercase">Biblioteca SEP</h3>
                    <p className="text-[8px] xl:text-[10px] text-slate-500 uppercase font-bold tracking-tight">Proyectos 2022</p>
                  </div>
                </div>
                <button onClick={() => setShowLibrary(false)} className="text-slate-400 hover:text-rose-500 transition-colors p-1"><X size={16} /></button>
              </div>
              <div className="space-y-2 xl:space-y-3">
                <select value={filtroGrado} onChange={(e) => setFiltroGrado(Number(e.target.value))} className="w-full bg-slate-50/80 border border-slate-200 rounded-xl text-[10px] xl:text-xs font-bold py-2 px-3 focus:bg-white focus:ring-2 focus:ring-[#135bec] outline-none shadow-inner">
                  <option value={1}>1º Grado</option><option value={2}>2º Grado</option><option value={3}>3º Grado</option>
                </select>
                <select value={filtroCampo} onChange={(e) => setFiltroCampo(e.target.value)} className="w-full bg-slate-50/80 border border-slate-200 rounded-xl text-[10px] xl:text-xs font-bold py-2 px-3 focus:bg-white focus:ring-2 focus:ring-[#135bec] outline-none shadow-inner">
                  {camposDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 xl:p-4 scrollbar-thin bg-transparent">
              <div className="space-y-2 xl:space-y-4">
                {proyectosFiltrados.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic text-center mt-4">No hay proyectos para este campo y grado.</p>
                ) : (
                  proyectosFiltrados.map((proyecto, idx) => (
                    <div key={idx} className="p-3 xl:p-4 rounded-2xl border border-slate-200 hover:border-[#135bec]/40 hover:shadow-lg transition-all group cursor-pointer bg-white shadow-sm">
                      <h4 className="text-[10px] xl:text-xs font-bold text-slate-800 leading-tight group-hover:text-[#135bec] transition-colors pr-2 line-clamp-2 mb-1 uppercase">{proyecto.nombre}</h4>
                      <p className="text-[8px] xl:text-[10px] text-slate-500 mb-3 font-bold flex items-center gap-1 uppercase"><FileText size={10}/> Páginas: {proyecto.paginas}</p>
                      
                      <button onClick={isPremium ? () => handleCopy(proyecto) : onPremiumClick} className={`w-full py-1.5 xl:py-2 border rounded-xl text-[9px] xl:text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${isPremium ? (copiedId === proyecto.nombre ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-inner' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-[#135bec] hover:text-white hover:border-[#135bec] hover:shadow-md') : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}>
                        {isPremium ? (copiedId === proyecto.nombre ? <Check size={12}/> : <Plus size={12}/>) : <Lock size={12} />} 
                        {isPremium ? (copiedId === proyecto.nombre ? '¡Copiado!' : 'Vincular') : 'Vincular (Pro)'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] max-w-sm w-full p-4 rounded-2xl shadow-2xl border flex gap-4 animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 size={20} className="text-emerald-500" />}
            {toast.type === 'error' && <AlertTriangle size={20} className="text-rose-500" />}
            {toast.type === 'info' && <Info size={20} className="text-blue-500" />}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold mb-1">{toast.title}</h4>
            <p className="text-xs font-medium opacity-90 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};