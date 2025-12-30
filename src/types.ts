// src/types.ts
export type Role = 'admin' | 'reservas' | 'delivery' | 'cocina' | null;

export interface User {
  username: string;
  role: Role;
  name: string;
  id?: string; 
  auth_id?: string; 
  estado?: string; 
  empleado_id?: string; 
}

export interface Reclamacion{
  id: string;
  fecha: string;
  cliente_nombre: string;
  cliente_dni: string;
  cliente_direccion: string;
  cliente_telefono: string;
  cliente_email: string;
  tipo_bien: 'producto' | 'servicio';
  monto_reclamado?: number;
  descripcion_bien: string;
  tipo: 'reclamacion' | 'queja';
  detalle: string;
  pedido_consumidor: string;
  estado: 'pendiente' | 'en_proceso' | 'resuelto';
  respuesta_empresa?: string;
}

export interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'Regional' | 'Pescado' | 'Casa';
  image: string;
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  status: 'Activo' | 'Vacaciones';
}

export interface Reservation {
  id: number;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  status: 'Confirmada' | 'Pendiente' | 'Cancelada' | 'No asistió';
  tableId?: number;
}

export interface DeliveryOrder {
  id: string;
  customerName: string;
  address: string;
  dish: string;
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Yape/Plin';
  status: 'Pendiente' | 'En proceso' | 'En camino' | 'Entregado';
  total: number;
}

export interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
}

export interface Log {
  id: number;
  action: string;
  user: string;
  time: string;
}

// Tipos básicos para la base de datos
export interface EmpleadoDB {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'reservas' | 'delivery' | 'cocina';
  estado: 'activo' | 'inactivo' | 'vacaciones';
  auth_id: string | null;
  created_at: string;
}

export interface Empleado {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: 'admin' | 'reservas' | 'delivery' | 'cocina';
  estado: 'activo' | 'inactivo' | 'vacaciones';
  auth_id?: string;
  created_at: string;
}

export interface NuevoEmpleado {
  nombre: string;
  email: string;
  telefono: string;
  rol: 'reservas' | 'delivery' | 'cocina';
  password: string;
}
export interface ValidationErrors {
  nombre?: string;
  email?: string;
  telefono?: string;
  password?: string;
  rol?: string;
  nuevaContrasena?: string;    
  confirmarContrasena?: string; 
}

export interface ActualizarContrasenaData {
  auth_id: string;
  nuevaContrasena: string;
  confirmarContrasena: string;
}

export interface Auditoria {
  id: string;
  empleado_id: string;
  accion: string;
  tabla_afectada: string;
  registro_id?: string;
  detalles?: any;
  created_at: string;
  empleado_nombre?: string;
  empleado_rol?: string;
  tipo?: 'manual' | 'automático';
}


export interface PedidoItem {
  item: string;
  cantidad: number;
  precio: number;
}

export interface Pedido {
  id: string;
  cliente_nombre: string;
  direccion: string;
  telefono: string;
  referencia?: string; 
  detalles_pedido: PedidoItem[] | any; 
  total: number;
  estado: 'pendiente' | 'en_preparacion' | 'listo_para_reparto' | 'en_camino' | 'entregado' | 'cancelado';
  empleado_id: string; 
  repartidor_id?: string; 
  notas?: string;
  metodo_pago: 'efectivo' | 'yape' | 'plin' | 'transferencia';
  prioridad: 1 | 2 | 3; 
  tiempo_estimado?: number; 
  pagado: boolean;
  created_at: string;
  updated_at: string;
  hora_entrega?: string; 
  hora_salida_real?: string; 
  hora_entrega_real?: string; 
  
  empleados?: { nombre: string };
  repartidores?: { nombre: string };
}

export interface NuevoPedido {
  cliente_nombre: string;
  direccion: string;
  telefono: string;
  detalles_pedido: PedidoItem[];
  total: number;
  notas?: string;
  metodo_pago: 'efectivo' | 'yape' | 'plin' | 'transferencia';
  repartidor_id?: string;
  prioridad?: 1 | 2 | 3;
  tiempo_estimado?: number;
}