import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Layers, FileText, X, Check, Clipboard, GraduationCap, Plus, LogOut, Settings, ChevronRight, Sparkles, PenTool, Info } from 'lucide-react';
import librosData from '../../data/librosData.json';

// --- INICIO DEL DICCIONARIO NEM ---
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
    { id: 'f3', titulo: 'Organicemos las actividades', desc: 'Etapa 3. Herramientas básicas de planificación.', guia: '• PLANIFICACIÓN:\nArticular la intención pedagógica con el servicio (¿Qué? ¿Por qué? ¿Para qué? ¿A quiénes?).' },
    { id: 'f4', titulo: 'Creatividad en marcha', desc: 'Etapa 4. Puesta en práctica de lo planificado.', guia: '• PUESTA EN PRÁCTICA:\nMonitorear las actividades planificadas, los espacios y tiempos. Desarrollar el servicio.' },
    { id: 'f5', titulo: 'Compartimos y evaluamos lo aprendido', desc: 'Etapa 5. Evaluación de resultados y servicio.', guia: '• EVALUACIÓN FINAL:\nEvaluar el cumplimiento de los objetivos y reflexionar sobre el logro del proyecto.' }
  ],
  "Secuencia didáctica": [
    { id: 'f1', titulo: 'Inicio', desc: 'Activación de conocimientos previos y motivación.', guia: '• ACTIVACIÓN:\nRecuperar saberes previos y presentar el propósito (PDA: "{{PDA}}").\n\n• MOTIVACIÓN:\nGenerar interés mediante una pregunta detonadora o situación breve.' },
    { id: 'f2', titulo: 'Desarrollo', desc: 'Construcción del aprendizaje y práctica.', guia: '• CONSTRUCCIÓN DEL APRENDIZAJE:\nImplementar actividades prácticas o investigación.\n\n• ROL DEL DOCENTE:\nAcompañar, mediar y orientar el proceso.' },
    { id: 'f3', titulo: 'Cierre', desc: 'Síntesis, evaluación y retroalimentación.', guia: '• SÍNTESIS:\nRecapitular lo aprendido y socializar resultados.\n\n• EVALUACIÓN FORMATIVA:\nReflexionar sobre las dificultades y logros obtenidos.' }
  ]
};
// --- FIN DEL DICCIONARIO NEM ---

interface SequenceScreenProps {
  projectData: any;
  plannedItems: any[];
  actividades: Record<string, string>;
  setActividades: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  recursos: Record<string, string>;
  setRecursos: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onBack: () => void;
  onGoToEvaluation: () => void;
}

