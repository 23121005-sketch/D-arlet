
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getEmpleadoData = async (identifier: string, isId: boolean = false) => {
    try {
      const query = supabase
        .from('empleados')
        .select('id, nombre, rol, estado, auth_id, email');
      
      if (isId) {
        query.eq('id', identifier);
      } else {
        query.eq('email', identifier);
      }

      const { data, error } = await query.single();
      if (error) return null;
      return data;
    } catch (e) {
      console.error("Error fetching empleado:", e);
      return null;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUserStr = localStorage.getItem('arlet_user');
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (userData: User) => {
    // Normalizar rol inmediatamente
    const normalizedRole = (userData.role || 'admin').toLowerCase().trim() as Role;
    const finalUser = { ...userData, role: normalizedRole };

    // Guardar en localStorage antes de actualizar estado para que ProtectedRoute lo vea
    localStorage.setItem('arlet_user', JSON.stringify(finalUser));
    setUser(finalUser);
    
    // Pequeña espera para asegurar ciclo de renderizado
    // Use await instead of return to satisfy the Promise<void> return type
    await new Promise(resolve => setTimeout(resolve, 150));
  };

  const logout = async () => {
    try {
        if (user?.id) {
             await supabase.from('auditoria').insert({
                empleado_id: user.id,
                accion: 'CIERRE_SESION',
                tabla_afectada: 'empleados',
                detalles: { mensaje: `Logout de ${user.name}` },
                tipo: 'automático'
            });
        }
        await supabase.auth.signOut();
    } catch (e) { console.error(e); }
    setUser(null);
    localStorage.removeItem('arlet_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
