
import { supabase } from '../supabaseClient';
import type { Pedido, NuevoPedido } from '../types';

export const pedidoService = {
  async crearPedido(pedido: NuevoPedido, empleadoId: string): Promise<Pedido> {
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        ...pedido,
        estado: 'pendiente',
        empleado_id: empleadoId,
        repartidor_id: pedido.repartidor_id || empleadoId, // Vinculación automática si no se asigna
        pagado: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAllPedidos(): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        empleados:empleado_id (nombre),
        repartidores:repartidor_id (nombre)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getPedidosPorEstado(estado: string): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, repartidores:repartidor_id(nombre)')
      .eq('estado', estado)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async cambiarEstadoPedido(pedidoId: string, nuevoEstado: string): Promise<void> {
    const updates: any = { 
      estado: nuevoEstado,
      updated_at: new Date().toISOString()
    };

    // Registro automático de tiempos según el estado
    if (nuevoEstado === 'en_camino') {
      updates.hora_salida_real = new Date().toISOString();
    } else if (nuevoEstado === 'entregado') {
      updates.hora_entrega_real = new Date().toISOString();
    }

    const { error } = await supabase
      .from('pedidos')
      .update(updates)
      .eq('id', pedidoId);
    
    if (error) throw error;
  },

  async getPedidosPorRepartidor(repartidorId: string): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, repartidores:repartidor_id(nombre)')
      .eq('repartidor_id', repartidorId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async cancelarPedido(pedidoId: string, motivo: string): Promise<void> {
    const { error } = await supabase
      .from('pedidos')
      .update({ 
        estado: 'cancelado',
        notas: motivo,
        updated_at: new Date().toISOString()
      })
      .eq('id', pedidoId);
    
    if (error) throw error;
  },

  async getEstadisticas(): Promise<any> {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    const { count: totalHoy } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioDia.toISOString());
    
    const { count: pendientes } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente');
    
    const { count: enCamino } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'en_camino');
    
    return {
      totalHoy: totalHoy || 0,
      pendientes: pendientes || 0,
      enCamino: enCamino || 0
    };
  }
};
