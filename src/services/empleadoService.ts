import { supabase } from '../supabaseClient';
import { auditoriaService } from './auditoriaService';
import type { Empleado, NuevoEmpleado } from '../types';

export const empleadoService = {
  // Obtener todos los empleados
  async getEmpleados(): Promise<Empleado[]> {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching empleados:', error);
      throw error;
    }
    
    return data || [];
  },

  // NUEVO: Crear empleado SIN Authentication
  async crearEmpleadoSinAuth(empleado: NuevoEmpleado): Promise<Empleado> {
    try {
      console.log('Creando empleado SIN Authentication:', empleado);
      
      // Verificar que el email no exista
      const { data: existente } = await supabase
        .from('empleados')
        .select('id')
        .eq('email', empleado.email)
        .single();
      
      if (existente) {
        throw new Error('Ya existe un empleado con este email');
      }
      
      const contrasenaHash = btoa(empleado.password); // Simple base64
      
      const { data, error } = await supabase
        .from('empleados')
        .insert({
          nombre: empleado.nombre,
          email: empleado.email,
          telefono: empleado.telefono,
          rol: empleado.rol,
          estado: 'activo',
          contrasena_hash: contrasenaHash,
          auth_id: null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // REGISTRAR AUDITORÍA
      try {
        await auditoriaService.registrarCreacionEmpleado(data);
      } catch (auditError) {
        console.log('Auditoría no registrada, pero empleado creado');
      }

      alert(`EMPLEADO CREADO\n\n` +
            `• Nombre: ${empleado.nombre}\n` +
            `• Email: ${empleado.email}\n` +
            `• Contraseña: ${empleado.password}`);
      
      return data;
    } catch (error: any) {
      throw new Error(`Error al crear empleado: ${error.message}`);
    }
  },
  
  async actualizarContrasenaEmpleado(empleadoId: string, nuevaContrasena: string): Promise<void> {
    try {
      const contrasenaHash = btoa(nuevaContrasena);
      
      const { error } = await supabase
        .from('empleados')
        .update({ 
          contrasena_hash: contrasenaHash
        })
        .eq('id', empleadoId);
      
      if (error) throw error;

      //  REGISTRAR AUDITORÍA
      try {
        const { data: empleado } = await supabase
            .from('empleados')
            .select('nombre')
            .eq('id', empleadoId)
            .single();

        if (empleado) {
            await auditoriaService.registrarCambioContrasena(empleadoId, empleado.nombre);
        }
      } catch (auditError) {
        console.log('Auditoría no registrada, pero contraseña cambiada');
      }

    } catch (error: any) {
      throw new Error(`Error al actualizar contraseña: ${error.message}`);
    }
  },

  // NUEVO: Verificar login de empleado SIN auth
  async verificarLoginEmpleado(email: string, password: string): Promise<Empleado | null> {
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .eq('email', email)
        .eq('estado', 'activo')
        .single();
      
      if (error || !data) return null;
      
      // Solo para empleados SIN auth_id
      if (data.auth_id) return null;
      if (!data.contrasena_hash) return null;
      
      // Verificar contraseña
      const passwordValida = data.contrasena_hash === btoa(password);
      return passwordValida ? data : null;
    } catch (error) {
      console.error('Error en verificarLoginEmpleado:', error);
      return null;
    }
  },

  
  async updateEmpleado(id: string, updates: Partial<Empleado>): Promise<Empleado> {
    // Primero obtener info del empleado para auditoría si no viene en los updates
    const { data: infoPrevia } = await supabase
        .from('empleados')
        .select('nombre')
        .eq('id', id)
        .single();

    const { data, error } = await supabase
      .from('empleados')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // REGISTRAR AUDITORÍA
    try {
        await auditoriaService.registrarActualizacionEmpleado(id, {
            empleado: infoPrevia?.nombre || 'Desconocido',
            cambios: updates
        });
    } catch (auditError) {
        console.log('Auditoría no registrada, pero empleado actualizado');
    }
    return data;
  },

  // CORREGIDO: Eliminar empleado
  async deleteEmpleado(id: string): Promise<void> {
    // Primero obtener info del empleado para auditoría
    const { data: empleadoInfo } = await supabase
      .from('empleados')
      .select('nombre, email, rol')
      .eq('id', id)
      .single();
    
    const { error } = await supabase
      .from('empleados')
      .delete()
      .eq('id', id);
  
    if (error) throw error;

    //  REGISTRAR AUDITORÍA
    try {
        if (empleadoInfo) {
          // Se envía el objeto completo para tener contexto, pero el frontend está parcheado para manejarlo
          await auditoriaService.registrarEliminacionEmpleado(id, empleadoInfo);
        }
    } catch (auditError) {
        console.log('Auditoría no registrada, pero empleado eliminado');
    }
  },

  //  CORREGIDO: Función para actualizar contraseña CON auth (admin)
  async actualizarContrasena(auth_id: string, nuevaContrasena: string): Promise<void> {
    try {
      const module = await import('../supabaseClient');
      const supabaseAdmin = module.supabaseAdmin;
      
      if (!supabaseAdmin) {
        alert(` Nueva contraseña: ${nuevaContrasena}\n\nEntrégala manualmente.`);
        return;
      }

      // Obtener ID del empleado por auth_id para auditoría
      const { data: empleado } = await supabase
        .from('empleados')
        .select('id, nombre')
        .eq('auth_id', auth_id)
        .single();
      
      if (empleado) {
        await auditoriaService.registrarCambioContrasena(empleado.id, empleado.nombre);
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        auth_id,
        { password: nuevaContrasena }
      );
      
      if (error) throw error;
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(`Error técnico: ${errorMsg}`);
    }

  },

  // Mantener función createEmpleado para compatibilidad
  async createEmpleado(empleado: NuevoEmpleado): Promise<Empleado> {
    // Redirigir a la nueva función
    return this.crearEmpleadoSinAuth(empleado);
  }
};