export const SequenceScreen = ({ projectData, plannedItems, actividades, setActividades, recursos, setRecursos, onBack, onGoToEvaluation }: SequenceScreenProps) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [filtroGrado, setFiltroGrado] = useState(Number(projectData.grado) || 1);
  const [filtroCampo, setFiltroCampo] = useState('Lenguajes');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [proyectoCopiado, setProyectoCopiado] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

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
      alert("⚠️ Falta configurar la Llave de Gemini en Vercel. Revisa el tutorial.");
      return;
    }

    setIsGenerating(faseId); 
    
    try {
      const pdaDestacado = plannedItems.find(item => item.type === 'pda')?.text || "tema general";
      const contenidoDestacado = plannedItems.find(item => item.type === 'content')?.text || "contenido base";
      
      const faseActualObjeto = fases.find(f => f.id === faseId);
      const guiaFase = faseActualObjeto ? (faseActualObjeto.guia || "").replace('{{PDA}}', pdaDestacado) : "";
      const descFase = faseActualObjeto ? faseActualObjeto.desc : "";

      const contextoEscuela = projectData.contexto ? `\n\n🏫 CONTEXTO SOCIOEDUCATIVO DE LA ESCUELA (PROGRAMA ANALÍTICO):\n"${projectData.contexto}"\n-> OBLIGATORIO: Adapta las actividades, materiales y ejemplos a este contexto socioeducativo de forma explícita y visible en la redacción.` : "";

      // --- MATEMÁTICAS DEL TIEMPO BLINDADAS ---
      const totalSesiones = Number(projectData.sesiones) || 1;
      const totalMinutos = totalSesiones * 50; 
      const numFases = fases.length || 1;
      const minutosPorFase = Math.round(totalMinutos / numFases);
      
      // Control de volumen dinámico para evitar que la IA alucine
      const limiteActividades = minutosPorFase <= 60 ? "MÁXIMO 1 o 2 actividades" : minutosPorFase <= 120 ? "MÁXIMO 2 o 3 actividades" : "MÁXIMO 3 o 4 actividades";

      const prompt = `Eres un experto pedagogo y diseñador curricular de la Nueva Escuela Mexicana (NEM). 

      🚨 REGLA DE ORO INQUEBRANTABLE: 
      La FASE METODOLÓGICA dicta las acciones. El Contenido/PDA es solo el pretexto o tema de fondo. 
      - Si la fase dice "Planificación", los alumnos NO deben resolver el problema aún, deben organizarse y planear. 
      - Si la fase es "Presentemos", solo deben sensibilizarse o leer el problema, no investigarlo aún.
      - Si la fase es de "Cierre/Evaluación", deben reflexionar y socializar, no aprender conceptos nuevos.

      📌 CONTEXTO METODOLÓGICO ESTRICTO:
      - Metodología: ${projectData.estrategia || "Libre"}
      - Fase o Momento actual: ${faseTitulo}
      - Objetivo oficial de esta fase: ${descFase}
      - Instrucción pedagógica obligatoria para esta fase: ${guiaFase}

      ⏱️ GESTIÓN DEL TIEMPO (REGLA MATEMÁTICA ESTRICTA):
      - Tienes EXACTAMENTE ${minutosPorFase} MINUTOS en total para abarcar toda esta fase.
      - Debes generar ${limiteActividades}. ¡NO MÁS! Si el tiempo es corto, sé directo.
      - LA SUMA MATEMÁTICA de los minutos de tus actividades TIENE QUE DAR EXACTAMENTE ${minutosPorFase}. Haz la cuenta mental antes de escribir. Por ejemplo, si tienes 50 minutos y haces 2 actividades, una debe durar 20 y otra 30.

      📚 TEMA DE FONDO:
      - Campo Formativo: ${campoActual}
      - Contenido: ${contenidoDestacado}
      - PDA: ${pdaDestacado}${contextoEscuela}

      Reglas de formato:
      1. ESTRICTAMENTE PROHIBIDO incluir saludos, introducciones o conclusiones.
      2. NO uses asteriscos dobles (**) para negritas ni formato markdown.
      3. TÍTULOS VISIBLES Y SEPARADOS: Para que el docente identifique rápidamente dónde empieza una actividad, usa EXACTAMENTE este formato para los títulos:
      
      🔸 NOMBRE DE LA ACTIVIDAD - XX MINUTOS 🔸
      --------------------------------------------------
      
      4. DESARROLLO EXTENSO Y ACORDE AL TIEMPO: Deja un renglón en blanco después de la línea punteada y describe paso a paso qué hará el alumno y el docente. 
      5. Al final de tu respuesta, agrega un salto de línea y la palabra EXACTA "RECURSOS:" seguida de una lista de 4 o 5 materiales concretos.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(`API de Google: ${data.error.message}`);
      
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("La IA no devolvió respuesta o fue bloqueada.");
      
      const parts = rawText.split('RECURSOS:');
      const actividadesText = parts[0].replace(/\*\*/g, '').trim();
      
      const recursosText = parts.length > 1 
        ? parts[1].replace(/\*\*/g, '').trim() 
        : "LTG, libreta, material de papelería, proyector o material impreso";
      
      setActividades(prev => ({
        ...prev,
        [faseId]: actividadesText 
      }));

      setRecursos(prev => ({
        ...prev,
        [faseId]: recursosText
      }));

    } catch (error: any) {
      console.warn("Fallo detectado en la IA o Red. Desplegando texto de emergencia silencioso...");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const faseActualObjeto = fases.find(f => f.id === faseId);
      const tituloSuperior = faseActualObjeto ? faseActualObjeto.titulo.toUpperCase() : faseTitulo.toUpperCase();
      const descripcionBreve = faseActualObjeto ? faseActualObjeto.desc.toLowerCase() : "las actividades correspondientes";
      
      const fallbackActivity = `🔸 ACTIVIDAD GUIADA EN PLENARIA - 15 MINUTOS 🔸\n--------------------------------------------------\nEl docente guiará a los alumnos para cumplir con el propósito de esta fase: ${descripcionBreve}. Se establecerá un diálogo inicial mediante preguntas detonadoras para propiciar la participación de los alumnos y organizar el trabajo a realizar en el aula, vinculando el tema central con la realidad de los estudiantes y su contexto escolar.\n\n🔸 TRABAJO PRÁCTICO EN EQUIPOS Y SISTEMATIZACIÓN - 35 MINUTOS 🔸\n--------------------------------------------------\nLos alumnos desarrollarán los productos, investigaciones o reflexiones correspondientes a esta etapa de la metodología trabajando en pequeños grupos de 4 o 5 personas. Registrarán sus hallazgos, acuerdos o avances en la libreta de apuntes o en los formatos correspondientes, contando en todo momento con la mediación, observación y retroalimentación formativa del docente para asegurar la correcta comprensión del PDA.`;
      
      const fallbackRecursos = "Libro de Texto Gratuito (LTG), libreta de apuntes, pintarrón, marcadores, copias impresas o proyector, material de papelería general.";

      setActividades(prev => ({
        ...prev,
        [faseId]: fallbackActivity 
      }));

      setRecursos(prev => ({
        ...prev,
        [faseId]: fallbackRecursos
      }));

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
      const faseActual = fases.find(f => f.id === faseId)?.titulo || "la fase";
      const textoEnriquecido = `🔸 VINCULACIÓN CON LTG 🔸\n--------------------------------------------------\n${proyectoCopiado}\n\n1. Lectura comunitaria: Todos realizan la lectura guiada.\n2. Diálogo reflexivo: Plenaria para compartir puntos de vista.\n3. Sistematización: Elaboración de organizador gráfico.`;
      setActividades(prev => ({
        ...prev,
        [faseId]: prev[faseId] ? prev[faseId] + '\n\n' + textoEnriquecido : textoEnriquecido
      }));
      setProyectoCopiado(null);
    }
  };

  const camposDisponibles = ["Lenguajes", "Saberes y Pensamiento Científico", "Ética, Naturaleza y Sociedades", "De lo Humano y lo Comunitario"];
  const libroSeleccionado = librosData.libros.find(l => l.grado === filtroGrado);
  const proyectosFiltrados = libroSeleccionado?.proyectos.filter(p => p.campo === filtroCampo) || [];

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden selection:bg-[#135bec]/20 selection:text-[#135bec]">
      <header className="h-14 md:h-16 border-b border-slate-200 bg-white sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 text-[#135bec]">
            <Layers className="text-[#135bec]" size={20} />
            <h2 className="text-base md:text-lg font-bold tracking-tight text-slate-900">Planeador <span className="hidden sm:inline">NEM</span> <span className="text-[#135bec]/80">Pro</span></h2>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2"></div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
            <FileText size={16} />
            <span className="hidden sm:inline">Planeación Didáctica</span>
            <span className="sm:hidden">Secuencia</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1">
            {!showLibrary && (
              <button onClick={() => setShowLibrary(true)} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 rounded-xl transition-all shadow-sm mr-1 md:mr-2">
                <BookOpen size={16} />
                <span className="hidden lg:inline">Ver Biblioteca</span>
              </button>
            )}
            <button onClick={onBack} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all shadow-sm">
              <ArrowLeft size={16} className="text-slate-400 group-hover:text-indigo-500" />
              <span className="hidden md:inline">Volver al Lienzo</span>
            </button>
            
            <button 
              onClick={onGoToEvaluation}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-md shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-lg transition-all ml-2 border border-indigo-500"
            >
              <PenTool size={18} />
              <span className="hidden sm:inline">Siguiente: Evaluación</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-48 lg:w-56 xl:w-64 bg-[#0f172a] text-slate-300 flex flex-col shrink-0 z-20 transition-all">
          <div className="p-3 xl:p-6 border-b border-slate-800">
            <button onClick={onBack} className="flex items-center gap-2 text-[10px] xl:text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-4 xl:mb-6 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
              <span className="hidden lg:inline">Volver al Lienzo</span>
            </button>
            <div className="space-y-3 xl:space-y-4">
              <div>
                <span className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Proyecto Activo</span>
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
                {plannedItems.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">No hay contenidos.</p>
                ) : (
                  plannedItems.map((item) => (
                    <div key={item.id} className="p-2 xl:p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                      <p className="text-[9px] xl:text-xs text-slate-300 leading-relaxed font-medium line-clamp-3">
                        <span className={`font-bold mr-1 ${item.type === 'content' ? 'text-blue-400' : 'text-emerald-400'}`}>[{item.type === 'content' ? 'C' : 'PDA'}]</span>
                        {item.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-3 md:p-6 lg:p-8 scrollbar-thin relative scroll-smooth">
          <div className="w-full xl:max-w-[1450px] mr-auto flex flex-col">
            <div className="bg-white shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)] rounded-2xl border border-slate-200 min-h-[calc(100vh-10rem)] h-auto p-4 md:p-8 xl:p-16 mb-10 w-full">
              
              <div className="mb-6 xl:mb-12 border-b border-slate-100 pb-4 xl:pb-8">
                <div className="flex items-center gap-3 xl:gap-4 mb-3 xl:mb-6">
                  <div className="p-2 xl:p-3 bg-[#135bec]/10 rounded-lg xl:rounded-xl text-[#135bec] shrink-0">
                    <FileText size={24} className="xl:w-7 xl:h-7" />
                  </div>
                  <div>
                    <h1 className="text-lg lg:text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight uppercase">Planeación Didáctica</h1>
                    <p className="text-[10px] xl:text-sm text-slate-500 mt-1 font-medium hidden sm:block">Sugerencias vinculadas a los LTG Plan 2022.</p>
                  </div>
                </div>

                <div className="bg-indigo-50/80 border border-indigo-100 p-3 xl:p-4 rounded-xl mb-6 flex items-start gap-3">
                  <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg shrink-0 mt-0.5">
                    <Info size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-indigo-900 mb-0.5 uppercase">Uso Responsable de Inteligencia Artificial</h4>
                    <p className="text-[10px] xl:text-[11px] text-indigo-800/80 leading-relaxed">
                      Esta herramienta elabora propuestas de <strong>alta profundidad pedagógica vinculadas al contexto de tu escuela</strong>. Para mantener el sistema sostenible, te pedimos hacer un uso consciente y evitar clics innecesarios. El tiempo de respuesta (aprox. 20-30 seg) dependerá de tu velocidad de conexión a internet.
                    </p>
                  </div>
                </div>

                {proyectoCopiado && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 flex items-start gap-3 animate-in slide-in-from-top-4">
                    <Clipboard size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-bold text-amber-900 mb-0.5 uppercase">Proyecto en portapapeles</h4>
                      <p className="text-[10px] text-amber-800/80">Haz clic en <strong>"Insertar"</strong> en la fase correspondiente.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8 xl:space-y-14">
                {fases.map((fase, index) => (
                  <section key={fase.id}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 mb-3 xl:mb-6 gap-2 group">
                      <div className="flex items-center gap-2 xl:gap-3">
                        <span className="text-slate-300 font-extrabold text-base xl:text-2xl tabular-nums tracking-tighter">0{index + 1}.</span>
                        <h3 className="text-sm xl:text-lg font-bold text-slate-900 uppercase tracking-tight leading-none">{fase.titulo}</h3>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                        <span className="text-[9px] xl:text-xs text-slate-400 font-medium hidden lg:block truncate max-w-[150px] xl:max-w-[200px]">{fase.desc}</span>
                        
                        <button 
                          onClick={() => generateAIActivity(fase.id, fase.titulo)}
                          disabled={isGenerating === fase.id}
                          className="flex items-center gap-1.5 bg-[#4f46e5]/10 text-[#4f46e5] hover:bg-[#4f46e5]/20 px-2 py-1.5 xl:px-3 rounded-lg text-[9px] xl:text-xs font-bold shadow-sm transition-colors shrink-0 disabled:opacity-50"
                        >
                          <Sparkles size={12} className={isGenerating === fase.id ? "animate-spin" : ""} /> 
                          {isGenerating === fase.id ? "Generando..." : "Generar con IA"}
                        </button>

                        {proyectoCopiado && (
                          <button 
                            onClick={() => handlePasteToFase(fase.id)}
                            className="flex items-center gap-1.5 bg-amber-400 text-amber-900 hover:bg-amber-500 px-2 py-1.5 xl:px-3 rounded-lg text-[9px] xl:text-xs font-bold shadow-sm transition-transform transform hover:scale-105 shrink-0"
                          >
                            <Check size={10} /> Insertar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative pl-4 xl:pl-10 group/area space-y-4">
                      <div className="absolute left-1 xl:left-3 top-1 bottom-1 w-px bg-slate-200 group-focus-within/area:bg-[#135bec] transition-colors"></div>
                      
                      <div className="flex flex-col">
                        <textarea 
                          value={actividades[fase.id] || ''}
                          onChange={(e) => setActividades({ ...actividades, [fase.id]: e.target.value })}
                          className="w-full min-h-[160px] xl:min-h-[260px] text-slate-700 leading-relaxed text-[11px] lg:text-sm xl:text-[15px] outline-none border-b border-transparent focus:border-slate-200 pb-2 transition-all bg-transparent resize-y font-medium"
                          placeholder="Redacta o edita las actividades aquí..."
                        ></textarea>
                      </div>

                      <div className="flex flex-col bg-slate-50 p-2.5 xl:p-4 rounded-xl border border-slate-200/60 focus-within:border-[#135bec]/30 focus-within:bg-[#135bec]/5 transition-colors">
                        <label className="text-[9px] xl:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Layers size={12} className="text-[#135bec]" /> Recursos para esta fase
                        </label>
                        <textarea 
                          value={recursos[fase.id] || ''}
                          onChange={(e) => setRecursos({ ...recursos, [fase.id]: e.target.value })}
                          className="w-full min-h-[50px] text-slate-600 font-bold leading-relaxed text-[10px] xl:text-sm outline-none bg-transparent resize-y"
                          placeholder="Ej. LTG Proyectos Escolares pág. 24, cartulina, marcadores..."
                        ></textarea>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </main>

        {showLibrary && (
          <aside className="w-56 lg:w-72 xl:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-20 shadow-xl transition-all">
            <div className="p-3 xl:p-5 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4 xl:mb-6">
                <div className="flex items-center gap-2 xl:gap-3">
                  <div className="size-6 xl:size-8 bg-amber-500 rounded flex items-center justify-center text-white shadow-sm shrink-0">
                    <BookOpen size={14} />
                  </div>
                  <div>
                    <h3 className="text-[10px] xl:text-sm font-bold text-slate-900 leading-tight uppercase">Biblioteca SEP</h3>
                    <p className="text-[8px] xl:text-[10px] text-slate-400 uppercase font-bold tracking-tight">Proyectos</p>
                  </div>
                </div>
                <button onClick={() => setShowLibrary(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-1"><X size={16} /></button>
              </div>
              <div className="space-y-2 xl:space-y-3">
                <select value={filtroGrado} onChange={(e) => setFiltroGrado(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg text-[10px] xl:text-xs font-bold py-1.5 px-2 focus:ring-2 focus:ring-[#135bec] outline-none">
                  <option value={1}>1º Grado</option>
                  <option value={2}>2º Grado</option>
                  <option value={3}>3º Grado</option>
                </select>
                <select value={filtroCampo} onChange={(e) => setFiltroCampo(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg text-[10px] xl:text-xs font-bold py-1.5 px-2 focus:ring-2 focus:ring-[#135bec] outline-none">
                  {camposDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 xl:p-4 scrollbar-thin bg-white">
              <div className="space-y-2 xl:space-y-4">
                {proyectosFiltrados.map((proyecto, idx) => (
                  <div key={idx} className="p-2 xl:p-4 rounded-xl border border-slate-200 hover:border-[#135bec]/40 hover:shadow-lg transition-all group cursor-pointer bg-white">
                    <h4 className="text-[10px] xl:text-xs font-bold text-slate-800 leading-tight group-hover:text-[#135bec] transition-colors pr-2 line-clamp-2 mb-1 uppercase">{proyecto.nombre}</h4>
                    <p className="text-[8px] xl:text-[10px] text-slate-400 mb-2 font-bold flex items-center gap-1 uppercase"><FileText size={9}/> Págs: {proyecto.paginas}</p>
                    <button onClick={() => handleCopy(proyecto)} className={`w-full py-1 xl:py-2 border rounded-lg text-[8px] xl:text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${copiedId === proyecto.nombre ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-[#135bec] hover:text-white hover:border-[#135bec]'}`}>
                      {copiedId === proyecto.nombre ? <Check size={10}/> : <Plus size={10}/>} {copiedId === proyecto.nombre ? '¡Copiado!' : 'Vincular'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};