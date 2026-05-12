import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 1. Capa de Seguridad: Validamos que la petición venga exclusivamente del Cron de Vercel
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Acceso no autorizado' });
  }

  // 2. Inicializamos Supabase usando las variables que ya tienes en Vercel
  // Usa las variables de entorno correctas según tu proyecto (VITE_SUPABASE_URL o NEXT_PUBLIC_...)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ success: false, message: 'Faltan variables de entorno' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 3. Ejecutamos el Ping (Cambia 'users' por una tabla que exista en tu BD, ej. 'profiles')
    const { error } = await supabase.from('usuarios_premium').select('id').limit(1);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Base de datos activa ⚡' });
  } catch (error) {
    console.error('Error en el cron job:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}