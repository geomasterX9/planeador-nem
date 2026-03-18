export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // 1. Solo permitimos peticiones POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 2. Extraemos el prompt al estilo Edge (usando Web APIs)
    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Falta el prompt de instrucciones' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Tomamos la llave secreta
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Llave de API no configurada en el servidor' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Llamada a Google Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // 5. Devolvemos la respuesta limpia al frontend
    return new Response(JSON.stringify(data), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error en Edge Function:", error);
    return new Response(JSON.stringify({ error: 'Error interno al contactar a la Inteligencia Artificial' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}