import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Layers, AlertTriangle, ArrowLeft, Lock, Mail, Key, Sparkles } from 'lucide-react';

interface AuthSandboxProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const AuthSandbox = ({ onLoginSuccess, onCancel }: AuthSandboxProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // ✨ Nuevo estado

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Ocurrió un error al conectar con Google.');
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, ingresa tu correo y contraseña.");
      return;
    }
    
    // ✨ Validación Dummy-Friendly para el registro
    if (isSignUp && password !== confirmPassword) {
      setError("Las contraseñas no coinciden. Verifícalas por favor.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('Invalid login credentials')) msg = 'Correo o contraseña incorrectos.';
      if (msg.includes('User already registered')) msg = 'Este correo ya está registrado. Por favor, inicia sesión.';
      if (msg.includes('Password should be at least')) msg = 'La contraseña debe tener al menos 6 caracteres.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ✨ Función para limpiar campos al cambiar de modo
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  const btnGlossy = "relative overflow-hidden bg-white text-slate-700 border border-slate-200 shadow-md hover:shadow-lg hover:border-slate-300 transition-all active:scale-95";
  const btnPrimary = "relative overflow-hidden bg-gradient-to-r from-[#135bec] to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95 after:absolute after:top-0 after:-left-[100%] hover:after:left-[200%] after:w-[50%] after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:skew-x-[-20deg] after:transition-all after:duration-[1500ms] after:ease-out";

  return (
    <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white relative overflow-hidden animate-in zoom-in-95 duration-500 w-full max-w-md mx-auto">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <button onClick={onCancel} className="absolute top-6 left-6 p-2 text-slate-400 hover:text-[#135bec] hover:bg-blue-50 rounded-full transition-all">
        <ArrowLeft size={20} />
      </button>

      <div className="flex justify-center mb-6 mt-4">
        <div className="w-16 h-16 bg-[#135bec] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Layers size={32} className="text-white" />
        </div>
      </div>
      
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-2 tracking-tight">
        {isSignUp ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
      </h2>
      <p className="text-sm font-medium text-slate-500 text-center mb-8">Ingresa a tu entorno de trabajo docente seguro</p>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in fade-in duration-300">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-rose-700 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Botón de Google */}
      <button 
        onClick={handleGoogleLogin}
        disabled={isLoading}
        type="button"
        className={`w-full py-3.5 rounded-2xl text-sm font-black tracking-wide flex items-center justify-center gap-3 transition-all duration-300 mb-6 ${isLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-transparent shadow-none' : btnGlossy}`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Continuar con Google</span>
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-slate-100"></div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">O con tu correo</span>
        <div className="h-px flex-1 bg-slate-100"></div>
      </div>

      {/* Formulario Tradicional */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div className="relative group">
          <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-[#135bec] transition-colors" size={18} />
          <input 
            type="email" 
            placeholder="correo@ejemplo.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#135bec]/10 focus:border-[#135bec] outline-none transition-all text-slate-700 font-bold placeholder:text-slate-400 text-sm shadow-inner"
          />
        </div>
        
        <div className="relative group">
          <Key className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-[#135bec] transition-colors" size={18} />
          <input 
            type="password" 
            placeholder="Contraseña segura" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#135bec]/10 focus:border-[#135bec] outline-none transition-all text-slate-700 font-bold placeholder:text-slate-400 text-sm shadow-inner"
          />
        </div>

        {/* ✨ Cajita extra que aparece mágicamente con animación al registrarse */}
        {isSignUp && (
          <div className="relative group animate-in fade-in slide-in-from-top-2 duration-300">
            <Key className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-[#135bec] transition-colors" size={18} />
            <input 
              type="password" 
              placeholder="Confirma tu contraseña" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#135bec]/10 focus:border-[#135bec] outline-none transition-all text-slate-700 font-bold placeholder:text-slate-400 text-sm shadow-inner"
            />
          </div>
        )}

        <button 
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-2xl text-sm font-black tracking-wide flex items-center justify-center transition-all duration-300 mt-2 border border-transparent ${isLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : btnPrimary}`}
        >
          {isLoading ? 'Procesando...' : (isSignUp ? 'Crear mi cuenta' : 'Ingresar al Sistema')}
        </button>
      </form>

      {/* 🛡️ Bloque de Acción Secundaria: Optimizado para Usuarios Nuevos */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
        <p className="text-xs font-bold text-slate-500">
          {isSignUp ? '¿Ya eres parte de la comunidad?' : '¿Aún no tienes una cuenta?'}
        </p>
        
        <button 
          onClick={toggleMode}
          type="button"
          className="w-full py-4 rounded-2xl font-black text-sm text-[#135bec] bg-white border-2 border-blue-100 hover:border-[#135bec] hover:shadow-[0_10px_25px_-5px_rgba(19,91,236,0.15)] hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 group overflow-hidden relative"
        >
          {/* ✨ Efecto de brillo interior al pasar el mouse */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
          
          {isSignUp ? (
            'Inicia sesión aquí'
          ) : (
            <>
              <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-[#135bec] group-hover:text-white transition-colors">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <span className="relative z-10">Regístrate gratis ahora</span>
            </>
          )}
        </button>

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 opacity-70 mt-1">
          <Lock size={10} /> Acceso encriptado de extremo a extremo
        </p>
      </div>
    </div>
  );
};