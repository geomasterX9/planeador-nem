import React, { useState, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { saveAs } from 'file-saver';
import { ArrowLeft, Layers, PenTool, CheckSquare, Table as TableIcon, Eye, SlidersHorizontal, FileQuestion, FileSignature, Sparkles, Info, Cloud, FileDown, Plus, Trash2, Settings, UserCircle, FolderOpen, FileEdit, UploadCloud, FileText, Lock, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { exportToWord } from '../../herramientas/exportUtils';

interface EvaluationScreenProps {
  projectData: any;
  plannedItems: any[];
  actividades: Record<string, string>;
  onBack: () => void;
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

export const EvaluationScreen = ({ projectData, plannedItems, actividades, onBack, onBackToDashboard, saveToCloud, isSaving, user, isPremium, onLogout, onPremiumClick, freeCredits, consumeCredit }: EvaluationScreenProps) => {
  const herramientasSeleccionadas = projectData.herramientas || [];
  const [activeTab, setActiveTab] = useState<string>(herramientasSeleccionadas[0] || '');
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // ✨ CANDADOS DE SEGURIDAD
  const [isCustomized, setIsCustomized] = useState(false);
  const initializedKeyRef = useRef<string | null>(null);
  
  const [criteriosCotejo, setCriteriosCotejo] = useState<string[]>([]);
  const [rubricaHeaders, setRubricaHeaders] = useState(["Sobresaliente (4)", "Satisfactorio (3)", "Suficiente (2)", "Requiere Apoyo (1)"]);
  const [criteriosRubrica, setCriteriosRubrica] = useState<any[]>([]);
  const [criteriosObservacion, setCriteriosObservacion] = useState<string[]>([]);
  const [criteriosEscala, setCriteriosEscala] = useState<string[]>([]);
  const [textoCuestionario, setTextoCuestionario] = useState<string>("");
  const [textoExamen, setTextoExamen] = useState<string>("");
  
  const [retroalimentacion, setRetroalimentacion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [examFormat, setExamFormat] = useState<'abiertas' | 'multiple'>('abiertas');
  const [toast, setToast] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'info', title: string, message: string } | null>(null);

  const storageKey = `eval_data_${projectData?.id || projectData?.proyecto?.replace(/\s+/g, '_') || 'default'}`;

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ isOpen: true, type, title, message });
    setTimeout(() => setToast(null), 12000); 
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  // ✨ EFECTO 1: RECUPERACIÓN BLINDADA
  useEffect(() => {
    if (initializedKeyRef.current === storageKey) return;

    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.isCustomized) {
          setCriteriosCotejo(parsed.criteriosCotejo || []);
          setCriteriosRubrica(parsed.criteriosRubrica || []);
          setCriteriosObservacion(parsed.criteriosObservacion || []);
          setCriteriosEscala(parsed.criteriosEscala || []);
          setTextoCuestionario(parsed.textoCuestionario || "");
          setTextoExamen(parsed.textoExamen || "");
          setIsCustomized(true);
          initializedKeyRef.current = storageKey;
          return; 
        }
      } catch (e) {
        console.error("Error al recuperar datos locales:", e);
      }
    }

    const gradoActual = Number(projectData?.grado) || 1;
    const itemsDelGrado = plannedItems.filter(item => Number(item.grado) === gradoActual || !item.grado);
    
    const disciplinaPrincipal = itemsDelGrado.length > 0 ? itemsDelGrado[itemsDelGrado.length - 1].disciplina : null;
    const itemsFiltrados = disciplinaPrincipal ? itemsDelGrado.filter(item => item.disciplina === disciplinaPrincipal) : itemsDelGrado;

    const pdas = itemsFiltrados.filter(item => item.type === 'pda').map(item => item.text);
    const contenidos = itemsFiltrados.filter(item => item.type === 'content').map(item => item.text);
    const baseCriterios = pdas.length > 0 ? pdas : contenidos.length > 0 ? contenidos : ["Participación activa en el proyecto"];
    
    const cotejoInicial = baseCriterios.map(pda => `Logra identificar y aplicar los conceptos sobre: ${pda}`);
    cotejoInicial.push("Colabora de manera respetuosa y equitativa con todos sus compañeros.");
    setCriteriosCotejo(cotejoInicial);

    const rubricaInicial = baseCriterios.map((pda, idx) => ({
      id: idx,
      criterio: `Dominio de: ${pda}`,
      nivel4: `Demuestra un dominio sobresaliente al ${pda.toLowerCase()} y propone soluciones innovadoras.`,
      nivel3: `Logra de forma satisfactoria ${pda.toLowerCase()}, relacionándolo con su entorno.`,
      nivel2: `Requiere apoyo moderado para lograr ${pda.toLowerCase()}.`,
      nivel1: `Presenta dificultad constante para ${pda.toLowerCase()} y necesita seguimiento.`
    }));
    setCriteriosRubrica(rubricaInicial);

    const obsInicial = baseCriterios.map(pda => `Muestra interés y participa activamente en las actividades referentes a: ${pda}`);
    obsInicial.push("Mantiene una actitud de escucha activa cuando todos sus compañeros participan.");
    setCriteriosObservacion(obsInicial);

    const escalaInicial = baseCriterios.map(pda => `Aplica correctamente los saberes sobre: ${pda} en la resolución de problemas.`);
    escalaInicial.push("Cumple en tiempo y forma con las tareas asignadas para el proyecto.");
    setCriteriosEscala(escalaInicial);

    setIsCustomized(false);
    initializedKeyRef.current = storageKey;
  }, [plannedItems, projectData?.grado, storageKey]);

  // ✨ EFECTO 2: AUTO-GUARDADO CONTINUO
  useEffect(() => {
    if (isCustomized) {
      const dataToSave = {
        isCustomized: true,
        criteriosCotejo,
        criteriosRubrica,
        criteriosObservacion,
        criteriosEscala,
        textoCuestionario,
        textoExamen
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [isCustomized, criteriosCotejo, criteriosRubrica, criteriosObservacion, criteriosEscala, textoCuestionario, textoExamen, storageKey]);


  const updateList = (setter: any, list: any[], index: number, value: string) => { 
    setIsCustomized(true); 
    const newList = [...list]; newList[index] = value; setter(newList); 
  };
  const addList = (setter: any, list: any[], text: string) => { 
    setIsCustomized(true); 
    setter([...list, text]); 
  };
  const addCriterioRubrica = () => { 
    setIsCustomized(true); 
    setCriteriosRubrica([...criteriosRubrica, { id: Date.now(), criterio: "Nuevo criterio...", nivel4: "", nivel3: "", nivel2: "", nivel1: "" }]); 
  };
  const updateRubrica = (id: number, field: string, value: string) => { 
    setIsCustomized(true); 
    setCriteriosRubrica(criteriosRubrica.map(item => item.id === id ? { ...item, [field]: value } : item)); 
  };

  const getFileName = () => {
    const trimestre = projectData.trimestre || "TRIMESTRE";
    const inicio = projectData.fechaInicio ? projectData.fechaInicio.replace(/\//g, '-') : "INICIO";
    const fin = projectData.fechaFin ? projectData.fechaFin.replace(/\//g, '-') : "FIN";
    const periodo = `${inicio}_AL_${fin}`;
    const maestro = projectData.maestro || "DOCENTE";
    const disciplina = plannedItems.length > 0 ? plannedItems[0].disciplina : "GENERAL";
    const grado = projectData.grado || "1"; 
    const clean = (str: string) => str.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\-]/g, '');
    return `${clean(trimestre)}-${clean(periodo)}-${clean(maestro)}-${clean(disciplina)}-${clean(grado)}.docx`.toUpperCase();
  };

  const getEvaluationData = () => ({
    herramientas: herramientasSeleccionadas,
    cotejo: criteriosCotejo,
    rubrica: criteriosRubrica,
    rubricaHeaders: rubricaHeaders,
    observacion: criteriosObservacion,
    escala: criteriosEscala,
    cuestionario: textoCuestionario,
    examen: textoExamen,
    retroalimentacion: retroalimentacion
  });

  const handleDownloadLocal = async () => {
    if (!isPremium && consumeCredit) {
      const exito = consumeCredit();
      if (!exito) return; 
    }

    try {
      const wordBlob = await exportToWord(projectData, plannedItems, actividades, getEvaluationData());
      saveAs(wordBlob, getFileName());
      showToast('success', 'Éxito', 'Archivo descargado (⚡ -1 chispa)');
    } catch (error) {
      console.error(error);
      showToast('error', 'Error al generar', 'Hubo un error al generar el archivo Word.');
    }
  };

  const loginToDrive = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    prompt: 'consent',
    onSuccess: async (tokenResponse) => {
      try {
        const wordBlob = await exportToWord(projectData, plannedItems, actividades, getEvaluationData());
        const fileName = getFileName();
        const metadataResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenResponse.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fileName, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        });
        if (!metadataResponse.ok) throw new Error('Error de conexión con Google');
        const file = await metadataResponse.json();
        const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${tokenResponse.access_token}`, 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          body: wordBlob,
        });
        if (uploadResponse.ok) showToast('success', 'Guardado en Drive', `¡Guardado exitosamente como: ${fileName}!`);
      } catch (error) {
        console.error(error);
        showToast('error', 'Error en Drive', 'Hubo un detalle al guardar en Drive. Revisa la consola.');
      }
    },
  });

  const generateAIEvaluation = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) { 
      showToast('error', 'Sin Llave API', 'Falta configurar la Llave de Gemini en local o Vercel.'); 
      return; 
    }
    setIsGenerating(true);
    try {
      const gradoActual = Number(projectData?.grado) || 1;
      const itemsDelGrado = plannedItems.filter(item => Number(item.grado) === gradoActual || !item.grado);
      const disciplinaActual = itemsDelGrado.length > 0 ? itemsDelGrado[itemsDelGrado.length - 1].disciplina || "la disciplina correspondiente" : "la disciplina correspondiente";
      const itemsSaneados = itemsDelGrado.filter(item => item.disciplina === disciplinaActual || !item.disciplina);

      const pdaText = itemsSaneados.filter(i => i.type === 'pda').map(i => i.text).join(" | ") || "el tema central";
      const contenidoText = itemsSaneados.filter(i => i.type === 'content').map(i => i.text).join(" | ") || "los contenidos";
      const contextoEscuela = projectData?.contexto ? `\n🏫 CONTEXTO:\n"${projectData.contexto}"` : "";
      const actividadesText = Object.values(actividades).filter(text => typeof text === 'string' && text.trim() !== "").join('\n\n');

      const nombrePestana = (activeTab || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      let prompt = `Eres un experto pedagogo de la NEM. Tu misión es redactar instrumentos de evaluación formativa. Disciplina: "${disciplinaActual.toUpperCase()}".
      Prioridad: PDAs: ${pdaText} | Contenidos: ${contenidoText}. ${contextoEscuela}
      Actividades: ${actividadesText || "Sin actividades."} (Si no coinciden con la disciplina, ignóralas).
      
      RESPONDE ÚNICA Y EXCLUSIVAMENTE CON UN JSON VÁLIDO.
      `;

      if (nombrePestana.includes('cotejo') || nombrePestana.includes('observacion') || nombrePestana.includes('guia') || nombrePestana.includes('escala')) {
        prompt += `
        Genera 5 indicadores observables sobre la materia.
        FORMATO: Arreglo simple de strings. EJEMPLO: ["Ind 1", "Ind 2", "Ind 3", "Ind 4", "Ind 5"]`;
      } else if (nombrePestana.includes('rubrica')) {
        prompt += `
        Genera 5 criterios para Rúbrica. Arreglo de 5 objetos con llaves: "criterio", "nivel4", "nivel3", "nivel2", "nivel1".`;
      } else {
        const esMultiple = examFormat === 'multiple';
        prompt += `
        Genera un examen de 10 preguntas ${esMultiple ? 'de opción múltiple' : 'abiertas'}.
        🚨 IMPORTANTE: Redacta las preguntas dirigidas DIRECTAMENTE AL ALUMNO, usando un lenguaje claro, motivador y adecuado para su grado escolar (${gradoActual}º de Secundaria). 
        Evita lenguaje técnico de planeación; convierte los PDAs en retos o cuestionamientos interesantes para ellos.
        Arreglo de 10 objetos con llave "pregunta"${esMultiple ? ' y "opciones" (arreglo de 4 textos)' : ''}.`;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText.trim()) throw new Error("empty_response");
      
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      if (!rawText.startsWith('[') && !rawText.startsWith('{')) rawText = `[${rawText}]`;
      const jsonResponse = JSON.parse(rawText);

      let rawArray: any[] = [];
      if (Array.isArray(jsonResponse)) {
        rawArray = jsonResponse;
      } else if (typeof jsonResponse === 'object') {
        const possibleArray = Object.values(jsonResponse).find(val => Array.isArray(val));
        rawArray = possibleArray ? possibleArray as any[] : Object.values(jsonResponse);
      } else {
        rawArray = [jsonResponse];
      }

      const stringsArray = rawArray.map(item => {
        if (typeof item === 'string') return item;
        if (item.indicador) return item.indicador;
        if (item.criterio) return item.criterio;
        if (item.texto) return item.texto;
        return JSON.stringify(item);
      });

      setIsCustomized(true);

      if (nombrePestana.includes('cotejo')) {
        setCriteriosCotejo(stringsArray.slice(0, 5));
        showToast('success', '¡Generado!', 'Lista de cotejo actualizada con IA.');
      } else if (nombrePestana.includes('observacion') || nombrePestana.includes('guia')) {
        setCriteriosObservacion(stringsArray.slice(0, 5));
        showToast('success', '¡Generado!', 'Guía de observación actualizada con IA.');
      } else if (nombrePestana.includes('escala')) {
        setCriteriosEscala(stringsArray.slice(0, 5));
        showToast('success', '¡Generado!', 'Escala estimativa actualizada con IA.');
      } else if (nombrePestana.includes('rubrica')) {
        setCriteriosRubrica(rawArray.slice(0, 5)); 
        showToast('success', '¡Generado!', 'Rúbrica actualizada con IA.');
      } else {
        const text = rawArray.map((q: any, i: number) => {
          if (typeof q === 'string') return `${i + 1}. ${q}`;
          let itemStr = `${i + 1}. ${q.pregunta || q.question || q.texto || 'Pregunta'}`;
          if (q.opciones && Array.isArray(q.opciones)) {
            itemStr += '\n' + q.opciones.map((opt: string, idx: number) => `   ${String.fromCharCode(97 + idx)}) ${opt}`).join('\n');
          }
          return itemStr;
        }).join('\n\n');

        if (nombrePestana.includes('cuestionario')) {
          setTextoCuestionario(text);
          showToast('success', '¡Generado!', 'Cuestionario actualizado con IA.');
        } else {
          setTextoExamen(text);
          showToast('success', '¡Generado!', 'Examen actualizado con IA.');
        }
      }

    } catch (error: any) { 
      console.error("🔥 ERROR REAL DE LA API:", error); 
      let mensajeAmigable = "Ocurrió un error inesperado al generar. Por favor, intenta de nuevo.";
      const rawError = (error.message || "").toLowerCase();

      if (rawError.includes('high demand') || rawError.includes('503') || rawError.includes('overloaded')) {
        mensajeAmigable = "Los servidores de IA están saturados. Por favor, espera un momento y reintenta.";
      } else if (rawError.includes('json') || rawError.includes('parse') || rawError.includes('empty_response')) {
        mensajeAmigable = "La IA devolvió un formato confuso. Dale clic en generar nuevamente.";
      } else if (rawError.includes('fetch') || rawError.includes('network')) {
        mensajeAmigable = "Problema de conexión. Revisa tu internet e inténtalo nuevamente.";
      }

      showToast('error', 'Pausa Técnica', mensajeAmigable);
    } finally { 
      setIsGenerating(false); 
    }
  };

  const getIconForTab = (tabName: string) => {
    if (tabName.includes('Rúbrica')) return <TableIcon size={14}/>;
    if (tabName.includes('cotejo')) return <CheckSquare size={14}/>;
    if (tabName.includes('observación')) return <Eye size={14}/>;
    if (tabName.includes('Escalas')) return <SlidersHorizontal size={14}/>;
    if (tabName.includes('Cuestionarios')) return <FileQuestion size={14}/>;
    if (tabName.includes('Exámenes')) return <FileSignature size={14}/>;
    return <PenTool size={14}/>;
  };

  const btnGlossy = "relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all active:scale-95 after:absolute after:top-0 after:-left-[100%] hover:after:left-[200%] after:w-[50%] after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:skew-x-[-20deg] after:transition-all after:duration-[1500ms] after:ease-out";

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden selection:bg-[#135bec]/20 relative">
      <div className="absolute top-0 left-1/4 w-1/2 h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="h-14 md:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-3 text-[#135bec]">
            <div className="bg-[#135bec] p-1.5 rounded-lg text-white shadow-md">
               <Layers size={22} />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-base md:text-lg font-bold tracking-tight text-slate-900 leading-none mb-1">
                Planeador NEM <span className="text-[#135bec]/80">Pro</span>
              </h2>
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
            <PenTool size={16} />
            <span>Evaluación Formativa</span>
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

          {/* ✨ ACTUALIZADO: "Guardar en mi Bóveda de Planeaciones" */}
          {isPremium ? (
            <button onClick={saveToCloud} disabled={isSaving} className={`flex items-center gap-2 px-5 py-2 rounded-xl border border-transparent ${btnGlossy}`}>
              <UploadCloud size={16} className={isSaving ? "animate-bounce" : ""} />
              <span className="hidden md:inline text-xs font-bold tracking-wide">{isSaving ? 'Guardando...' : 'Guardar en mi nube'}</span>
            </button>
          ) : (
            <button onClick={onPremiumClick} className="flex items-center gap-2 px-5 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer">
              <Lock size={14} className="text-slate-400" />
              <span className="hidden md:inline text-xs font-bold text-slate-500 tracking-wide">Guardar en Mis Planeaciones</span>
            </button>
          )}

          <button onClick={onBack} className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all">
            <ArrowLeft size={16} className="text-slate-500 group-hover:text-[#135bec] transition-colors" />
            <span className="hidden md:inline text-xs font-bold text-slate-700">Volver a Secuencia</span>
          </button>

          {/* ✨ ACTUALIZADO: "Guardar en Drive" */}
          <button 
            onClick={() => {
              if (isPremium) {
                loginToDrive();
              } else if (consumeCredit && consumeCredit()) {
                loginToDrive();
              }
            }} 
            className={`group flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all ${isPremium || (freeCredits && freeCredits > 0) ? 'bg-white hover:bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200 opacity-80'}`}
          >
            {isPremium ? (
               <Cloud size={16} className="text-slate-500 group-hover:text-[#135bec]" />
            ) : (freeCredits && freeCredits > 0 ? (
               <Cloud size={16} className="text-amber-500 group-hover:text-amber-600" />
            ) : (
               <Lock size={14} className="text-slate-400" />
            ))}
            <span className="hidden lg:inline text-xs font-bold text-slate-700">
               {isPremium ? "Guardar en Drive" : `Guardar en Drive (⚡ ${freeCredits || 0})`}
            </span>
          </button>

          {/* ✨ ACTUALIZADO: "Exportar a Word" */}
          <button 
            onClick={() => {
              if (isPremium || (consumeCredit && consumeCredit())) {
                handleDownloadLocal();
              }
            }} 
            className={`group flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all ${isPremium || (freeCredits && freeCredits > 0) ? 'bg-white hover:bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200 opacity-80'}`}
          >
            {isPremium ? (
               <FileDown size={16} className="text-slate-500 group-hover:text-[#135bec]" />
            ) : (freeCredits && freeCredits > 0 ? (
               <FileDown size={16} className="text-amber-500 group-hover:text-amber-600" />
            ) : (
               <Lock size={14} className="text-slate-400" />
            ))}
            <span className="hidden lg:inline text-xs font-bold text-slate-700">
               {isPremium ? "Exportar a Word" : `Exportar a Word (⚡ ${freeCredits || 0})`}
            </span>
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
        <aside className="w-52 lg:w-60 xl:w-72 bg-[#0f172a] text-slate-300 flex flex-col shrink-0 z-20 shadow-2xl">
          <div className="p-4 xl:p-6 border-b border-slate-800 bg-slate-900/50">
            <div className="space-y-3">
              <span className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Proyecto Activo</span>
              <h3 className="text-white font-bold text-base xl:text-lg truncate" title={projectData.proyecto}>{projectData.proyecto || "Proyecto sin nombre"}</h3>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 xl:p-6 scrollbar-thin">
            <h4 className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Herramientas Elegidas</h4>
            <div className="space-y-2">
              {herramientasSeleccionadas.map((herr: string) => (
                <button key={herr} onClick={() => setActiveTab(herr)} className={`w-full text-left p-2.5 rounded-lg border transition-all text-[10px] xl:text-xs font-bold flex items-center gap-2 ${activeTab === herr ? `border-transparent ${btnGlossy}` : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-300'}`}>
                  {getIconForTab(herr)} {herr}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-transparent p-4 lg:p-8 scrollbar-thin">
          <div className="w-full max-w-[1200px] mr-auto flex flex-col">
            <div className="bg-white/90 backdrop-blur-md shadow-xl shadow-slate-200/40 border border-white/60 rounded-[2rem] p-6 lg:p-12 xl:p-16 mb-10 w-full">
              <div className="mb-8 border-b border-slate-100 pb-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shadow-inner"><PenTool size={24} /></div>
                  <h1 className="text-xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{activeTab || "Instrumentos"}</h1>
                </div>
                <button 
                  onClick={() => {
                    if (isPremium || (consumeCredit && consumeCredit())) {
                      generateAIEvaluation();
                    }
                  }} 
                  disabled={isGenerating} 
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl border transition-all disabled:opacity-50 ${isPremium || (freeCredits && freeCredits > 0) ? `border-transparent ${btnGlossy}` : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer'}`}
                >
                  {isPremium ? <Sparkles size={18} className={isGenerating ? "animate-spin" : ""} /> : (freeCredits && freeCredits > 0 ? <Sparkles size={18} className={isGenerating ? "animate-spin text-amber-400" : "text-amber-400"} /> : <Lock size={16} />)} 
                  <span className="text-xs font-bold tracking-wide">{isGenerating ? "Generando..." : isPremium ? "Generar con IA" : `Generar (⚡ ${freeCredits})`}</span>
                </button>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl mb-8 flex items-start gap-3 shadow-sm">
                <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] lg:text-xs text-amber-800 leading-relaxed font-medium">
                  <strong className="font-black uppercase tracking-wide">💡 Estos son ejemplos base:</strong> Los criterios mostrados abajo son un borrador genérico. Para obtener una evaluación profesional, personalizada y coherente con tus actividades, haz clic en el botón morado <strong>"Generar con IA"</strong>.
                </p>
              </div>

              {activeTab === 'Listas de cotejo' && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b">
                      <tr><th className="p-4 w-12 text-center">No.</th><th className="p-4">Indicadores</th><th className="p-4 w-20 text-center">Sí</th><th className="p-4 w-20 text-center">No</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {criteriosCotejo.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-4 text-center text-slate-400 font-bold">{i+1}</td>
                          <td className="p-4"><textarea value={c} onChange={(e) => updateList(setCriteriosCotejo, criteriosCotejo, i, e.target.value)} className="w-full bg-transparent text-sm text-slate-700 outline-none resize-none border-b border-transparent focus:border-[#135bec]"/></td>
                          <td className="p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded"/></td>
                          <td className="p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded"/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => addList(setCriteriosCotejo, criteriosCotejo, "Nuevo...")} className="p-4 text-xs font-bold text-[#135bec] flex items-center gap-2 hover:bg-blue-50 w-full transition-colors"><Plus size={14}/> Agregar Fila</button>
                </div>
              )}

              {activeTab === 'Guías de observación' && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b">
                      <tr>
                        <th className="p-4 w-12 text-center">No.</th>
                        <th className="p-4">Indicadores observables</th>
                        <th className="p-4 w-20 text-center">Siempre</th>
                        <th className="p-4 w-20 text-center">A veces</th>
                        <th className="p-4 w-20 text-center">Nunca</th>
                        <th className="p-4 w-32 text-center">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {criteriosObservacion.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-4 text-center text-slate-400 font-bold">{i+1}</td>
                          <td className="p-4"><textarea value={c} onChange={(e) => updateList(setCriteriosObservacion, criteriosObservacion, i, e.target.value)} className="w-full bg-transparent text-sm text-slate-700 outline-none resize-none border-b border-transparent focus:border-[#135bec]"/></td>
                          <td className="p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded-full"/></td>
                          <td className="p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded-full"/></td>
                          <td className="p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded-full"/></td>
                          <td className="p-4 text-center"><div className="w-full h-4 border-b border-slate-300 border-dashed"/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => addList(setCriteriosObservacion, criteriosObservacion, "Nuevo...")} className="p-4 text-xs font-bold text-[#135bec] flex items-center gap-2 hover:bg-blue-50 w-full transition-colors"><Plus size={14}/> Agregar Fila</button>
                </div>
              )}

              {activeTab === 'Escalas estimativas' && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b">
                      <tr>
                        <th className="p-4 w-12 text-center">No.</th>
                        <th className="p-4">Indicadores</th>
                        <th className="p-4 w-24 text-center leading-tight">Sobresaliente</th>
                        <th className="p-4 w-24 text-center leading-tight">Satisfactorio</th>
                        <th className="p-4 w-24 text-center leading-tight">Básico</th>
                        <th className="p-4 w-24 text-center leading-tight">Requiere Apoyo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {criteriosEscala.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-4 text-center text-slate-400 font-bold">{i+1}</td>
                          <td className="p-4"><textarea value={c} onChange={(e) => updateList(setCriteriosEscala, criteriosEscala, i, e.target.value)} className="w-full bg-transparent text-sm text-slate-700 outline-none resize-none border-b border-transparent focus:border-[#135bec]"/></td>
                          <td className="p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded-full"/></td>
                          <td className="p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded-full"/></td>
                          <td className="p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded-full"/></td>
                          <td className="p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded-full"/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => addList(setCriteriosEscala, criteriosEscala, "Nuevo...")} className="p-4 text-xs font-bold text-[#135bec] flex items-center gap-2 hover:bg-blue-50 w-full transition-colors"><Plus size={14}/> Agregar Fila</button>
                </div>
              )}

              {activeTab === 'Rúbricas' && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left">
                    <thead className="bg-[#1e293b] text-white text-[10px] uppercase font-bold">
                      <tr><th className="p-4 w-1/4">Criterio</th><th className="p-4 w-1/4 bg-emerald-600/20">Excelente</th><th className="p-4 w-1/4 bg-blue-500/20">Bueno</th><th className="p-4 w-1/4 bg-amber-500/20">Suficiente</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {criteriosRubrica.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/30"><td className="p-4"><textarea value={r.criterio} onChange={(e) => updateRubrica(r.id, 'criterio', e.target.value)} className="w-full bg-transparent text-xs font-bold outline-none h-20"/></td><td className="p-4 bg-emerald-50/20"><textarea value={r.nivel4} onChange={(e) => updateRubrica(r.id, 'nivel4', e.target.value)} className="w-full bg-transparent text-[11px] outline-none h-20"/></td><td className="p-4 bg-blue-50/20"><textarea value={r.nivel3} onChange={(e) => updateRubrica(r.id, 'nivel3', e.target.value)} className="w-full bg-transparent text-[11px] outline-none h-20"/></td><td className="p-4 bg-amber-50/20"><textarea value={r.nivel2} onChange={(e) => updateRubrica(r.id, 'nivel2', e.target.value)} className="w-full bg-transparent text-[11px] outline-none h-20"/></td></tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={addCriterioRubrica} className="p-4 text-xs font-bold text-[#135bec] flex items-center gap-2 hover:bg-blue-50 w-full transition-colors"><Plus size={14}/> Agregar Criterio</button>
                </div>
              )}

              {(activeTab === 'Cuestionarios' || activeTab === 'Exámenes escritos') && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-200">
                    <p className="text-xs font-bold text-slate-600">Formato del examen:</p>
                    <div className="flex bg-white p-1 rounded-lg border">
                      <button onClick={() => setExamFormat('abiertas')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${examFormat === 'abiertas' ? 'bg-[#135bec] text-white' : 'text-slate-400'}`}>Abiertas</button>
                      <button onClick={() => setExamFormat('multiple')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${examFormat === 'multiple' ? 'bg-[#135bec] text-white' : 'text-slate-400'}`}>Múltiple</button>
                    </div>
                  </div>
                  <textarea 
                    value={activeTab === 'Cuestionarios' ? textoCuestionario : textoExamen} 
                    onChange={(e) => {
                      setIsCustomized(true);
                      activeTab === 'Cuestionarios' ? setTextoCuestionario(e.target.value) : setTextoExamen(e.target.value);
                    }} 
                    className="w-full h-[500px] p-6 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 text-slate-700 leading-relaxed shadow-inner" 
                    placeholder="Escribe aquí..."
                  />
                </div>
              )}
            </div>
          </div>
        </main>
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