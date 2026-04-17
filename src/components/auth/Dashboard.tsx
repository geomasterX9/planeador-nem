import React, { useState, useEffect } from 'react';
import { Plus, Search, LayoutDashboard, Target, BookOpen, Layers, Copy, Trash2, Calendar, FileText, ArrowRight, BarChart3, Filter, Clock, GraduationCap, LogOut, LayoutGrid, List, Share2, Link as LinkIcon, Download, MessageCircle, X, Check, HardDrive, UploadCloud, Sparkles, Lock, AlertTriangle, CheckCircle2, Info, UserCircle, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useGoogleLogin } from '@react-oauth/google';
import { saveAs } from 'file-saver';
import { exportToWord } from '../../herramientas/exportUtils';
import { AdminPanel } from './AdminPanel'; 

interface DashboardProps {
  user: any;
  isPremium?: boolean;
  onPremiumClick?: () => void;
  onSelectProject: (project: any) => void;
  onCreateNew: () => void;
}

// 🛡️ ELIMINAMOS EL TRUE FALSO. AHORA ES FALSE POR DEFECTO.
export const Dashboard = ({ user, isPremium = false, onPremiumClick, onSelectProject, onCreateNew }: DashboardProps) => {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTrimestre, setFiltroTrimestre] = useState('Todos');
  const [filtroCiclo, setFiltroCiclo] = useState('2025-2026'); 
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); 
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [shareProject, setShareProject] = useState<any | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [driveEmail, setDriveEmail] = useState('');
  const [isSendingDrive, setIsSendingDrive] = useState(false);

  const [toast, setToast] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'info', title: string, message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ isOpen: true, type, title, message });
    setTimeout(() => setToast(null), 12000); 
  };

  useEffect(() => {
    fetchProyectos();
  }, [user]);

  const fetchProyectos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setProyectos(data || []);
    } catch (error) {
      showToast('error', 'Error de conexión', 'No se pudieron cargar tus proyectos.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFileName = (project: any) => {
    const data = project.project_data || {};
    const items = project.planned_items || [];
    const trimestre = data.trimestre || "TRIMESTRE";
    const periodo = `${(data.fechaInicio || 'INICIO').replace(/\//g, '-')}_AL_${(data.fechaFin || 'FIN').replace(/\//g, '-')}`;
    const maestro = data.maestro || "DOCENTE";
    const disciplina = items.length > 0 ? items[0].disciplina : "GENERAL";
    const grado = data.grado || "1"; 
    const clean = (str: string) => str.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\-]/g, '');
    return `${clean(trimestre)}-${clean(periodo)}-${clean(maestro)}-${clean(disciplina)}-${clean(grado)}.docx`.toUpperCase();
  };

  const generateDefaultEvaluationData = (project: any) => {
    const pdas = project.planned_items?.filter((i: any) => i.type === 'pda').map((i: any) => i.text) || [];
    return {
      herramientas: project.project_data?.herramientas || [],
      cotejo: pdas.map((pda: string) => `Logra identificar conceptos sobre: ${pda}`),
      rubrica: [], rubricaHeaders: ["Sobresaliente", "Satisfactorio", "Suficiente", "Requiere Apoyo"],
      observacion: [], escala: [], cuestionario: "", examen: "", retroalimentacion: ""
    };
  };

  const handleDownloadWord = async () => {
    if (!shareProject) return;
    showToast('info', 'Generando Documento', 'Iniciando descarga del archivo de Word...');
    try {
      const evaluationData = generateDefaultEvaluationData(shareProject);
      const wordBlob = await exportToWord(
        shareProject.project_data, 
        shareProject.planned_items, 
        shareProject.actividades, 
        evaluationData
      );
      const fileName = getFileName(shareProject);
      saveAs(wordBlob, fileName);
    } catch (e) {
      showToast('error', 'Error de Exportación', 'No se pudo generar el documento de Word.');
    }
  };

  const loginToDrive = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    prompt: 'consent',
    onSuccess: async (tokenResponse) => {
      if (!shareProject) return;
      setIsSendingDrive(true);
      try {
        const accessToken = tokenResponse.access_token;
        const evaluationData = generateDefaultEvaluationData(shareProject);
        const wordBlob = await exportToWord(shareProject.project_data, shareProject.planned_items, shareProject.actividades, evaluationData);
        const fileName = getFileName(shareProject);
        const metadataResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fileName, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        });
        const file = await metadataResponse.json();
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          body: wordBlob,
        });
        if (driveEmail) {
          await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'user', role: 'reader', emailAddress: driveEmail }),
          });
          showToast('success', 'Entregado por Drive', `Compartido con ${driveEmail}.`);
        } else {
          showToast('success', 'Guardado en Drive', `Subido a tu Google Drive.`);
        }
      } catch (error) {
        showToast('error', 'Fallo en Google Drive', 'Error al procesar el envío.');
      } finally {
        setIsSendingDrive(false);
      }
    }
  });

  const handleSendToDrive = () => {
    if (!driveEmail) {
      showToast('info', 'Falta el Correo', 'Ingresa un correo de destino de Google Drive.');
      return;
    }
    loginToDrive();
  };

  const handleDuplicate = async (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    setIsProcessing(project.id);
    try {
      const newProject = {
        user_id: user.id,
        nombre_proyecto: `${project.nombre_proyecto} (Copia)`,
        project_data: { ...project.project_data, proyecto: `${project.project_data?.proyecto || 'Proyecto'} (Copia)` },
        planned_items: project.planned_items, actividades: project.actividades, recursos: project.recursos
      };
      const { error } = await supabase.from('proyectos').insert([newProject]);
      if (error) throw error;
      await fetchProyectos();
      showToast('success', 'Proyecto Duplicado', 'Se ha creado una copia en tu bóveda.');
    } catch (error) { showToast('error', 'Error', 'Hubo un error al duplicar.'); }
    finally { setIsProcessing(null); }
  };

  const handleDeleteRequest = (e: React.MouseEvent, id: string, nombre: string) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Planeación',
      message: `¿Estás seguro de eliminar permanentemente "${nombre}"?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsProcessing(id);
        try {
          await supabase.from('proyectos').delete().eq('id', id);
          setProyectos(proyectos.filter(p => p.id !== id));
          showToast('success', 'Eliminado', 'La planeación ha sido borrada.');
        } catch (e) { showToast('error', 'Error', 'No se pudo eliminar.'); }
        finally { setIsProcessing(null); }
      }
    });
  };

  const handleCopyLink = () => {
    if (!shareProject) return;
    const link = `https://app.planeadornem.mx/v/${shareProject.id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    if (!shareProject) return;
    const link = `https://app.planeadornem.mx/v/${shareProject.id}`;
    const message = `Hola, le comparto mi planeación: ${shareProject.nombre_proyecto}. Puede revisarla aquí: ${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  const proyectosFiltrados = proyectos.filter(p => {
    const data = p.project_data || {};
    const coincideTexto = p.nombre_proyecto?.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideTrimestre = filtroTrimestre === 'Todos' || data.trimestre === filtroTrimestre;
    const coincideCiclo = filtroCiclo === 'Todos' || (data.cicloEscolar || '2025-2026') === filtroCiclo;
    return coincideTexto && coincideTrimestre && coincideCiclo;
  });

  const totalProyectos = proyectosFiltrados.length;
  const totalContenidos = proyectosFiltrados.reduce((acc, p) => acc + (p.planned_items?.filter((i: any) => i.type === 'content').length || 0), 0);
  const totalPDAs = proyectosFiltrados.reduce((acc, p) => acc + (p.planned_items?.filter((i: any) => i.type === 'pda').length || 0), 0);

  const btnGlossy = "relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 transition-all active:scale-95 after:absolute after:top-0 after:-left-[100%] hover:after:left-[200%] after:w-[50%] after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:skew-x-[-20deg] after:transition-all after:duration-[1500ms] after:ease-out";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#135bec]/20 relative overflow-hidden">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-[#135bec] p-2 rounded-xl text-white shadow-md"><Layers size={22} /></div>
          
          <div className="flex flex-col justify-center">
            <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 leading-none mb-1">Bóveda de Planeaciones</h1>
            <div className="flex items-center gap-2">
              {isPremium ? (
                <div className="flex items-center gap-1.5 w-fit px-2 py-0.5 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-full shadow-sm">
                   <Sparkles size={10} className="text-amber-500" />
                   <span className="text-[9px] font-black text-amber-700 tracking-widest uppercase">CUENTA PREMIUM ACTIVA</span>
                </div>
              ) : (
                <div onClick={onPremiumClick} className="flex items-center gap-1.5 w-fit px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full shadow-sm cursor-pointer hover:bg-slate-200 transition-colors">
                   <Lock size={10} className="text-slate-500" />
                   <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">VERSIÓN GRATUITA</span>
                 </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={onCreateNew} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border border-transparent ${btnGlossy}`}>
            <Plus size={18} /> <span className="hidden sm:inline text-sm font-bold tracking-wide">Nueva Planeación</span>
          </button>

          <div className="relative user-menu-container">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <UserCircle size={24} className="text-slate-500 group-hover:text-[#135bec] transition-colors" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
            </button>
            
            {showUserMenu && (
              <div className="absolute top-14 right-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                   <div className="bg-[#135bec]/10 p-2 rounded-xl text-[#135bec]"><UserCircle size={28} /></div>
                   <div className="overflow-hidden">
                     <p className="text-xs font-bold text-slate-900 truncate">{user.email}</p>
                     {/* 🛡️ EL TEXTO AHORA ES DINÁMICO Y SE ADAPTA A LA BASE DE DATOS */}
                     <p className={`text-[10px] font-bold ${isPremium ? 'text-amber-500' : 'text-slate-500'}`}>
                       {isPremium ? 'Cuenta Premium' : 'Versión Gratuita'}
                     </p>
                   </div>
                </div>

                {user.email === 'geomaster9@gmail.com' && (
                  <button onClick={() => { setShowAdminPanel(true); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-amber-50 hover:border-amber-200 transition-colors group mb-2">
                    <Shield size={16} className="text-slate-400 group-hover:text-amber-500" />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-amber-600">Panel de Administración</span>
                  </button>
                )}

                <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-rose-50 transition-colors group">
                  <LogOut size={16} className="text-slate-500 group-hover:text-rose-600" />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-rose-600">Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2"><BarChart3 className="text-[#135bec]" size={18}/> Impacto del Ciclo Escolar</h2>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              <Calendar size={14} className="text-slate-400" />
              <select value={filtroCiclo} onChange={(e) => setFiltroCiclo(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer">
                <option value="Todos">Todos los ciclos</option>
                <option value="2025-2026">Ciclo 2025-2026</option>
                <option value="2026-2027">Ciclo 2026-2027</option>
                <option value="2027-2028">Ciclo 2027-2028</option>
                <option value="2028-2029">Ciclo 2028-2029</option>
                <option value="2029-2030">Ciclo 2029-2030</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><FileText size={24} className="text-[#135bec]" /></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proyectos</p><h3 className="text-3xl font-black text-slate-800">{totalProyectos}</h3></div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><BookOpen size={24} className="text-emerald-600" /></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contenidos</p><h3 className="text-3xl font-black text-slate-800">{totalContenidos}</h3></div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center shrink-0"><Target size={24} className="text-amber-600" /></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDAs</p><h3 className="text-3xl font-black text-slate-800">{totalPDAs}</h3></div>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full lg:max-w-md group">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-[#135bec]/10 text-sm font-medium" />
          </div>
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-50 text-[#135bec]' : 'text-slate-400'}`}><LayoutGrid size={16}/></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-50 text-[#135bec]' : 'text-slate-400'}`}><List size={16}/></button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {proyectosFiltrados.map((proyecto) => (
              <div key={proyecto.id} onClick={() => onSelectProject(proyecto)} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#135bec]/40 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${proyecto.project_data?.trimestre === 'Primer Trimestre' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{proyecto.project_data?.trimestre || 'S/T'}</span>
                  <span className="text-[10px] font-bold text-slate-400"><Clock size={10} className="inline mr-1"/>{new Date(proyecto.updated_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-base font-black text-slate-800 leading-tight mb-3 group-hover:text-[#135bec] transition-colors">{proyecto.nombre_proyecto || 'Sin título'}</h3>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                  <button onClick={(e) => { e.stopPropagation(); onSelectProject(proyecto); }} className="flex-1 bg-slate-50 hover:bg-[#135bec] hover:text-white text-[#135bec] rounded-xl text-xs font-bold py-2 transition-all">Abrir</button>
                  <button onClick={(e) => { e.stopPropagation(); setShareProject(proyecto); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Share2 size={16}/></button>
                  <button onClick={(e) => handleDuplicate(e, proyecto)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Copy size={16}/></button>
                  <button onClick={(e) => handleDeleteRequest(e, proyecto.id, proyecto.nombre_proyecto)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                <tr><th className="px-6 py-4">Proyecto</th><th className="px-6 py-4">Trimestre</th><th className="px-6 py-4 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proyectosFiltrados.map((p) => (
                  <tr key={p.id} onClick={() => onSelectProject(p)} className="hover:bg-blue-50/30 cursor-pointer group">
                    <td className="px-6 py-4 font-bold text-sm text-slate-800">{p.nombre_proyecto}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{p.project_data?.trimestre}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setShareProject(p); }} className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg"><Share2 size={16}/></button>
                        <button onClick={(e) => handleDeleteRequest(e, p.id, p.nombre_proyecto)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {shareProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShareProject(null)}></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl p-8 border border-slate-100 z-10 animate-in zoom-in-95 duration-300">
            <button onClick={() => setShareProject(null)} className="absolute top-5 right-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0"><Share2 size={24} /></div>
              <div className="overflow-hidden">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">Entregar Planeación</h2>
                <p className="text-sm text-slate-500 font-medium truncate">{getFileName(shareProject)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-3"><FileText size={20} className="text-slate-500"/><h3 className="font-bold">Archivo Local</h3></div>
                <button onClick={handleDownloadWord} className="mt-auto w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2"><Download size={16}/> Descargar .DOCX</button>
              </div>

              <div className="bg-emerald-50/50 border-2 border-emerald-200 rounded-2xl p-5 flex flex-col relative overflow-hidden group hover:border-emerald-300 transition-colors">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm"><Sparkles size={10} /> Pro</div>
                <div className="flex items-center gap-2 mb-3 mt-1"><HardDrive size={20} className="text-emerald-600"/><h3 className="font-bold">Subir a Drive</h3></div>
                <input type="email" placeholder="Correo coordinador..." value={driveEmail} onChange={(e) => setDriveEmail(e.target.value)} className="bg-white border border-slate-200 text-xs w-full px-3 py-2 rounded-xl mb-3 outline-none focus:border-emerald-500 transition-all shadow-inner" />
                <button 
                  onClick={!isPremium && onPremiumClick ? onPremiumClick : handleSendToDrive}
                  disabled={isSendingDrive}
                  className={`mt-auto w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md ${isPremium ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200" : "bg-slate-200 text-slate-500"}`}
                >
                  {isSendingDrive ? <span className="animate-pulse">Enviando...</span> : <><UploadCloud size={16} /> Enviar a Drive Ahora</>}
                </button>
              </div>

              <div className="bg-blue-50/50 border-2 border-[#135bec]/30 rounded-2xl p-5 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-[#135bec] text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm"><Sparkles size={10} /> Pro</div>
                <div className="flex items-center gap-2 mb-3 mt-1"><LinkIcon size={20} className="text-[#135bec]"/><h3 className="font-bold">Enlace en Vivo</h3></div>
                <div className="bg-white border border-slate-200 p-1.5 rounded-xl shadow-inner mb-3 flex items-center gap-2 overflow-hidden">
                   <input type="text" readOnly value={`https://app.planeadornem.mx/v/${shareProject.id}`} className="bg-transparent text-[10px] text-slate-500 font-medium w-full px-1 outline-none truncate" />
                   <button onClick={handleCopyLink} className={`px-2 py-1 rounded-lg text-[9px] font-bold text-white transition-all shrink-0 ${linkCopied ? 'bg-emerald-500' : 'bg-[#135bec]'}`}>{linkCopied ? 'Listo' : 'Copiar'}</button>
                </div>
                <button onClick={handleWhatsAppShare} className="mt-auto w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all">
                  <MessageCircle size={14} /> Enviar por WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] max-w-sm w-full p-4 rounded-2xl shadow-xl border flex gap-4 animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
          <div className="shrink-0 mt-0.5">{toast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-500" /> : toast.type === 'error' ? <AlertTriangle size={20} className="text-rose-500" /> : <Info size={20} className="text-blue-500" />}</div>
          <div className="flex-1"><h4 className="text-sm font-bold mb-1">{toast.title}</h4><p className="text-xs font-medium opacity-90 leading-relaxed">{toast.message}</p></div>
          <button onClick={() => setToast(null)} className="shrink-0 opacity-50"><X size={16} /></button>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmDialog(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 mx-auto"><AlertTriangle size={24} /></div>
            <h3 className="text-lg font-black text-slate-900 mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">{confirmDialog.message}</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setConfirmDialog(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
              <button onClick={confirmDialog.onConfirm} className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all active:scale-95">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </div>
  );
};