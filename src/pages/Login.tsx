import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authService';
import { supabase } from '../supabaseClient';
import { Lock, Clock } from 'lucide-react';
////////datos de login y seguridad
export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [loading, setLoading] = useState(false);
////////////
  const navigate = useNavigate();
  const { login } = useAuth();
///////
  // Configuración de Bloqueo
  const MAX_INTENTOS = 3;
  const GET_TIEMPO_BLOQUEO = (intentos: number) => {
    if (intentos < 3) return 0;
    // 3 minutos base + 2 minutos adicionales por cada fallo extra
    return (3 + (intentos - 3) * 2) * 60 * 1000;
  };
/////////
  useEffect(() => {
    let intervalo: any;
    if (bloqueado && tiempoRestante > 0) {
      intervalo = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1000) {
            clearInterval(intervalo);
            setBloqueado(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [bloqueado, tiempoRestante]);

  useEffect(() => {
    const storedIntentos = localStorage.getItem('login_intentos_fallidos');
    const storedBloqueo = localStorage.getItem('login_bloqueado_hasta');
    
    if (storedIntentos) {
      const intentos = parseInt(storedIntentos);
      setIntentosFallidos(intentos);
      
      if (intentos >= MAX_INTENTOS && storedBloqueo) {
        const bloqueoHasta = parseInt(storedBloqueo);
        const ahora = Date.now();
        if (bloqueoHasta > ahora) {
          setBloqueado(true);
          setTiempoRestante(bloqueoHasta - ahora);
        } else {
          localStorage.removeItem('login_intentos_fallidos');
          localStorage.removeItem('login_bloqueado_hasta');
          setIntentosFallidos(0);
        }
      }
    }
  }, []);

  const formatTiempoRestante = (ms: number) => {
    const minutos = Math.floor(ms / 60000);
    const segundos = Math.floor((ms % 60000) / 1000);
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  };

  const incrementarIntentosFallidos = () => {
    const nuevosIntentos = intentosFallidos + 1;
    setIntentosFallidos(nuevosIntentos);
    localStorage.setItem('login_intentos_fallidos', nuevosIntentos.toString());

    if (nuevosIntentos >= MAX_INTENTOS) {
      const msBloqueo = GET_TIEMPO_BLOQUEO(nuevosIntentos);
      const bloqueoHasta = Date.now() + msBloqueo;
      setBloqueado(true);
      setTiempoRestante(msBloqueo);
      localStorage.setItem('login_bloqueado_hasta', bloqueoHasta.toString());
    }
  };

  const resetearIntentosFallidos = () => {
    setIntentosFallidos(0);
    localStorage.removeItem('login_intentos_fallidos');
    localStorage.removeItem('login_bloqueado_hasta');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (bloqueado) {
      setError(`Sistema bloqueado. Espera ${formatTiempoRestante(tiempoRestante)}`);
      setLoading(false);
      return;
    }
////////
    try {
      const { data: empleado, error: empleadoError } = await supabase
        .from('empleados')
        .select('*')
        .eq('email', username.toLowerCase().trim())
        .single();

      if (empleadoError || !empleado || empleado.estado !== 'activo') {
        incrementarIntentosFallidos();
        setError(empleado?.estado !== 'activo' && empleado ? 'Cuenta inactiva' : 'Credenciales incorrectas');
        setLoading(false);
        return;
      }
////////////
      let loginExitoso = false;
      const passwordEnBase64 = btoa(password);
      
      if (empleado.auth_id) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: username.toLowerCase().trim(),
          password: password
        });
        if (!authError && authData.user) loginExitoso = true;
      } else if (empleado.contrasena_hash === passwordEnBase64) {
        loginExitoso = true;
      }

      if (loginExitoso) {
        resetearIntentosFallidos();
        const rolNormalizado = empleado.rol.toLowerCase().trim();
        const userData = {
          username: empleado.email,
          role: rolNormalizado, 
          name: empleado.nombre,
          id: empleado.id
        };

        // Esperar a que el servicio actualice el estado global antes de navegar
        await login(userData);
////////
        switch (rolNormalizado) {
          case 'admin': navigate('/admin'); break;
          case 'reservas': navigate('/reservas'); break;
          case 'delivery': navigate('/delivery'); break;
          case 'cocina': navigate('/cocina-panel'); break;
          default: setError('Rol no válido');
        }//////////////////
      } else {
        incrementarIntentosFallidos();
        setError('Contraseña incorrecta');
        setLoading(false);
      }
    } catch (err) {
      incrementarIntentosFallidos();
      setError('Error en el servidor');
      setLoading(false);
    }
  };
//////////////
  if (bloqueado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <Lock size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Temporalmente Bloqueado</h2>
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <span className="text-3xl font-bold text-red-600">{formatTiempoRestante(tiempoRestante)}</span>
          </div>
          <p className="text-sm text-gray-500 italic">Por seguridad, el tiempo de espera aumenta tras varios fallos.</p>
        </div>
      </div>
    );
  }
/////////////////
  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative z-10 bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-brand-dark mb-2">Arlet's Restaurant</h2>
          <p className="text-gray-400">Panel de Control Interno</p>
        </div>
        {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-6 text-sm rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="email" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-gold" placeholder="Correo electrónico" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-gold" placeholder="Contraseña" required />
          <button type="submit" className="w-full bg-brand-dark text-white font-bold py-3 rounded-lg hover:bg-black transition-all shadow-lg" disabled={loading}>
            {loading ? 'Cargando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};
