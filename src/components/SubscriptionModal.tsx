import React, { useState } from 'react';
import { X, Check, CreditCard, Zap, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userId?: string;
}

// 💰 CONFIGURACIÓN DE PRECIO ÚNICA
const PREMIUM_PRICE = 500; // Cambia aquí para tu prueba de 10 o el real de 500
const ORIGINAL_PRICE = 700;

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!userEmail || !userId) {
      setError("Faltan datos del usuario.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Llamada a la Edge Function usando la variable PREMIUM_PRICE
      const { data, error: functionError } = await supabase.functions.invoke('mercadopago-checkout', {
        body: {
          email: userEmail,
          userId: userId,
          price: PREMIUM_PRICE // <-- Ya no es un número fijo, usa la variable de arriba
        }
      });

      if (functionError) throw new Error('No se pudo conectar con el servicio de pagos.');

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió la URL de pago.');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-y-auto relative animate-in fade-in zoom-in duration-300">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full z-10">
          <X size={20} />
        </button>

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Plan NEM Pro</h2>
              <p className="text-blue-600 font-semibold">Suscripción Anual</p>
            </div>
          </div>

          <div className="space-y-3 mb-6 text-sm text-slate-600">
            <div className="flex items-start gap-3"><Check size={18} className="text-green-600 mt-0.5" /> <p>Planeaciones ilimitadas con IA.</p></div>
            <div className="flex items-start gap-3"><Check size={18} className="text-green-600 mt-0.5" /> <p>Contenidos y PDAs contextualizados.</p></div>
            <div className="flex items-start gap-3"><Check size={18} className="text-green-600 mt-0.5" /> <p>Rúbricas y Listas de Cotejo instantáneas.</p></div>
            <div className="flex items-start gap-3"><Check size={18} className="text-green-600 mt-0.5" /> <p>Exportación a Word (Formato Oficial).</p></div>
          </div>

          {/* ✨ SECCIÓN DE PRECIO VISUAL ✨ */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 mb-6 text-center">
            <p className="text-xs text-blue-800 font-bold uppercase tracking-wider mb-1">Acceso Total por 1 Año</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-extrabold text-slate-900">${PREMIUM_PRICE}</span>
              <span className="text-slate-400 line-through text-sm font-medium">${ORIGINAL_PRICE}</span>
              <span className="text-lg font-bold text-slate-900">MXN</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 italic">Pago único, sin cargos automáticos recurrentes</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <CreditCard size={20} />
                <span>Suscribirme por ${PREMIUM_PRICE} MXN</span>
              </>
            )}
          </button>
          
          <button onClick={onClose} disabled={loading} className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium">
            Quizás más tarde
          </button>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-col items-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2">Pagos seguros vía Mercado Pago</span>
          <img src="/mp-oficial.png" alt="Mercado Pago" className="h-8 w-auto opacity-70" />
        </div>
      </div>
    </div>
  );
};

export { SubscriptionModal };