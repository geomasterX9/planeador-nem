import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Recibir datos del frontend
    const { email, userId, price } = await req.json()

    if (!email || !price) {
      throw new Error("Faltan datos obligatorios (email o precio)")
    }

    // 3. Configurar la preferencia de Mercado Pago
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
    
    const preference = {
      items: [
        {
          title: "Suscripción Plan NEM Pro",
          unit_price: Number(price),
          quantity: 1,
          currency_id: "MXN",
        },
      ],
      external_reference: email, // El Webhook usará esto para saber a quién activar
      back_urls: {
        success: "https://planeador-nem-pro.vercel.app",
        failure: "https://planeador-nem-pro.vercel.app",
        pending: "https://planeador-nem-pro.vercel.app",
      },
      auto_return: "approved", // Regresa automáticamente al sitio al aprobarse el pago
      notification_url: "https://yjgmlmrfvmztpncngsjq.supabase.co/functions/v1/mercadopago-webhook",
    }

    // 4. Llamar a la API de Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    })

    const data = await response.json()

    // 5. Devolver la URL de pago al frontend
    return new Response(
      JSON.stringify({ url: data.init_point }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})