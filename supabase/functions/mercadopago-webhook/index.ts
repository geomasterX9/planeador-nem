import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// 🛡️ Cabeceras CORS necesarias para que Mercado Pago y Supabase se entiendan
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 1. Responder a peticiones OPTIONS (CORS Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 2. Solo aceptar POST (Mercado Pago envía notificaciones por POST)
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    // Variables de entorno
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN') || '';
    const supabaseUrl = Deno.env.get('MY_SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('MY_SUPABASE_SERVICE_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Obtener el ID del pago
    // Mercado Pago lo envía de dos formas: por URL params o en el cuerpo JSON
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    
    const id = url.searchParams.get("data.id") || url.searchParams.get("id") || body.data?.id || body.id;
    const type = url.searchParams.get("type") || body.type;

    console.log(`Evento recibido: Tipo=${type}, ID=${id}`);

    // Solo procesamos si es un pago (payment)
    if (id && (type === "payment" || type === "payment.updated")) {
      
      // 4. Consultar el estado real en Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`
        }
      });

      if (!mpResponse.ok) {
        throw new Error(`Error al consultar MP: ${mpResponse.statusText}`);
      }

      const paymentData = await mpResponse.json();
      console.log(`Estado del pago ${id}: ${paymentData.status}`);

      // 5. Si está APROBADO, actualizamos Supabase
      if (paymentData.status === 'approved') {
        const userEmail = paymentData.external_reference; 

        if (userEmail) {
          console.log(`Activando Premium para: ${userEmail}`);

          const { error: updateError } = await supabase
            .from('usuarios_premium')
            .update({ is_premium: true })
            .eq('email', userEmail);

          if (updateError) throw updateError;
          console.log('¡Base de datos actualizada con éxito!');
        } else {
          console.warn('El pago no incluye external_reference (email).');
        }
      }
    }

    // Responder 200 OK a Mercado Pago para que deje de enviar la notificación
    return new Response(JSON.stringify({ received: true }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    });

  } catch (error) {
    console.error('Error procesando Webhook:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 // Enviamos 200 aunque falle para que MP no reintente infinitamente si es un error de código
    });
  }
})