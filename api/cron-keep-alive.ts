import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 1. Capa de Seguridad con Espía (Console logs para depurar)
  const authHeader = req.headers.authorization;
  const mySecret = process.env.CRON_SECRET;

  // Imprimimos en los logs para ver qué está pasando exactamente
  console.log("Llave que envía Vercel:", authHeader);
  console.log("Llave guardada en .env:", mySecret);

  // Validamos si coinciden
  if (authHeader !== `Bearer ${mySecret}`) {
    return res.status(401).json({ 
      success: false, 
      message: 'Acceso no autorizado',
      motivo: 'Ver logs en Vercel para más detalles'
    });
  }

  // 2. Inicializamos Supabase usando las variables que ya tienes en Vercel
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ 
      success: false, 
      message: 'Faltan variables de entorno de Supabase' 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 3. Ejecutamos el Ping (Asegúrate de que la tabla 'users' o la que pongas aquí exista)
    const { error } = await supabase.from('users').select('id').limit(1);

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      message: 'Base de datos activa ⚡' 
    });
  } catch (error) {
    console.error('Error en el cron job:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}