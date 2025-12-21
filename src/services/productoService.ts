import { supabase } from '../supabaseClient';

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: 'plato_principal' | 'entrada' | 'postre' | 'bebida' | 'extra';
  precio: number;
  disponible: boolean;
  imagen_url?: string;
}

export const productoService = {
  // Obtener todos los productos disponibles
  async getProductosDisponibles(): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('disponible', true)
      .order('categoria')
      .order('nombre');
    
    if (error) throw error;
    return data || [];
  },

  // Obtener productos por categoría
  async getProductosPorCategoria(categoria: string): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('categoria', categoria)
      .eq('disponible', true)
      .order('nombre');
    
    if (error) throw error;
    return data || [];
  },

  // Buscar productos por nombre
  async buscarProductos(termino: string): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .ilike('nombre', `%${termino}%`)
      .eq('disponible', true)
      .limit(10);
    
    if (error) throw error;
    return data || [];
  }
};