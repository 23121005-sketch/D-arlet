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
////quienloguea///
const AuthContext = createContext<AuthContextType | undefined>(undefined);
//////
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper para obtener datos frescos del empleado
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
        /////////
        const storedUserStr = localStorage.getItem('arlet_user');
        
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
         ////////////// 
          // Verificar contra la base de datos si tiene ID de empleado
          if (storedUser.id || storedUser.username) {
             const identifier = storedUser.id || storedUser.username;
             const isId = !!storedUser.id;
             //////////
             const empleadoDB = await getEmpleadoData(identifier, isId);
             
             if (empleadoDB) {
                // Si está inactivo, cerrar sesión
                if (empleadoDB.estado === 'inactivo') {
                    alert('Tu cuenta ha sido desactivada. Contacta al administrador.');
                    await logout();
                    return;
                }
                /////////////
                // Normalizar rol (minúsculas y trim) para evitar conflictos
                const dbRole = (empleadoDB.rol || '').toLowerCase().trim();

                // Actualizar rol si cambió en la base de datos
                if (dbRole !== storedUser.role) {
                    console.log(`Actualizando rol de ${storedUser.role} a ${dbRole}`);
                    storedUser.role = dbRole;
                    storedUser.name = empleadoDB.nombre;
                    localStorage.setItem('arlet_user', JSON.stringify(storedUser));
                }
             }
          }
          
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
        localStorage.removeItem('arlet_user');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (userData: User) => {
    try {
      // 1. Intentar obtener datos reales del empleado desde Supabase
      // Usamos el username (email) para buscar
      const empleadoDB = await getEmpleadoData(userData.username);
      
      let finalUser: User;

      if (empleadoDB) {
        // Si existe en empleados, usamos SUS datos mandatorios
        if (empleadoDB.estado === 'inactivo') {
            throw new Error('Usuario inactivo');
        }

        // Asegurar formato correcto del rol
        const normalizedRole = (empleadoDB.rol || 'admin').toLowerCase().trim() as Role;

        finalUser = {
            id: empleadoDB.id,
            username: empleadoDB.email,
            name: empleadoDB.nombre,
            role: normalizedRole, // Rol normalizado
            auth_id: empleadoDB.auth_id
        };
///////
        try {
            await supabase.from('auditoria').insert({
                empleado_id: empleadoDB.id,
                accion: 'INICIO_SESION',
                tabla_afectada: 'empleados',
                detalles: { mensaje: `Login exitoso de ${empleadoDB.nombre}` },
                tipo: 'automático'
            });
        } catch (auditError) {
            console.warn('No se pudo registrar auditoría de login', auditError);
        }
////////////
      } else {
        
        finalUser = {
            ...userData,
            role: userData.role || 'admin' 
        };
      }

      setUser(finalUser);
      localStorage.setItem('arlet_user', JSON.stringify(finalUser));
      
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
        if (user?.id) {
            // Intento de auditoría logout
             await supabase.from('auditoria').insert({
                empleado_id: user.id,
                accion: 'CIERRE_SESION',
                tabla_afectada: 'empleados',
                detalles: { mensaje: `Logout de ${user.name}` },
                tipo: 'automático'
            });
        }
        await supabase.auth.signOut();
    } catch (e) {
        console.error(e);
    }
    
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