import React, { useState, useEffect } from 'react';
import { ArrowLeft, Layers, PenTool, CheckSquare, Table as TableIcon, GraduationCap, LogOut, FileDown, Plus, Trash2, Eye, SlidersHorizontal, FileQuestion, FileSignature, Sparkles } from 'lucide-react';
import { exportToWord } from '../../herramientas/exportUtils';

interface EvaluationScreenProps {
  projectData: any;
  plannedItems: any[];
  actividades: Record<string, string>;
  onBack: () => void;
}

export const EvaluationScreen = ({ projectData, plannedItems, actividades, onBack }: EvaluationScreenProps) => {
  const herramientasSeleccionadas = projectData.herramientas || [];
  const [activeTab, setActiveTab] = useState<string>(herramientasSeleccionadas[0] || '');
  
  const [criteriosCotejo, setCriteriosCotejo] = useState<string[]>([]);
  const [rubricaHeaders, setRubricaHeaders] = useState(["Sobresaliente (4)", "Satisfactorio (3)", "Suficiente (2)", "Requiere Apoyo (1)"]);
  const [criteriosRubrica, setCriteriosRubrica] = useState<any[]>([]);
  const [criteriosObservacion, setCriteriosObservacion] = useState<string[]>([]);
  const [criteriosEscala, setCriteriosEscala] = useState<string[]>([]);
  const [textoCuestionario, setTextoCuestionario] = useState<string>("");
  const [textoExamen, setTextoExamen] = useState<string>("");
  
  const [retroalimentacion, setRetroalimentacion] = useState("");
  
  // Estados para la IA y el formato del examen
  const [isGenerating, setIsGenerating] = useState(false);
  const [examFormat, setExamFormat] = useState<'abiertas' | 'multiple'>('abiertas');

  useEffect(() => {
    const pdas = plannedItems.filter(item => item.type === 'pda').map(item => item.text);
    const contenidos = plannedItems.filter(item => item.type === 'content').map(item => item.text);
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

  }, [plannedItems]);

  const updateList = (setter: any, list: any[], index: number, value: string) => { const newList = [...list]; newList[index] = value; setter(newList); };
  const removeList = (setter: any, list: any[], index: number) => setter(list.filter((_, i) => i !== index));
  const addList = (setter: any, list: any[], text: string) => setter([...list, text]);

  const addCriterioRubrica = () => setCriteriosRubrica([...criteriosRubrica, { id: Date.now(), criterio: "Nuevo criterio...", nivel4: "", nivel3: "", nivel2: "", nivel1: "" }]);
  const updateRubrica = (id: number, field: string, value: string) => setCriteriosRubrica(criteriosRubrica.map(item => item.id === id ? { ...item, [field]: value } : item));
  const removeCriterioRubrica = (id: number) => setCriteriosRubrica(criteriosRubrica.filter(item => item.id !== id));
  const updateRubricaHeader = (index: number, value: string) => { const newH = [...rubricaHeaders]; newH[index] = value; setRubricaHeaders(newH); };

  const handleExport = () => {
    const evaluationData = {
      herramientas: herramientasSeleccionadas,
      cotejo: criteriosCotejo,
      rubrica: criteriosRubrica,
      rubricaHeaders: rubricaHeaders,
      observacion: criteriosObservacion,
      escala: criteriosEscala,
      cuestionario: textoCuestionario,
      examen: textoExamen,
      retroalimentacion: retroalimentacion
    };
    exportToWord(projectData, plannedItems, actividades, evaluationData);
  };

  const generateAIEvaluation = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("⚠️ Falta configurar la Llave de Gemini en Vercel.");
      return;
    }

    setIsGenerating(true);

    try {
      const pdaText = plannedItems.filter(i => i.type === 'pda').map(i => i.text).join(", ") || "el tema central del proyecto";
      const contenidoText = plannedItems.filter(i => i.type === 'content').map(i => i.text).join(", ") || "los contenidos de la clase";

      // MODO ESTRUCTURADO ESTRICTO (JSON)
      let prompt = `Eres un experto pedagogo de la Nueva Escuela Mexicana (NEM).
      Tema/PDA a evaluar: ${pdaText}
      Contenidos: ${contenidoText}
      
      REGLA OBLIGATORIA: Ignora cuántos temas hay en la lista. Debes generar EXACTAMENTE la cantidad de criterios o preguntas solicitadas a continuación. NO generes ni una más, ni una menos.\n`;

      if (activeTab === 'Listas de cotejo' || activeTab === 'Guías de observación' || activeTab === 'Escalas estimativas') {
        prompt += `INSTRUCCIÓN: Genera EXACTAMENTE 5 indicadores/criterios para el instrumento: ${activeTab}. 
        Devuelve estrictamente un JSON que sea UN ARREGLO de 5 strings. 
        Ejemplo exacto: ["Criterio 1", "Criterio 2", "Criterio 3", "Criterio 4", "Criterio 5"]`;
      } 
      else if (activeTab === 'Rúbricas') {
        prompt += `INSTRUCCIÓN: Genera EXACTAMENTE 5 criterios pedagógicos para una Rúbrica con 4 niveles de desempeño.
        Devuelve estrictamente un JSON que sea UN ARREGLO de 5 objetos con esta estructura exacta:
        [
          { "criterio": "Nombre...", "nivel4": "Sobresaliente...", "nivel3": "Satisfactorio...", "nivel2": "Suficiente...", "nivel1": "Requiere apoyo..." }
        ]`;
      } 
      else if (activeTab === 'Cuestionarios' || (activeTab === 'Exámenes escritos' && examFormat === 'abiertas')) {
        prompt += `INSTRUCCIÓN: Genera EXACTAMENTE 10 preguntas abiertas y reflexivas para el alumno.
        Devuelve estrictamente un JSON que sea UN ARREGLO de 10 strings. 
        Ejemplo exacto: ["¿Pregunta 1?", "¿Pregunta 2?", ...]`;
      } 
      else if (activeTab === 'Exámenes escritos' && examFormat === 'multiple') {
        prompt += `INSTRUCCIÓN: Genera EXACTAMENTE 10 preguntas de opción múltiple.
        Devuelve estrictamente un JSON que sea UN ARREGLO de 10 objetos con esta estructura exacta:
        [
          { "pregunta": "¿...?", "opciones": ["a) ...", "b) ...", "c) ...", "d) ..."], "respuesta": "a) ..." }
        ]`;
      }

      // Obligamos a Gemini a devolver un JSON válido
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" } // <- EL SECRETO
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`API de Google: ${data.error.message}`);
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        throw new Error("La IA bloqueó la respuesta por filtros de seguridad de Google.");
      }

      const jsonResponse = JSON.parse(rawText);

      // Procesamiento a prueba de balas garantizando las cantidades
      if (['Listas de cotejo', 'Guías de observación', 'Escalas estimativas'].includes(activeTab)) {
        const items = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.criterios || Object.values(jsonResponse));
        const safeItems = items.slice(0, 5).map((i: any) => typeof i === 'string' ? i : JSON.stringify(i));
        while (safeItems.length < 5) safeItems.push("Criterio pendiente...");
        
        if (activeTab === 'Listas de cotejo') setCriteriosCotejo(safeItems);
        if (activeTab === 'Guías de observación') setCriteriosObservacion(safeItems);
        if (activeTab === 'Escalas estimativas') setCriteriosEscala(safeItems);
      } 
      else if (activeTab === 'Rúbricas') {
        const items = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.rubrica || jsonResponse.criterios || Object.values(jsonResponse));
        const newRubrica = items.slice(0, 5).map((obj: any, idx: number) => ({
          id: Date.now() + idx,
          criterio: obj.criterio || "Criterio generado",
          nivel4: obj.nivel4 || "",
          nivel3: obj.nivel3 || "",
          nivel2: obj.nivel2 || "",
          nivel1: obj.nivel1 || ""
        }));
        while (newRubrica.length < 5) {
          newRubrica.push({ id: Date.now() + newRubrica.length, criterio: "Criterio pendiente...", nivel4: "", nivel3: "", nivel2: "", nivel1: "" });
        }
        setCriteriosRubrica(newRubrica);
      } 
      else if (activeTab === 'Cuestionarios' || (activeTab === 'Exámenes escritos' && examFormat === 'abiertas')) {
        const items = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.preguntas || Object.values(jsonResponse));
        const text = items.slice(0, 10).map((q: any, idx: number) => `${idx + 1}. ${typeof q === 'string' ? q : JSON.stringify(q)}`).join('\n\n');
        if (activeTab === 'Cuestionarios') setTextoCuestionario(text);
        else setTextoExamen(text);
      } 
      else if (activeTab === 'Exámenes escritos' && examFormat === 'multiple') {
        const items = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.preguntas || Object.values(jsonResponse));
        const text = items.slice(0, 10).map((q: any, idx: number) => {
          const ops = Array.isArray(q.opciones) ? q.opciones.join('\n') : "";
          return `${idx + 1}. ${q.pregunta || JSON.stringify(q)}\n${ops}\n(Respuesta correcta: ${q.respuesta || ''})`;
        }).join('\n\n');
        setTextoExamen(text);
      }

    } catch (error: any) {
      console.error("Error en IA:", error);
      alert(`FALLO EN LA GENERACIÓN:\n\n${error.message || 'Error desconocido'}\n\n💡 Nota: Si dice "429 Too Many Requests", significa que has superado el límite gratuito de Google (15 consultas por minuto). Espera 60 segundos e intenta de nuevo.`);
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
            <PenTool size={16} />
            <span className="hidden sm:inline">Evaluación Formativa</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <ArrowLeft size={16} />
            <span className="hidden md:inline">Volver a Secuencia</span>
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-md shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-lg transition-all ml-2 border border-indigo-500">
            <FileDown size={18} />
            <span className="hidden sm:inline">Exportar Todo a Word</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 lg:w-60 xl:w-72 bg-[#0f172a] text-slate-300 flex flex-col shrink-0 z-20 transition-all">
          <div className="p-4 xl:p-6 border-b border-slate-800">
            <div className="space-y-3 xl:space-y-4">
              <div>
                <span className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Proyecto Activo</span>
                <h3 className="text-white font-bold text-base xl:text-lg leading-snug truncate" title={projectData.proyecto}>{projectData.proyecto || "Proyecto sin nombre"}</h3>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 xl:p-6 scrollbar-thin">
            <div className="mb-8">
              <h4 className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 xl:mb-4">Herramientas Elegidas</h4>
              <div className="space-y-2 xl:space-y-3">
                {herramientasSeleccionadas.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No seleccionaste instrumentos en la configuración inicial.</p>
                ) : (
                  herramientasSeleccionadas.map((herr: string) => (
                    <button key={herr} onClick={() => setActiveTab(herr)} className={`w-full text-left p-2.5 xl:p-3 rounded-lg border transition-all text-[10px] xl:text-xs font-bold flex items-center gap-2 ${activeTab === herr ? 'bg-[#135bec]/20 border-[#135bec] text-white' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'}`}>
                      {getIconForTab(herr)}
                      {herr}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 lg:p-6 xl:p-8 scrollbar-thin relative scroll-smooth">
          <div className="w-full max-w-[1200px] mr-auto flex flex-col">
            <div className="bg-white shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)] rounded-2xl border border-slate-200 min-h-[calc(100vh-10rem)] h-auto p-6 lg:p-10 xl:p-16 mb-10 w-full">
              
              {/* ENCABEZADO Y BOTON IA */}
              <div className="mb-8 xl:mb-12 border-b border-slate-100 pb-6 xl:pb-8 flex justify-between items-center">
                <div className="flex items-center gap-3 xl:gap-4">
                  <div className="p-2 xl:p-3 bg-emerald-50 rounded-lg xl:rounded-xl text-emerald-600 shrink-0"><PenTool size={24} /></div>
                  <div>
                    <h1 className="text-xl lg:text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">{activeTab || "Instrumentos de Evaluación"}</h1>
                  </div>
                </div>

                {herramientasSeleccionadas.length > 0 && (
                  <button 
                    onClick={generateAIEvaluation}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-[#4f46e5]/10 text-[#4f46e5] hover:bg-[#4f46e5]/20 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Sparkles size={18} className={isGenerating ? "animate-spin" : ""} /> 
                    {isGenerating ? "Generando Instrumento..." : "Generar con IA"}
                  </button>
                )}
              </div>

              {herramientasSeleccionadas.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <PenTool size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Vuelve a la Configuración Inicial y selecciona al menos un instrumento de evaluación.</p>
                </div>
              )}

              {/* LISTA DE COTEJO */}
              {activeTab === 'Listas de cotejo' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">Estima la presencia o ausencia de los atributos relevantes en la ejecución o producto de todos los estudiantes.</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200">
                          <th className="p-3 xl:p-4 font-bold w-12 text-center">No.</th>
                          <th className="p-3 xl:p-4 font-bold">Indicadores Observables</th>
                          <th className="p-3 xl:p-4 font-bold w-20 text-center">Sí</th>
                          <th className="p-3 xl:p-4 font-bold w-20 text-center">No</th>
                          <th className="p-3 xl:p-4 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {criteriosCotejo.map((criterio, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-3 xl:p-4 text-center font-bold text-slate-400 text-xs">{idx + 1}</td>
                            <td className="p-3 xl:p-4"><textarea value={criterio} onChange={(e) => updateList(setCriteriosCotejo, criteriosCotejo, idx, e.target.value)} className="w-full text-xs xl:text-sm text-slate-700 bg-transparent outline-none resize-none border-b border-transparent focus:border-[#135bec] transition-colors" rows={3}/></td>
                            <td className="p-3 xl:p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded"></div></td>
                            <td className="p-3 xl:p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded"></div></td>
                            <td className="p-3 xl:p-4 text-center"><button onClick={() => removeList(setCriteriosCotejo, criteriosCotejo, idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => addList(setCriteriosCotejo, criteriosCotejo, "Nuevo indicador...")} className="flex items-center gap-2 text-xs font-bold text-[#135bec] hover:bg-[#135bec]/10 px-4 py-2 rounded-lg transition-colors"><Plus size={14}/> Agregar Indicador</button>
                </div>
              )}

              {/* GUÍA DE OBSERVACIÓN */}
              {activeTab === 'Guías de observación' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">Define los comportamientos, actitudes o procedimientos que observarás en todos los estudiantes durante las sesiones.</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200">
                          <th className="p-3 xl:p-4 font-bold w-12 text-center">No.</th>
                          <th className="p-3 xl:p-4 font-bold">Aspectos a Observar</th>
                          <th className="p-3 xl:p-4 font-bold w-48 text-center">Registro / Notas</th>
                          <th className="p-3 xl:p-4 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {criteriosObservacion.map((criterio, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-3 xl:p-4 text-center font-bold text-slate-400 text-xs">{idx + 1}</td>
                            <td className="p-3 xl:p-4"><textarea value={criterio} onChange={(e) => updateList(setCriteriosObservacion, criteriosObservacion, idx, e.target.value)} className="w-full text-xs xl:text-sm text-slate-700 bg-transparent outline-none resize-none border-b border-transparent focus:border-[#135bec] transition-colors" rows={3}/></td>
                            <td className="p-3 xl:p-4 text-center text-slate-300 text-xs italic">Espacio para notas</td>
                            <td className="p-3 xl:p-4 text-center"><button onClick={() => removeList(setCriteriosObservacion, criteriosObservacion, idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => addList(setCriteriosObservacion, criteriosObservacion, "Nuevo aspecto a observar...")} className="flex items-center gap-2 text-xs font-bold text-[#135bec] hover:bg-[#135bec]/10 px-4 py-2 rounded-lg transition-colors"><Plus size={14}/> Agregar Aspecto</button>
                </div>
              )}

              {/* ESCALA ESTIMATIVA */}
              {activeTab === 'Escalas estimativas' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">Mide la frecuencia o intensidad de la conducta o aprendizaje de todos los alumnos usando una escala categórica.</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200">
                          <th className="p-3 xl:p-4 font-bold">Criterio / Rasgo</th>
                          <th className="p-3 xl:p-4 font-bold w-20 text-center">Siempre</th>
                          <th className="p-3 xl:p-4 font-bold w-20 text-center">Casi Siempre</th>
                          <th className="p-3 xl:p-4 font-bold w-20 text-center">A veces</th>
                          <th className="p-3 xl:p-4 font-bold w-20 text-center">Nunca</th>
                          <th className="p-3 xl:p-4 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {criteriosEscala.map((criterio, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-3 xl:p-4"><textarea value={criterio} onChange={(e) => updateList(setCriteriosEscala, criteriosEscala, idx, e.target.value)} className="w-full text-xs xl:text-sm text-slate-700 bg-transparent outline-none resize-none border-b border-transparent focus:border-[#135bec] transition-colors" rows={3}/></td>
                            <td className="p-3 xl:p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded-full"></div></td>
                            <td className="p-3 xl:p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded-full"></div></td>
                            <td className="p-3 xl:p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded-full"></div></td>
                            <td className="p-3 xl:p-4 text-center"><div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded-full"></div></td>
                            <td className="p-3 xl:p-4 text-center"><button onClick={() => removeList(setCriteriosEscala, criteriosEscala, idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => addList(setCriteriosEscala, criteriosEscala, "Nuevo rasgo...")} className="flex items-center gap-2 text-xs font-bold text-[#135bec] hover:bg-[#135bec]/10 px-4 py-2 rounded-lg transition-colors"><Plus size={14}/> Agregar Rasgo</button>
                </div>
              )}

              {/* RÚBRICA */}
              {activeTab === 'Rúbricas' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex justify-between items-center">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">Usa el botón "Generar con IA" arriba para redactar los niveles de desempeño dinámicamente según tu PDA.</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left border-collapse min-w-[900px] bg-white">
                      <thead>
                        <tr className="bg-[#1e293b] text-white text-[10px] xl:text-[11px] uppercase tracking-wider">
                          <th className="p-3 xl:p-4 font-bold w-[20%]">Criterio a Evaluar</th>
                          <th className="p-2 xl:p-3 font-bold w-[19%] bg-emerald-600/20"><input value={rubricaHeaders[0]} onChange={(e) => updateRubricaHeader(0, e.target.value)} className="w-full bg-transparent outline-none border-b border-transparent focus:border-white text-center font-bold"/></th>
                          <th className="p-2 xl:p-3 font-bold w-[19%] bg-blue-500/20"><input value={rubricaHeaders[1]} onChange={(e) => updateRubricaHeader(1, e.target.value)} className="w-full bg-transparent outline-none border-b border-transparent focus:border-white text-center font-bold"/></th>
                          <th className="p-2 xl:p-3 font-bold w-[19%] bg-amber-500/20"><input value={rubricaHeaders[2]} onChange={(e) => updateRubricaHeader(2, e.target.value)} className="w-full bg-transparent outline-none border-b border-transparent focus:border-white text-center font-bold"/></th>
                          <th className="p-2 xl:p-3 font-bold w-[19%] bg-red-500/20"><input value={rubricaHeaders[3]} onChange={(e) => updateRubricaHeader(3, e.target.value)} className="w-full bg-transparent outline-none border-b border-transparent focus:border-white text-center font-bold"/></th>
                          <th className="p-2 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {criteriosRubrica.map((row) => (
                          <tr key={row.id} className="group hover:bg-slate-50/30 transition-colors">
                            <td className="p-3 xl:p-4 align-top border-r border-slate-100"><textarea value={row.criterio} onChange={(e) => updateRubrica(row.id, 'criterio', e.target.value)} className="w-full text-[11px] xl:text-xs font-bold text-slate-700 bg-transparent outline-none resize-none h-full min-h-[100px]"/></td>
                            <td className="p-3 xl:p-4 align-top border-r border-slate-100 bg-emerald-50/30"><textarea value={row.nivel4} onChange={(e) => updateRubrica(row.id, 'nivel4', e.target.value)} className="w-full text-[11px] xl:text-xs text-slate-600 bg-transparent outline-none resize-none h-full min-h-[100px]"/></td>
                            <td className="p-3 xl:p-4 align-top border-r border-slate-100 bg-blue-50/30"><textarea value={row.nivel3} onChange={(e) => updateRubrica(row.id, 'nivel3', e.target.value)} className="w-full text-[11px] xl:text-xs text-slate-600 bg-transparent outline-none resize-none h-full min-h-[100px]"/></td>
                            <td className="p-3 xl:p-4 align-top border-r border-slate-100 bg-amber-50/30"><textarea value={row.nivel2} onChange={(e) => updateRubrica(row.id, 'nivel2', e.target.value)} className="w-full text-[11px] xl:text-xs text-slate-600 bg-transparent outline-none resize-none h-full min-h-[100px]"/></td>
                            <td className="p-3 xl:p-4 align-top border-r border-slate-100 bg-red-50/30"><textarea value={row.nivel1} onChange={(e) => updateRubrica(row.id, 'nivel1', e.target.value)} className="w-full text-[11px] xl:text-xs text-slate-600 bg-transparent outline-none resize-none h-full min-h-[100px]"/></td>
                            <td className="p-2 align-middle text-center"><button onClick={() => removeCriterioRubrica(row.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={addCriterioRubrica} className="flex items-center gap-2 text-xs font-bold text-[#135bec] hover:bg-[#135bec]/10 px-4 py-2 rounded-lg transition-colors mt-4"><Plus size={14}/> Agregar Fila</button>
                </div>
              )}

              {/* CUESTIONARIOS Y EXÁMENES ESCRITOS */}
              {(activeTab === 'Cuestionarios' || activeTab === 'Exámenes escritos') && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* CAJA DE AYUDA Y BOTONES DE OPCIÓN MÚLTIPLE */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">Usa la Inteligencia Artificial para generar rápidamente preguntas contextualizadas.</p>
                    
                    {activeTab === 'Exámenes escritos' && (
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                        <button 
                          onClick={() => setExamFormat('abiertas')}
                          className={`px-3 py-1.5 text-[10px] xl:text-xs font-bold rounded-md transition-all ${examFormat === 'abiertas' ? 'bg-[#135bec] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          Abiertas
                        </button>
                        <button 
                          onClick={() => setExamFormat('multiple')}
                          className={`px-3 py-1.5 text-[10px] xl:text-xs font-bold rounded-md transition-all ${examFormat === 'multiple' ? 'bg-[#135bec] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          Opción Múltiple
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Redacción de Preguntas</label>
                    <textarea 
                      value={activeTab === 'Cuestionarios' ? textoCuestionario : textoExamen}
                      onChange={(e) => activeTab === 'Cuestionarios' ? setTextoCuestionario(e.target.value) : setTextoExamen(e.target.value)}
                      className="w-full min-h-[400px] text-sm bg-white border border-slate-200 rounded-xl p-5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 resize-y shadow-sm leading-relaxed"
                      placeholder="Escribe aquí el contenido de tu examen o cuestionario...&#10;&#10;Ejemplo:&#10;1. ¿Qué impacto tuvo el desarrollo de...?&#10;2. Escribe tres características de..."
                    />
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};