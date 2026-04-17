import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Shield, Search, Zap, CheckCircle2, X, Star, User, AlertTriangle } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel = ({ onClose }: AdminPanelProps) => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios_premium')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePremium = async (id: string, currentStatus: boolean) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('usuarios_premium')
        .update({ is_premium: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Actualizamos la lista local
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, is_premium: !currentStatus } : u));
    } catch (error) {
      console.error("Error actualizando status:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const updateChispas = async (id: string, nuevasChispas: number) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('usuarios_premium')
        .update({ chispas_gratuitas: nuevasChispas })
        .eq('id', id);
        
      if (error) throw error;
      
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, chispas_gratuitas: nuevasChispas } : u));
    } catch (error) {
      console.error("Error actualizando chispas:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 md:px-8 py-8">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full h-full max-w-5xl flex flex-col border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl border border-white/20"><Shield size={20} className="text-amber-400" /></div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Torre de Control</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestión de Suscripciones SaaS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por correo electrónico..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#135bec]/20 text-sm font-medium" 
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            Total Usuarios: {usuarios.length}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#135bec] rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-bold animate-pulse">Cargando base de datos...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-[10px] uppercase font-black text-slate-400 tracking-widest shadow-sm">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4 text-center">Estatus</th>
                  <th className="px-6 py-4 text-center">Chispas (⚡)</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${u.is_premium ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{u.email}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Registrado: {new Date(u.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.is_premium ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.is_premium ? <><Star size={10} /> Premium</> : 'Básico'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => updateChispas(u.id, Math.max(0, u.chispas_gratuitas - 5))}
                          disabled={processingId === u.id || u.is_premium}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold disabled:opacity-50"
                        >-</button>
                        <span className={`font-black text-sm w-8 text-center ${u.is_premium ? 'text-slate-300' : 'text-slate-700'}`}>
                          {u.is_premium ? '∞' : u.chispas_gratuitas}
                        </span>
                        <button 
                          onClick={() => updateChispas(u.id, u.chispas_gratuitas + 5)}
                          disabled={processingId === u.id || u.is_premium}
                          className="w-6 h-6 rounded-md bg-blue-50 hover:bg-blue-100 text-[#135bec] flex items-center justify-center font-bold disabled:opacity-50"
                        >+</button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => togglePremium(u.id, u.is_premium)}
                        disabled={processingId === u.id}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          processingId === u.id ? 'opacity-50 cursor-not-allowed' :
                          u.is_premium 
                            ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600' 
                            : 'bg-slate-900 text-white hover:bg-amber-500 shadow-md'
                        }`}
                      >
                        {processingId === u.id ? '...' : u.is_premium ? 'Revocar Premium' : 'Activar Premium'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};