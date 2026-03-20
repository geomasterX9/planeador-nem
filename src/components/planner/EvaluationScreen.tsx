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

      // NUEVO: Regla estricta global y prohibición de formato Markdown
      let prompt = `Eres un experto pedagogo y diseñador de evaluación formativa de la Nueva Escuela Mexicana (NEM). 
      
      🚨 REGLA ESTRICTA E INQUEBRANTABLE: 
      Tu respuesta debe contener EXACTAMENTE la cantidad de elementos (criterios o preguntas) que se te solicitan en la Instrucción. Ni uno más, ni uno menos. No incluyas saludos, introducciones ni conclusiones.
      NUNCA uses bloques de código o formato markdown (como \`\`\`). Entrega el texto completamente limpio.
      
      Tema/PDA a evaluar: ${pdaText}
      Contenidos: ${contenidoText}\n\n`;

      if (activeTab === 'Listas de cotejo') {
        prompt += `Instrucción: Genera EXACTAMENTE 5 indicadores observables y directos para una "Lista de Cotejo" (deben poder responderse con Sí/No o Lo Logró/En Proceso). 
        Devuelve ÚNICAMENTE las 5 frases separadas por un salto de línea, sin viñetas ni números al inicio.`;
      } else if (activeTab === 'Guías de observación') {
        prompt += `Instrucción: Genera EXACTAMENTE 5 aspectos actitudinales y procedimentales a observar en los estudiantes para una "Guía de Observación". 
        Devuelve ÚNICAMENTE las 5 frases separadas por un salto de línea, sin viñetas ni números al inicio.`;
      } else if (activeTab === 'Escalas estimativas') {
        prompt += `Instrucción: Genera EXACTAMENTE 5 criterios de desempeño o rasgos de aprendizaje para una "Escala Estimativa" (que se medirán con frecuencias como Siempre, A veces, Nunca). 
        Devuelve ÚNICAMENTE las 5 frases separadas por un salto de línea, sin viñetas ni números al inicio.`;
      } else if (activeTab === 'Rúbricas') {
        prompt += `Instrucción: Genera EXACTAMENTE 5 criterios pedagógicos para una "Rúbrica". Para cada criterio redacta 4 niveles de desempeño de mayor a menor calidad.
        DEBES DEVOLVER ESTRICTAMENTE ESTE FORMATO (UNA SOLA LÍNEA POR CADA UNO DE LOS 5 CRITERIOS), SEPARANDO LOS NIVELES CON TRES BARRAS VERTICALES (|||):
        Nombre del Criterio a evaluar ||| Descripción del Nivel Sobresaliente ||| Descripción del Nivel Satisfactorio ||| Descripción del Nivel Suficiente ||| Descripción del Nivel Requiere Apoyo
        Devuelve ÚNICAMENTE 5 líneas en total (una por cada criterio). SIN viñetas ni números al inicio.`;
      } else if (activeTab === 'Cuestionarios') {
        prompt += `Instrucción: Redacta EXACTAMENTE 10 preguntas abiertas, reflexivas y contextualizadas a la realidad del alumno relacionadas con el tema. 
        Evita formatos de opción múltiple. Enumera las preguntas del 1 al 10.`;
      } else if (activeTab === 'Exámenes escritos') {
        if (examFormat === 'multiple') {
          prompt += `Instrucción: Redacta EXACTAMENTE 10 preguntas de OPCIÓN MÚLTIPLE relacionadas con el tema. 
          Cada pregunta debe estar enumerada del 1 al 10 y tener 4 incisos (a, b, c, d). 
          Al final del examen, incluye una pequeña clave de respuestas correctas.`;
        } else {
          prompt += `Instrucción: Redacta EXACTAMENTE 10 preguntas ABIERTAS y de desarrollo, reflexivas y contextualizadas a la realidad del alumno relacionadas con el tema. 
          Evita formatos de opción múltiple. Enumera las preguntas del 1 al 10.`;
        }
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("La IA devolvió una respuesta vacía o fue bloqueada.");

      // Limpieza extrema de la respuesta de la IA (quitar markdown, backticks, asteriscos)
      let aiText = rawText.replace(/
http://googleusercontent.com/immersive_entry_chip/0

¡Ahora sí, cuando le des clic a "Generar con IA", te va a inyectar exactamente las 5 líneas sin fallar! Cuéntame si todo corre en verde.