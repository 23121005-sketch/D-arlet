import { createClient } from '@supabase/supabase-js';
// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY; // <- NOMBRE CORRECTO
console.log('=== Supabase Config ===');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? ' Presente' : ' Faltante');
console.log('Service Key:', supabaseServiceKey ? ' Presente' : ' Faltante');
// Validaciones básicas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(' ERROR: Faltan variables de entorno requeridas');
}
// Cliente normal (para operaciones públicas)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Cliente admin (para operaciones privilegiadas) - SOLO si existe service key
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
console.log('Clientes creados:', {
  supabase: !!supabase,
  supabaseAdmin: !!supabaseAdmin
});