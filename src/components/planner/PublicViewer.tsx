import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { exportToWord } from '../../herramientas/exportUtils';
import { saveAs } from 'file-saver';
import { Layers, Download, Clock, BookOpen, Target, Calendar, User, FileText, AlertTriangle } from 'lucide-react';

export const PublicViewer = ({ projectId }: { projectId: string }) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('proyectos')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (err) {
        console.error("Error al cargar proyecto público:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchProject();
  }, [projectId]);

  const generateDefaultEvaluationData = (proj: any) => {
    const pdas = proj.planned_items?.filter((i: any) => i.type === 'pda').map((i: any) => i.text) || [];
    const contenidos = proj.planned_items?.filter((i: any) => i.type === 'content').map((i: any) => i.text) || [];
    const baseCriterios = pdas.length > 0 ? pdas : contenidos.length > 0 ? contenidos : ["Participación activa en el proyecto"];
    
    const cotejoInicial = baseCriterios.map((pda: string) => `Logra identificar y aplicar los conceptos sobre: ${pda}`);
    cotejoInicial.push("Colabora de manera respetuosa y equitativa con todos sus compañeros.");
    
    const rubricaInicial = baseCriterios.map((pda: string, idx: number) => ({
      id: idx,
      criterio: `Dominio de: ${pda}`,
      nivel4: `Demuestra un dominio sobresaliente al ${pda.toLowerCase()} y propone soluciones innovadoras.`,
      nivel3: `Logra de forma satisfactoria ${pda.toLowerCase()}, relacionándolo con su entorno.`,
      nivel2: `Requiere apoyo moderado para lograr ${pda.toLowerCase()}.`,
      nivel1: `Presenta dificultad constante para ${pda.toLowerCase()} y necesita seguimiento.`
    }));

    return {
      herramientas: proj.project_data?.herramientas || [],
      cotejo: cotejoInicial,
      rubrica: rubricaInicial,
      rubricaHeaders: ["Sobresaliente (4)", "Satisfactorio (3)", "Suficiente (2)", "Requiere Apoyo (1)"],
      observacion: baseCriterios.map((pda: string) => `Muestra interés y participa activamente en las actividades referentes a: ${pda}`),
      escala: baseCriterios.map((pda: string) => `Aplica correctamente los saberes sobre: ${pda} en la resolución de problemas.`),
      cuestionario: "",
      examen: "",
      retroalimentacion: ""
    };
  };

  const getFileName = (proj: any) => {
    const data = proj.project_data || {};
    const items = proj.planned_items || [];
    const trimestre = data.trimestre || "TRIMESTRE";
    const inicio = data.fechaInicio ? data.fechaInicio.replace(/\//g, '-') : "INICIO";
    const fin = data.fechaFin ? data.fechaFin.replace(/\//g, '-') : "FIN";
    const periodo = `${inicio}_AL_${fin}`;
    const maestro = data.maestro || "DOCENTE";
    const disciplina = items.length > 0 ? items[0].disciplina : "GENERAL";
    const grado = data.grado || "1"; 
    const clean = (str: string) => str.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\-]/g, '');
    return `${clean(trimestre)}-${clean(periodo)}-${clean(maestro)}-${clean(disciplina)}-${clean(grado)}.docx`.toUpperCase();
  };

  const handleDownloadWord = async () => {
    if (!project) return;
    setIsDownloading(true);
    try {
      const evaluationData = generateDefaultEvaluationData(project);
      const wordBlob = await exportToWord(project.project_data, project.planned_items, project.actividades, evaluationData);
      saveAs(wordBlob, getFileName(project));
    } catch (e) {
      alert("Error al generar el documento de Word.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#135bec] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold">Cargando planeación didáctica...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={64} className="text-rose-500 mb-6" />
        <h1 className="text-2xl font-black text-slate-800 mb-2">Enlace no válido o expirado</h1>
        <p className="text-slate-500 font-medium max-w-md">No pudimos encontrar esta planeación. Es posible que el maestro la haya eliminado o que el enlace sea incorrecto.</p>
      </div>
    );
  }

  const data = project.project_data || {};
  const items = project.planned_items || [];
  const acts = project.actividades || {};

  return (
    <div className="min-h-screen bg-slate-100 font-sans selection:bg-[#135bec]/20 pb-20">
      {/* HEADER STICKY */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#135bec] p-1.5 rounded-lg text-white shadow-md"><Layers size={20} /></div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold tracking-tight text-slate-900 leading-none">Planeador NEM <span className="text-[#135bec]">Pro</span></h1>
            <p className="text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Documento en vivo</p>
          </div>
        </div>
        <button 
          onClick={handleDownloadWord} 
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#135bec] to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          <Download size={16} /> {isDownloading ? 'Generando...' : 'Descargar Word'}
        </button>
      </header>

      {/* DOCUMENTO (HOJA VIRTUAL) */}
      <main className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-white shadow-xl shadow-slate-200/50 rounded-2xl md:rounded-[2rem] p-6 md:p-12 border border-slate-200">
          
          {/* Título y Datos Generales */}
          <div className="border-b-2 border-slate-100 pb-8 mb-8 text-center">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">{project.nombre_proyecto || "Proyecto Sin Título"}</h1>
            <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200 text-slate-600 text-xs font-bold mb-6 uppercase tracking-wider">
              {data.cicloEscolar || 'Ciclo 2025-2026'} • {data.trimestre || 'Trimestre'}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><User size={12}/> Docente</p>
                <p className="text-sm font-bold text-slate-800">{data.maestro || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><GraduationCap size={12}/> Grado y Grupo</p>
                <p className="text-sm font-bold text-slate-800">{data.grado ? `${data.grado}°` : '-'} {(data.grupo || []).join(', ')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><Calendar size={12}/> Periodo</p>
                <p className="text-sm font-bold text-slate-800">{data.fechaInicio || '?'} al {data.fechaFin || '?'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><Layers size={12}/> Metodología</p>
                <p className="text-sm font-bold text-slate-800">{data.estrategia || '-'}</p>
              </div>
            </div>
          </div>

          {/* Contenidos y PDAs */}
          <div className="mb-10">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4 border-l-4 border-[#135bec] pl-3">Articulación Curricular</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-2"><BookOpen size={14}/> Contenidos</h4>
                <ul className="space-y-3">
                  {items.filter((i:any) => i.type === 'content').map((c:any, idx:number) => (
                    <li key={idx} className="text-sm text-slate-700 font-medium leading-relaxed flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span> {c.text}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl">
                <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={14}/> Procesos de Desarrollo (PDA)</h4>
                <ul className="space-y-3">
                  {items.filter((i:any) => i.type === 'pda').map((p:any, idx:number) => (
                    <li key={idx} className="text-sm text-slate-700 font-medium leading-relaxed flex items-start gap-2"><span className="text-amber-500 mt-1">•</span> {p.text}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Secuencia Didáctica */}
          <div className="mb-10">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6 border-l-4 border-violet-500 pl-3">Secuencia Didáctica</h3>
            <div className="space-y-6">
              {['inicio', 'desarrollo', 'cierre'].map((fase) => (
                acts[fase] && acts[fase].trim() !== "" && (
                  <div key={fase} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h4 className="text-xs font-black text-violet-700 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Actividades de {fase}</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">{acts[fase]}</p>
                  </div>
                )
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};