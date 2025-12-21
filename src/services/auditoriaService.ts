import { supabase } from '../supabaseClient';
import type { Auditoria } from '../types';

export const auditoriaService = {
  // Obtener historial - versión simple
  async obtenerHistorial(limit: number = 10): Promise<Auditoria[]> {
    try {
      const { data, error } = await supabase
        .from('auditoria')
        .select(`
          id,
          accion,
          tabla_afectada,
          registro_id,
          detalles,
          created_at,
          empleado_id,
          empleados (nombre, rol)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error obteniendo historial:', error);
        return [];
      }
      
      return (data || []).map(item => ({
        id: item.id,
        empleado_id: item.empleado_id,
        accion: item.accion,
        tabla_afectada: item.tabla_afectada,
        registro_id: item.registro_id,
        detalles: item.detalles,
        created_at: item.created_at,
        empleado_nombre: item.empleados?.[0]?.nombre || 'Sistema',
        empleado_rol: item.empleados?.[0]?.rol || 'admin',
        tipo: item.accion.startsWith('MANUAL_') ? 'manual' : 'automático'
      }));
    } catch (error) {
      console.error('Error en obtenerHistorial:', error);
      return [];
    }
  },

  // Registrar acción - VERSIÓN MEJORADA (Captura Usuario)
  async registrarAccion(
    accion: string,
    tabla_afectada: string,
    registro_id?: string,
    detalles?: any
  ): Promise<boolean> {
    try {
      // 1. INTENTAR OBTENER EL USUARIO ACTUAL
      let actorId = null;
      try {
        const userStr = localStorage.getItem('arlet_user');
        if (userStr) {
           const user = JSON.parse(userStr);
           actorId = user.id || user.username; // Usar el ID real
        }
      } catch (e) {
        console.warn('No se pudo obtener usuario para auditoría:', e);
      }

      console.log('Registrando auditoría por:', actorId, { accion });
      
      const { error } = await supabase
        .from('auditoria')
        .insert({
          empleado_id: actorId, // Ahora SÍ enviamos el ID del que hace la acción
          accion: `MANUAL_${accion}`,
          tabla_afectada,
          registro_id,
          detalles: detalles || null
        });
      
      if (error) {
        console.error('Error en auditoría (intento 1):', error);
        // Si falla por foreign key (ej. usuario borrado), intentar sin ID
        const { error: error2 } = await supabase
          .from('auditoria')
          .insert({
            empleado_id: null,
            accion: `MANUAL_${accion}`,
            tabla_afectada,
            registro_id,
            detalles: detalles || null
          });
          
        if (error2) return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('Error fatal en auditoría:', error);
      return false;
    }
  },

  // Funciones específicas (todas devuelven boolean)
  async registrarCreacionEmpleado(empleado: any): Promise<boolean> {
    return this.registrarAccion(
      'CREAR_EMPLEADO',
      'empleados',
      empleado.id,
      { nuevo_empleado: empleado.nombre }
    );
  },

  async registrarActualizacionEmpleado(empleadoId: string, cambios: any): Promise<boolean> {
    return this.registrarAccion(
      'ACTUALIZAR_EMPLEADO',
      'empleados',
      empleadoId,
      { cambios }
    );
  },

  async registrarEliminacionEmpleado(empleadoId: string, empleadoInfo: any): Promise<boolean> {
    return this.registrarAccion(
      'ELIMINAR_EMPLEADO',
      'empleados',
      empleadoId,
      { empleado_eliminado: empleadoInfo.nombre }
    );
  },

  async registrarCambioContrasena(empleadoId: string, empleadoNombre: string): Promise<boolean> {
    return this.registrarAccion(
      'CAMBIAR_CONTRASEÑA',
      'empleados',
      empleadoId,
      { empleado: empleadoNombre }
    );
  },

  async registrarCambioEstado(empleadoId: string, nombre: string, estadoAnterior: string, estadoNuevo: string): Promise<boolean> {
    return this.registrarAccion(
      'CAMBIAR_ESTADO',
      'empleados',
      empleadoId,
      { 
        empleado: nombre,
        cambio: `${estadoAnterior} → ${estadoNuevo}`
      }
    );
  },

  // Obtener estadísticas simple
  async obtenerEstadisticas() {
    try {
      const { count, error } = await supabase
        .from('auditoria')
        .select('*', { count: 'exact', head: true });
      
      if (error) return null;
      
      return {
        total: count || 0,
        hoy: 0 // Por simplicidad
      };
    } catch (error) {
      return null;
    }
  }
};