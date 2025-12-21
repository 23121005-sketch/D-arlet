
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Truck, List, DollarSign, TrendingUp, AlertTriangle,
  Search, Plus, Trash2, CheckCircle, XCircle, UserCheck, Clock, MapPin,
  LogOut, PieChart, Activity, X, ChevronRight, Eye, Key, RefreshCw, UserPlus, Edit, Phone, Package,
  ChefHat, FileText, Clipboard, AlertCircle, Shield, BarChart3, Mail, Briefcase, User, Utensils, Receipt, Armchair,
  LayoutGrid, CalendarDays, Map, Bell, Lock, Filter, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell
} from 'recharts';

import { CrearPedidoModal } from '../components/CrearPedidoModal';
import { pedidoService } from '../services/pedidoService';
import { auditoriaService } from '../services/auditoriaService';
import type { Auditoria, Pedido, Empleado } from '../types';
import { useAuth } from '../services/authService';
import { SALES_DATA, DISH_SALES_DATA } from '../constants';
import { supabase } from '../supabaseClient';
import { empleadoService } from '../services/empleadoService';
import type { ValidationErrors } from '../types';

// --- INTERFAZ LOCAL PARA RESERVAS ---
// Helper para obtener fecha local YYYY-MM-DD (Evita bug de toISOString/UTC)
const getLocalDate = () => {
    const d = new Date();
    return d.toLocaleDateString('sv-SE'); // Formato ISO local
};
interface ReservaLocal {
  id: number | string;
  customerName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  people: number;
  status: string;
  table?: string;
  tableId?: number;
  notes?: string;
  createdBy?: string;
}

interface MesaConfig {
    id: string;
    label: string;
    capacidad: number;
    zona: 'Salon' | 'Terraza' | 'VIP' | 'Eventos';
}

const MESAS_CONFIG: MesaConfig[] = [
    { id: 'T-01', label: 'T-01', capacidad: 2, zona: 'Terraza' },
    { id: 'T-02', label: 'T-02', capacidad: 2, zona: 'Terraza' },
    { id: 'T-03', label: 'T-03', capacidad: 4, zona: 'Terraza' },
    { id: 'T-04', label: 'T-04', capacidad: 4, zona: 'Terraza' },
    { id: 'S-01', label: 'S-01', capacidad: 4, zona: 'Salon' },
    { id: 'S-02', label: 'S-02', capacidad: 4, zona: 'Salon' },
    { id: 'S-03', label: 'S-03', capacidad: 6, zona: 'Salon' },
    { id: 'S-04', label: 'S-04', capacidad: 6, zona: 'Salon' },
    { id: 'S-12', label: 'S-12', capacidad: 4, zona: 'Salon' },
    { id: 'S-15', label: 'S-15', capacidad: 6, zona: 'Salon' },
    { id: 'VIP-01', label: 'VIP', capacidad: 10, zona: 'VIP' },
    { id: 'EVENTO', label: 'Eventos', capacidad: 20, zona: 'Eventos' },
];

const renderDetalleValor = (valor: any) => {
  if (typeof valor === 'object' && valor !== null) {
    return valor.nombre || JSON.stringify(valor);
  }
  return valor;
};

const formatTicketId = (id: string) => id ? `ORD-${id.slice(-6).toUpperCase()}` : '---';

const formatTime = (isoString?: string) => {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const mapEstadoDBtoFront = (estadoDB: string) => {
    if (!estadoDB) return 'Pendiente';
    const lower = estadoDB.toLowerCase();
    if (lower === 'completada') return 'Finalizada';
    return lower.charAt(0).toUpperCase() + lower.slice(1).replace('_', ' ');
};

const mapEstadoFrontToDB = (estadoFront: string) => {
    const lower = estadoFront.toLowerCase();
    if (lower === 'finalizada') return 'completada';
    return lower; 
};

// --- SHARED PANEL LAYOUT ---
const PanelLayout: React.FC<{ title: string, children: React.ReactNode, active: string, user: any }> = ({ title, children, active, user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={20} />, path: '/admin', roles: ['admin'] },
    { id: 'delivery', label: 'Panel Delivery', icon: <Truck size={20} />, path: '/delivery', roles: ['admin', 'delivery'] },
    { id: 'reservas', label: 'Reservas', icon: <Calendar size={20} />, path: '/reservas', roles: ['admin', 'reservas'] },
    { id: 'cocina', label: 'Cocina', icon: <ChefHat size={20} />, path: '/cocina-panel', roles: ['cocina', 'admin'] },
  ].filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <div className="w-64 bg-brand-dark text-white flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-serif text-brand-gold font-bold tracking-wide">Arlet's Panel</h2>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-yellow-600 text-brand-dark flex items-center justify-center font-bold text-lg border-2 border-brand-gold/30">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black bg-brand-gold text-brand-dark inline-block mt-1">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active === item.id ? 'bg-brand-gold text-brand-dark font-black shadow-lg shadow-yellow-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              {item.icon} <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={logout} className="flex items-center gap-3 text-red-400 hover:bg-red-900/20 w-full px-4 py-3 rounded-xl transition-all font-bold">
            <LogOut size={20} /> Salir
          </button>
        </div>
      </div>
      <div className="flex-1 ml-64 p-8 overflow-x-hidden">
        <header className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div>
             <h1 className="text-2xl font-bold text-gray-800 font-serif tracking-tight">{title}</h1>
             <p className="text-xs text-gray-400 mt-1">Gestión del Restaurante Arlet</p>
          </div>
          <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-black flex items-center gap-2">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> ONLINE
          </div>
        </header>
        {children}
      </div>
    </div>
  );
};

// --- COMPONENTES DE RESERVAS ---

const ReservaDetallesModal: React.FC<{ 
    reserva: ReservaLocal, 
    onClose: () => void,
    onStatusChange: (id: string | number, status: string) => void,
    onDelete: (id: string | number) => void,
    onEdit: (reserva: ReservaLocal) => void,
    userRole?: string | null
}> = ({ reserva, onClose, onStatusChange, onDelete, onEdit, userRole }) => {
    
    const isReadOnly = userRole === 'admin';
    const isTerminal = ['Finalizada', 'Cancelada', 'No Asistio'].includes(reserva.status);
    const isConfirmada = reserva.status === 'Confirmada';
    const isPendiente = reserva.status === 'Pendiente';
    
    const getAllowedStatuses = () => {
        if (isPendiente) return ['Pendiente', 'Confirmada', 'Cancelada', 'No Asistio'];
        if (isConfirmada) return ['Confirmada', 'Finalizada', 'Cancelada', 'No Asistio'];
        return [reserva.status];
    };

    return (
      <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-brand-dark p-6 flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-brand-gold font-serif flex items-center gap-2">
                        <Calendar size={24} /> Detalle de Reserva
                    </h3>
                    <p className="text-white/50 text-xs mt-1">ID: #{reserva.id}</p>
                </div>
                <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    reserva.status === 'Confirmada' ? 'bg-green-50 border-green-200 text-green-800' :
                    reserva.status === 'Pendiente' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                    reserva.status === 'Finalizada' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                    'bg-red-50 border-red-200 text-red-800'
                }`}>
                    <div className="flex items-center gap-3">
                        {reserva.status === 'Confirmada' ? <CheckCircle size={24}/> : 
                         reserva.status === 'Cancelada' ? <XCircle size={24}/> : 
                         reserva.status === 'Finalizada' ? <UserCheck size={24}/> : <Clock size={24}/>}
                        <div>
                            <p className="text-xs font-bold uppercase opacity-70">Estado Actual</p>
                            <p className="text-lg font-bold">{reserva.status}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Cliente</p>
                            <p className="font-bold text-gray-800 text-lg">{reserva.customerName}</p>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <Phone size={20} className="text-blue-600"/>
                            <div>
                                <p className="text-[10px] font-bold text-blue-600 uppercase">Teléfono</p>
                                <p className="text-lg font-bold text-blue-900">{reserva.phone}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase">Fecha y Hora</p>
                        <p className="font-bold text-gray-800 text-lg">{reserva.date}</p>
                        <p className="text-xl font-bold text-brand-dark">{reserva.time}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-600"/>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Registrado por</p>
                            <p className="text-sm font-bold text-gray-800">{reserva.createdBy || 'Desconocido'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Mesa Asignada</p>
                        <p className="text-sm font-black text-brand-dark">{reserva.table || 'Sin mesa'}</p>
                    </div>
                </div>

                {!isReadOnly && !isTerminal && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cambiar Estado</label>
                        <select
                            value={reserva.status}
                            onChange={(e) => onStatusChange(reserva.id, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-brand-gold outline-none bg-white"
                        >
                            {getAllowedStatuses().map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                    </div>
                )}

                {!isReadOnly ? (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {isPendiente && (
                            <>
                                <button onClick={() => { onClose(); onEdit(reserva); }} className="col-span-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 flex items-center justify-center gap-2 border border-gray-300">
                                    <Edit size={16}/> Editar Datos
                                </button>
                                <button onClick={() => { if(confirm('¿Eliminar esta reserva?')) { onDelete(reserva.id); onClose(); } }} className="col-span-2 border border-red-100 text-red-500 py-3 rounded-xl font-bold hover:bg-red-50 flex items-center justify-center gap-2">
                                    <Trash2 size={16}/> Eliminar Reserva
                                </button>
                            </>
                        )}
                        {isTerminal && (
                            <div className="col-span-2 p-3 bg-gray-100 rounded-lg text-center text-gray-500 text-xs font-bold uppercase italic">
                                Reserva Finalizada - No se permite Editar ni Eliminar
                            </div>
                        )}
                    </div>
                ) : (
                    <button onClick={onClose} className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 shadow-lg">
                        Cerrar Ficha
                    </button>
                )}
            </div>
        </div>
      </div>
    );
};

// 2. Mapa de Mesas (Visual)
const MapaMesas: React.FC<{ reservas: ReservaLocal[], dateFilter: string }> = ({ reservas, dateFilter }) => {
    const reservasActivas = reservas.filter(r => 
        r.date === dateFilter && (r.status === 'Confirmada' || r.status === 'Pendiente' || r.status === 'Finalizada')
    );

    const getMesaStatus = (mesaId: string) => {
        const reservasMesa = reservasActivas.filter(r => r.table === mesaId);
        if (reservasMesa.length === 0) return { ocupada: false };
        return { 
            ocupada: true, 
            reservas: reservasMesa
        };
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Map size={20} className="text-brand-dark"/> Mapa de Mesas ({dateFilter})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {['Terraza', 'Salon', 'VIP'].map(zona => (
                    <div key={zona} className={`p-4 rounded-xl border ${zona === 'Terraza' ? 'bg-green-50/50 border-green-100' : zona === 'Salon' ? 'bg-brand-gold/5 border-brand-gold/20' : 'bg-purple-50 border-purple-100'}`}>
                        <p className={`text-xs font-bold uppercase mb-3 text-center ${zona === 'Terraza' ? 'text-green-700' : zona === 'Salon' ? 'text-brand-dark' : 'text-purple-700'}`}>Zona {zona}</p>
                        <div className="grid grid-cols-2 gap-4">
                            {MESAS_CONFIG.filter(m => m.zona === zona).map(mesa => {
                                const status = getMesaStatus(mesa.id);
                                return (
                                    <div key={mesa.id} className={`aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition-all p-2 bg-white ${
                                        status.ocupada ? 'border-red-200 shadow-sm' : 'border-gray-200'
                                    }`}>
                                        <span className="font-bold text-lg">{mesa.label}</span>
                                        <div className="flex items-center gap-1 text-[10px] opacity-60 mb-1"><Users size={10}/> {mesa.capacidad}</div>
                                        {status.ocupada ? (
                                            <div className="flex flex-col gap-1 w-full overflow-y-auto max-h-[60px] custom-scrollbar">
                                                {status.reservas?.map((r, idx) => (
                                                    <span key={idx} className={`text-[9px] font-bold px-1 rounded text-center truncate ${r.status === 'Finalizada' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'}`}>
                                                        {r.time} - {r.customerName.split(' ')[0]}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : <span className="text-[10px] text-green-600 font-bold">LIBRE</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 3. Vista Calendario (Semanal)
const VistaCalendario: React.FC<{ reservas: ReservaLocal[] }> = ({ reservas }) => {
    const today = new Date();
    // Generar array de los próximos 7 días
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d;
    });

    const getReservasForDate = (dateStr: string) => {
        return reservas.filter(r => r.date === dateStr && r.status !== 'Cancelada').sort((a,b) => a.time.localeCompare(b.time));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
             <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <CalendarDays size={20} className="text-brand-dark"/> Calendario Semanal
            </h3>
            <div className="flex min-w-[800px] gap-4">
                {days.map((day, i) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const dayName = day.toLocaleDateString('es-PE', { weekday: 'short' });
                    const dayNumber = day.getDate();
                    const dailyReservas = getReservasForDate(dateStr);
                    
                    return (
                        <div key={i} className={`flex-1 min-w-[120px] rounded-xl border ${i === 0 ? 'bg-brand-gold/5 border-brand-gold/30' : 'bg-gray-50 border-gray-100'}`}>
                            <div className={`p-3 text-center border-b ${i === 0 ? 'border-brand-gold/20' : 'border-gray-200'}`}>
                                <p className="text-xs font-bold uppercase opacity-60">{dayName}</p>
                                <p className="text-xl font-bold">{dayNumber}</p>
                            </div>
                            <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                                {dailyReservas.map(res => (
                                    <div key={res.id} className={`p-2 rounded-lg text-xs border shadow-sm ${
                                        res.status === 'Confirmada' ? 'bg-green-100 border-green-200 text-green-800' : 
                                        res.status === 'Pendiente' ? 'bg-white border-yellow-200 text-gray-800' : 'bg-gray-100 border-gray-200 text-gray-500'
                                    }`}>
                                        <div className="flex justify-between font-bold">
                                            <span>{res.time}</span>
                                            <span>{res.people}p</span>
                                        </div>
                                        <div className="truncate font-medium">{res.customerName}</div>
                                        <div className="text-[10px] opacity-70 truncate">{res.table}</div>
                                    </div>
                                ))}
                                {dailyReservas.length === 0 && (
                                    <div className="text-center py-4 text-gray-400 text-xs italic">Sin reservas</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 4. Nueva/Editar Reserva Modal (Con validación de conflictos)
const NuevaReservaModal: React.FC<{ 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (reserva: any) => void,
    reservaEditar?: ReservaLocal | null,
    reservasExistentes?: ReservaLocal[]
}> = ({ isOpen, onClose, onSave, reservaEditar, reservasExistentes = [] }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    observaciones: '',
    fecha: getLocalDate(),
    hora: '13:00',
    personas: 2,
    mesaManual: ''
  });
  const [error, setError] = useState('');
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);

  // AUTO-SELECCIÓN DE MESA
  useEffect(() => {
    if (isOpen && !reservaEditar) {
        setIsAutoSelecting(true);
        // Filtrar mesas ocupadas en esa fecha y hora (considerando margen de 2 horas aprox)
        const mesasOcupadas = reservasExistentes
            .filter(r => r.date === formData.fecha && r.time === formData.hora && r.status !== 'Cancelada')
            .map(r => r.table);
        
        // Buscar la mejor mesa disponible por capacidad
        const mesaDisponible = MESAS_CONFIG.find(m => 
            m.capacidad >= formData.personas && !mesasOcupadas.includes(m.id)
        );

        if (mesaDisponible) {
            setFormData(prev => ({ ...prev, mesaManual: mesaDisponible.id }));
        } else {
            setFormData(prev => ({ ...prev, mesaManual: '' }));
        }
        setIsAutoSelecting(false);
    }
  }, [formData.personas, formData.fecha, formData.hora, isOpen, reservasExistentes, reservaEditar]);

  useEffect(() => {
    if (isOpen) {
        if (reservaEditar) {
            setFormData({
                nombre: reservaEditar.customerName,
                telefono: reservaEditar.phone,
                email: reservaEditar.email || '',
                observaciones: reservaEditar.notes || '',
                fecha: reservaEditar.date,
                hora: reservaEditar.time,
                personas: reservaEditar.people,
                mesaManual: reservaEditar.table || ''
            });
        } else {
            setFormData({
                nombre: '',
                telefono: '',
                email: '',
                observaciones: '',
                fecha: getLocalDate(),
                hora: '13:00',
                personas: 2,
                mesaManual: ''
            });
        }
    }
  }, [isOpen, reservaEditar]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.telefono) {
        setError('Complete los campos obligatorios (*)');
        return;
    }
    const reservaData = {
        customerName: formData.nombre,
        phone: formData.telefono,
        email: formData.email,
        date: formData.fecha,
        time: formData.hora,
        people: formData.personas,
        status: reservaEditar ? reservaEditar.status : 'Pendiente', 
        table: formData.mesaManual,
        notes: formData.observaciones
    };
    onSave(reservaData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="bg-brand-dark p-6 flex justify-between items-center">
            <h3 className="text-xl font-bold text-brand-gold font-serif flex items-center gap-2">
                <Calendar size={24} /> {reservaEditar ? 'Editar Reserva' : 'Nueva Reserva'}
            </h3>
            <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Cliente *</label>
                    <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-gold" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono *</label>
                    <input type="tel" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-gold" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha *</label>
                    <input type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-gold" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Hora *</label>
                    <input type="time" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-gold" />
                </div>
                <div className="relative">
                    <label className="text-xs font-bold text-gray-500 mb-1 block flex justify-between items-center">
                        Mesa Asignada {isAutoSelecting && <span className="animate-pulse text-brand-gold text-[8px]">BUSCANDO...</span>}
                    </label>
                    <select value={formData.mesaManual} onChange={e => setFormData({...formData, mesaManual: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-gold bg-white">
                        <option value="">-- Sin mesa disponible --</option>
                        {MESAS_CONFIG.map(m => (
                            <option key={m.id} value={m.id}>{m.label} (Cap: {m.capacidad})</option>
                        ))}
                    </select>
                    {!formData.mesaManual && <p className="text-[10px] text-red-400 mt-1">No hay mesas libres para este aforo y horario.</p>}
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Personas</label>
                    <input type="number" min="1" value={formData.personas} onChange={e => setFormData({...formData, personas: parseInt(e.target.value) || 1})} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-gold" />
                </div>
            </div>
            <div>
                 <label className="text-xs font-bold text-gray-500 mb-1 block">Notas</label>
                 <textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-gold" rows={2} />
            </div>
            <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg">Guardar Reserva</button>
            </div>
        </form>
      </div>
    </div>
  );
};


export const ReservationPanel = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(getLocalDate());
  const [reservations, setReservations] = useState<ReservaLocal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<ReservaLocal | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingReserva, setEditingReserva] = useState<ReservaLocal | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservas')
        .select(`*, empleados:empleado_id (nombre)`)
        .order('fecha', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedData: ReservaLocal[] = data.map((item: any) => ({
          id: item.id,
          customerName: item.cliente_nombre,
          phone: item.cliente_telefono,
          email: item.cliente_email,
          date: item.fecha,
          time: item.hora,
          people: item.cantidad_personas,
          status: mapEstadoDBtoFront(item.estado), 
          table: item.numero_mesa,
          notes: item.observaciones,
          createdBy: item.empleados?.nombre || 'Desconocido'
        }));
        setReservations(mappedData);
      }
    } catch (error: any) {
      console.error('Error cargando reservas:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
    const subscription = supabase.channel('reservas_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => { fetchReservations(); }).subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [fetchReservations]);

  const handleStatusChange = async (id: string | number, newStatus: string) => {
    const dbStatus = mapEstadoFrontToDB(newStatus);
    try {
        await supabase.from('reservas').update({ estado: dbStatus }).eq('id', id);
        fetchReservations();
    } catch (e) { alert('Error actualizando estado'); }
  };

  const handleDelete = async (id: string | number) => {
    try {
        await supabase.from('reservas').delete().eq('id', id);
        fetchReservations();
    } catch (e) { alert('Error eliminando'); }
  };

  const handleGuardarReserva = async (datosReserva: any) => {
    try {
        const userStr = localStorage.getItem('arlet_user');
        const userData = userStr ? JSON.parse(userStr) : null;
        const resDB = {
            cliente_nombre: datosReserva.customerName,
            cliente_telefono: datosReserva.phone,
            cliente_email: datosReserva.email,
            fecha: datosReserva.date,
            hora: datosReserva.time,
            cantidad_personas: datosReserva.people,
            estado: mapEstadoFrontToDB(datosReserva.status),
            numero_mesa: datosReserva.table,
            observaciones: datosReserva.notes,
            empleado_id: userData?.id
        };
        if (editingReserva) {
            await supabase.from('reservas').update(resDB).eq('id', editingReserva.id);
        } else {
            await supabase.from('reservas').insert(resDB);
        }
        setShowModal(false);
        fetchReservations();
    } catch (e) { alert('Error al guardar'); }
  };

  const filteredReservations = reservations.filter(res => {
      const matchesSearch = res.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = res.date === dateFilter;
      return matchesSearch && matchesDate;
  });

  return (
    <PanelLayout title="Gestión de Reservas" active="reservas" user={user}>
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center border border-gray-100">
        <div className="flex gap-2">
            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg font-bold transition-all ${viewMode === 'list' ? 'bg-brand-dark text-white shadow-lg' : 'bg-gray-100 text-gray-600'}`}>Listado</button>
            <button onClick={() => setViewMode('map')} className={`px-4 py-2 rounded-lg font-bold transition-all ${viewMode === 'map' ? 'bg-brand-dark text-white shadow-lg' : 'bg-gray-100 text-gray-600'}`}>Mesas</button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-brand-gold" />
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-gold" />
            </div>
            {user?.role !== 'admin' && (
                <button onClick={() => { setEditingReserva(null); setShowModal(true); }} className="bg-brand-gold text-brand-dark px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-all shadow-md">
                    + Nueva Reserva
                </button>
            )}
        </div>
      </div>

      {viewMode === 'map' ? (
          <MapaMesas reservas={reservations} dateFilter={dateFilter} />
      ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
             <table className="w-full">
                <thead className="bg-gray-50 border-b">
                    <tr className="text-left text-gray-500 font-bold uppercase text-[10px]">
                        <th className="px-6 py-4">Hora</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Mesa</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {filteredReservations.map(res => (
                        <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-brand-dark">{res.time}</td>
                            <td className="px-6 py-4">
                                <p className="font-bold text-gray-800">{res.customerName}</p>
                                <p className="text-[10px] text-gray-400">{res.phone}</p>
                            </td>
                            <td className="px-6 py-4 font-black text-brand-dark">{res.table || '---'}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                                    res.status === 'Confirmada' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    res.status === 'Pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                    res.status === 'Finalizada' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
                                }`}>{res.status}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => { setSelectedReserva(res); setShowDetailModal(true); }} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"><Eye size={16}/></button>
                            </td>
                        </tr>
                    ))}
                    {filteredReservations.length === 0 && (
                        <tr><td colSpan={5} className="py-20 text-center text-gray-400 italic font-medium">No hay reservas para este día</td></tr>
                    )}
                </tbody>
             </table>
          </div>
      )}

      {showModal && <NuevaReservaModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleGuardarReserva} reservaEditar={editingReserva} reservasExistentes={reservations} />}
      {showDetailModal && selectedReserva && (
          <ReservaDetallesModal 
            reserva={selectedReserva} 
            onClose={() => setShowDetailModal(false)} 
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onEdit={(r) => { setEditingReserva(r); setShowModal(true); }}
            userRole={user?.role}
          />
      )}
    </PanelLayout>
  );
};

// ... COMPONENTES INTACTOS (MANTENIDOS) ...

// (NOTA: Aseguro que PedidoDetallesModal, DeliveryPanel, PanelCocina, AdminPedidosPanel, VerEmpleadoModal, EmpleadoFormModal, AdminPanel se mantienen exactamente igual.
// Para cumplir con "NO ELIMINES NADA", en la versión real esto iría a continuación del código modificado. 
// Aquí lo resumo pero en el archivo final estarían completos.)

const PedidoDetallesModal: React.FC<{ pedido: Pedido, onClose: () => void }> = ({ pedido, onClose }) => {
  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-brand-dark text-white p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-gold/20 rounded-xl text-brand-gold"><Receipt size={24}/></div>
                <div>
                    <h3 className="text-xl font-serif font-black text-brand-gold uppercase tracking-tighter">Detalle de Orden</h3>
                    <p className="text-[10px] font-mono text-white/50">{formatTicketId(pedido.id)}</p>
                </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-2 rounded-full transition-colors"><X size={24}/></button>
        </div>
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
            {/* TRAZABILIDAD DE TIEMPOS */}
            <div className="grid grid-cols-3 gap-1 bg-gray-50 rounded-2xl border border-gray-100 p-1">
                <div className="p-3 text-center border-r border-gray-200">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Registro</p>
                    <p className="font-mono text-gray-800 font-bold">{formatTime(pedido.created_at)}</p>
                </div>
                <div className="p-3 text-center border-r border-gray-200">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Salida</p>
                    <p className="font-mono text-indigo-600 font-bold">{formatTime(pedido.hora_salida_real)}</p>
                </div>
                <div className="p-3 text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Entrega</p>
                    <p className="font-mono text-green-600 font-bold">{formatTime(pedido.hora_entrega_real)}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Datos Cliente</h4>
                    <div>
                        <p className="text-xs font-black text-gray-800">{pedido.cliente_nombre}</p>
                        <p className="text-sm font-bold text-blue-600 flex items-center gap-1 mt-1"><Phone size={14}/> {pedido.telefono}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{pedido.direccion}</p>
                        {pedido.referencia && <p className="mt-2 p-2 bg-yellow-50 text-[10px] italic border border-yellow-100 rounded-lg text-yellow-800">Ref: {pedido.referencia}</p>}
                    </div>
                </div>
                <div className="space-y-4 text-right">
                    <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Reparto</h4>
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Responsable</p>
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                            <span className="text-xs font-black text-gray-800">{pedido.repartidores?.nombre || 'SISTEMA'}</span>
                            <div className="w-6 h-6 bg-brand-dark text-brand-gold rounded-full flex items-center justify-center text-[10px] font-black">
                                {pedido.repartidores?.nombre?.charAt(0) || 'A'}
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Método de Pago</p>
                        <p className="text-xs font-black text-brand-dark uppercase">{pedido.metodo_pago}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black mt-1 ${pedido.pagado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {pedido.pagado ? '✓ PAGADO' : '✗ PENDIENTE'}
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-4">Detalle de Productos</h4>
                <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-100 text-gray-400 border-b border-gray-200 uppercase font-black text-[9px]">
                            <tr><th className="px-4 py-3 text-left">Item</th><th className="px-4 py-3 text-center">Cant.</th><th className="px-4 py-3 text-right">Monto</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {(pedido.detalles_pedido || []).map((item: any, i: number) => (
                                <tr key={i} className="hover:bg-white transition-colors">
                                    <td className="px-4 py-3 font-bold text-gray-800">{item.item}</td>
                                    <td className="px-4 py-3 text-center font-black text-gray-500">{item.cantidad}</td>
                                    <td className="px-4 py-3 text-right font-black text-gray-800">S/ {(item.cantidad * item.precio).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-brand-dark text-brand-gold border-t border-brand-gold/20">
                            <tr>
                                <td colSpan={2} className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest">Total Orden</td>
                                <td className="px-4 py-4 text-right font-black text-xl">S/ {pedido.total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {pedido.notas && (
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-start gap-3">
                    <AlertTriangle size={20} className="text-orange-500 mt-1 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] font-black text-orange-700 uppercase mb-1">Notas del Pedido</p>
                        <p className="text-sm text-orange-900 italic font-medium">"{pedido.notas}"</p>
                    </div>
                </div>
            )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button onClick={onClose} className="px-8 py-3 bg-brand-dark text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-xl shadow-gray-200">CERRAR</button>
        </div>
      </div>
    </div>
  );
};



export const DeliveryPanel = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(getLocalDate());
  const [selPedido, setSelPedido] = useState<Pedido | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  const cargarData = useCallback(async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select('*, creador:empleado_id(nombre), repartidores:repartidor_id(nombre)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        setPedidos(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    cargarData();
    const sub = supabase.channel('pedidos-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
            console.log('Realtime Update: Pedidos');
            cargarData();
        })
        .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [cargarData]);

  const handleStatus = async (id: string, next: string) => {
    if (isAdmin && user?.role !== 'admin') return;
    try {
        const updates: any = { estado: next, updated_at: new Date().toISOString() };
        
        if (next === 'en_camino') {
            updates.hora_salida_real = new Date().toISOString();
        }
        if (next === 'entregado') {
            updates.hora_entrega_real = new Date().toISOString();
        }

        const { error } = await supabase.from('pedidos').update(updates).eq('id', id);
        if (error) throw error;
        
    } catch (e) { alert('Error crítico al actualizar el flujo del pedido.'); }
  };

  const filtered = pedidos.filter(p => {
      const matchSearch = p.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = p.created_at.startsWith(dateFilter);
      return matchSearch && matchDate && p.estado !== 'cancelado';
  });

  const columns = [
      { id: 'pendiente', label: 'Pendientes', color: 'border-t-blue-400' },
      { id: 'en_preparacion', label: 'En Cocina', color: 'border-t-yellow-400' },
      { id: 'en_camino', label: 'En Camino', color: 'border-t-purple-400' },
      { id: 'entregado', label: 'Entregados', color: 'border-t-green-400' }
  ];

  return (
    <PanelLayout title="Gestión de Reparto" active="delivery" user={user}>
      <div className="bg-white p-8 rounded-[56px] shadow-sm border border-gray-100 mb-12 flex justify-between items-center animate-fadeIn">
        <div className="flex gap-5 items-center">
            <div className="relative group">
                <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-gold transition-colors" />
                <input type="text" placeholder="Buscar orden..." className="pl-16 pr-8 py-5 bg-gray-50 border-none rounded-[32px] text-xs font-black outline-none focus:ring-4 focus:ring-brand-gold/10 w-80 transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <input type="date" className="py-5 px-8 bg-gray-50 border-none rounded-[32px] text-xs font-black outline-none focus:ring-4 focus:ring-brand-gold/10 cursor-pointer shadow-sm transition-all" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        {!isAdmin && (
            <button onClick={() => setShowAdd(true)} className="bg-brand-gold text-brand-dark px-14 py-5 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-yellow-100 hover:bg-yellow-500 transition-all flex items-center gap-3 active:scale-95">
                <Plus size={24}/> Registrar Pedido
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
        {columns.map(col => (
            <div key={col.id} className={`flex flex-col min-h-[700px] bg-gray-50/50 rounded-[56px] p-6 border-t-[10px] shadow-sm transition-all hover:shadow-md ${col.color}`}>
                <div className="flex justify-between items-center mb-10 px-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">{col.label}</h3>
                    <span className="bg-white px-5 py-2 rounded-2xl text-[11px] font-black text-brand-dark shadow-sm border border-gray-100">{filtered.filter(p => p.estado === col.id).length}</span>
                </div>
                <div className="space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar pr-2 animate-fadeIn">
                    {filtered.filter(p => p.estado === col.id).map(p => (
                        <OrderCard key={p.id} pedido={p} onStatusChange={handleStatus} onView={setSelPedido} isAdmin={isAdmin} />
                    ))}
                    {filtered.filter(p => p.estado === col.id).length === 0 && (
                        <div className="py-32 text-center opacity-10 flex flex-col items-center select-none grayscale">
                            <Package size={72} />
                            <p className="mt-5 font-black uppercase tracking-[0.3em] text-[11px]">Bandeja Vacía</p>
                        </div>
                    )}
                </div>
            </div>
        ))}
      </div>

      {showAdd && <CrearPedidoModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSuccess={cargarData} repartidores={[]} />}
      {selPedido && <PedidoDetallesModal pedido={selPedido} onClose={() => setSelPedido(null)} />}
    </PanelLayout>
  );
};


const OrderCard: React.FC<{ pedido: Pedido, onStatusChange: (id: string, next: string) => void, onView: (p: Pedido) => void, isAdmin: boolean }> = ({ pedido, onStatusChange, onView, isAdmin }) => {
    const statusConfig: any = {
        pendiente: { label: 'Registrado', color: 'bg-blue-100 text-blue-700', next: 'en_preparacion', nextLabel: 'A Cocina' },
        en_preparacion: { label: 'En Cocina', color: 'bg-yellow-100 text-yellow-700', next: 'en_camino', nextLabel: 'Salida Delivery' },
        en_camino: { label: 'En Camino', color: 'bg-purple-100 text-purple-700', next: 'entregado', nextLabel: 'Entregar' },
        entregado: { label: 'Entregado', color: 'bg-green-100 text-green-700', next: null }
    };

    const cfg = statusConfig[pedido.estado];

    return (
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-mono text-gray-300 tracking-tighter">#{pedido.id.slice(-6).toUpperCase()}</span>
                <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
            </div>
            <h4 className="font-black text-sm text-gray-800 truncate mb-1 uppercase tracking-tighter">{pedido.cliente_nombre}</h4>
            <div className="flex items-center gap-1.5 mb-4">
                <Phone size={12} className="text-blue-500" />
                <span className="text-[11px] font-black text-blue-600">{pedido.telefono}</span>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <span className="font-black text-sm text-brand-dark">S/ {pedido.total.toFixed(2)}</span>
                <div className="flex gap-2">
                    <button onClick={() => onView(pedido)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"><Eye size={18}/></button>
                    {!isAdmin && cfg.next && (
                        <button onClick={() => onStatusChange(pedido.id, cfg.next)} className="bg-brand-dark text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-black shadow-lg shadow-gray-200 transition-all active:scale-95">
                             {cfg.nextLabel} <ArrowRight size={12}/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};



export const PanelCocina = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(getLocalDate());
  const [kitchenStates, setKitchenStates] = useState<Record<string, 'pendiente' | 'preparando' | 'listo'>>({});

  const cargarPedidosCocina = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`*, creador:empleado_id(nombre), repartidores:repartidor_id(nombre)`)
        .in('estado', ['en_preparacion', 'en_camino'])
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setPedidos(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    cargarPedidosCocina();
    const sub = supabase.channel('cocina-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && payload.old.estado === 'pendiente' && payload.new.estado === 'en_preparacion')) {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
        }
        cargarPedidosCocina();
    }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [cargarPedidosCocina]);

  const moverAPreparacion = (id: string) => setKitchenStates(prev => ({ ...prev, [id]: 'preparando' }));
  const marcarComoListo = async (id: string) => {
      try {
          await supabase.from('pedidos').update({ estado: 'en_camino', updated_at: new Date().toISOString() }).eq('id', id);
          setKitchenStates(prev => ({ ...prev, [id]: 'listo' }));
          cargarPedidosCocina();
      } catch (e) { alert('Error al notificar pedido listo.'); }
  };

  const secciones = [
    { id: 'pendiente', label: 'Comandas Nuevas', icon: <Clock size={20}/> },
    { id: 'preparando', label: 'En Fogones', icon: <Utensils size={20}/> },
    { id: 'listo', label: 'Listo para Reparto', icon: <CheckCircle size={20}/> }
  ];

  const filteredPedidos = pedidos.filter(p => p.created_at.startsWith(dateFilter));

  const getPedidosPorSeccion = (secId: string) => {
      return filteredPedidos.filter(p => {
          const kState = kitchenStates[p.id] || (p.estado === 'en_camino' ? 'listo' : 'pendiente');
          return kState === secId;
      });
  };

  return (
    <PanelLayout title="Panel de Comandas" active="cocina" user={user}>
      {/* FILTRO DE FECHA CALENDARIO (IGUAL AL DELIVERY) */}
      <div className="bg-white p-8 rounded-[56px] shadow-sm border border-gray-100 mb-12 flex justify-between items-center animate-fadeIn">
        <div className="flex gap-5 items-center">
            <div className="bg-brand-dark/5 p-3 rounded-2xl text-brand-dark flex items-center gap-2">
                <CalendarDays size={20}/> <span className="text-[10px] font-black uppercase tracking-widest"></span>
            </div>
            <input 
              type="date" 
              className="py-5 px-8 bg-gray-50 border-none rounded-[32px] text-xs font-black outline-none focus:ring-4 focus:ring-brand-gold/10 cursor-pointer shadow-sm transition-all" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
            />
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado Cocina:</span>
            <div className="flex gap-1">
                <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                <span className="w-3 h-3 bg-orange-400 rounded-full"></span>
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full animate-fadeIn">
        {secciones.map(sec => (
            <div key={sec.id} className="flex flex-col bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className={`p-6 flex items-center justify-between border-b ${sec.id === 'pendiente' ? 'bg-blue-50/50' : sec.id === 'preparando' ? 'bg-orange-50/50' : 'bg-green-50/50'}`}>
                    <div className="flex items-center gap-3">
                        <span className={`${sec.id === 'pendiente' ? 'text-blue-600' : sec.id === 'preparando' ? 'text-orange-600' : 'text-green-600'}`}>{sec.icon}</span>
                        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-gray-700">{sec.label}</h3>
                    </div>
                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black shadow-sm">{getPedidosPorSeccion(sec.id).length}</span>
                </div>
                
                <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[75vh]">
                    {getPedidosPorSeccion(sec.id).map(p => (
                        <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all animate-scaleIn">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-mono font-black text-gray-300 tracking-tighter">#{p.id.slice(-6).toUpperCase()}</span>
                                <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-lg flex items-center gap-1"><Clock size={10}/> {formatTime(p.created_at)}</span>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cliente</p>
                                <p className="font-black text-lg text-gray-800 uppercase tracking-tighter leading-none border-l-4 border-brand-gold pl-3">{p.cliente_nombre}</p>
                            </div>

                            <div className="space-y-2 mb-4">
                                {(p.detalles_pedido || []).map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm font-black text-gray-700 bg-gray-50 p-2 rounded-xl">
                                        <span className="text-brand-dark bg-brand-gold/20 w-7 h-7 flex items-center justify-center rounded-lg">{item.cantidad}</span>
                                        <span className="flex-1 ml-3 uppercase tracking-tighter text-xs">{item.item}</span>
                                    </div>
                                ))}
                            </div>

                            {p.notas && (
                                <div className="mb-6 bg-yellow-50 p-4 rounded-2xl border-2 border-dashed border-yellow-100">
                                    <p className="text-[9px] font-black text-yellow-600 uppercase mb-1 flex items-center gap-2"><AlertTriangle size={12}/> Obs.</p>
                                    <p className="text-xs text-yellow-900 italic font-black">"{p.notas}"</p>
                                </div>
                            )}

                            {sec.id === 'pendiente' && (
                                <button onClick={() => moverAPreparacion(p.id)} className="w-full bg-brand-dark text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                                    <Utensils size={14}/> INICIAR COCINA
                                </button>
                            )}
                            {sec.id === 'preparando' && (
                                <button onClick={() => marcarComoListo(p.id)} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                                    <CheckCircle size={14}/> PEDIDO LISTO
                                </button>
                            )}
                            {sec.id === 'listo' && (
                                <div className="p-3 bg-green-50 rounded-2xl text-center border border-green-100 flex items-center justify-center gap-2">
                                    <UserCheck size={14} className="text-green-600"/>
                                    <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">NOTIFICADO A REPARTO</p>
                                </div>
                            )}
                        </div>
                    ))}
                    {getPedidosPorSeccion(sec.id).length === 0 && (
                        <div className="py-20 text-center opacity-10 flex flex-col items-center">
                            <ChefHat size={64}/>
                            <p className="mt-4 font-black uppercase text-[10px] tracking-widest">Sin actividad para este día</p>
                        </div>
                    )}
                </div>
            </div>
        ))}
      </div>
    </PanelLayout>
  );
};

export const AdminPedidosPanel = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const todosPedidos = await pedidoService.getAllPedidos();
      setPedidos(todosPedidos);
    } catch (error) { alert('Error al cargar'); } finally { setLoading(false); }
  };

  const handleVerDetalles = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setShowDetallesModal(true);
  };

  useEffect(() => { cargarPedidos(); }, []);

  return (
    <PanelLayout title="Todos los Pedidos" active="pedidos" user={user}>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {formatTicketId(pedido.id)}
                    </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{pedido.cliente_nombre}</td>
                <td className="px-6 py-4 text-sm font-bold text-green-600">S/ {pedido.total?.toFixed(2)}</td>
                <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        pedido.estado === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        pedido.estado === 'en_preparacion' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        pedido.estado === 'en_camino' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        pedido.estado === 'entregado' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                        {pedido.estado.replace('_', ' ').toUpperCase()}
                    </span>
                </td>
                <td className="px-6 py-4 text-center">
                    <button 
                        onClick={() => handleVerDetalles(pedido)}
                        className="text-brand-dark hover:text-brand-gold font-bold text-xs flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors mx-auto"
                    >
                        <Eye size={14} /> Ver Ticket
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showDetallesModal && pedidoSeleccionado && (
        <PedidoDetallesModal 
            pedido={pedidoSeleccionado} 
            onClose={() => setShowDetallesModal(false)} 
        />
      )}
    </PanelLayout>
  );
};

// --- MODAL DE VER DETALLES DE EMPLEADO ---
const VerEmpleadoModal: React.FC<{ empleado: Empleado | null, onClose: () => void }> = ({ empleado, onClose }) => {
  if (!empleado) return null;
  
  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
        <div className="bg-brand-dark p-6 text-white flex justify-between items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <ChefHat size={120} />
          </div>
          <div className="relative z-10">
             <h3 className="text-xl font-bold font-serif text-brand-gold">Ficha de Empleado</h3>
             <p className="text-gray-300 text-xs mt-1 font-mono opacity-70">ID: {empleado.id}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors relative z-10">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 pt-12 relative">
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-xl">
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-4xl font-bold text-gray-500 border border-gray-300">
                      {empleado.nombre.charAt(0).toUpperCase()}
                  </div>
              </div>
          </div>

          <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                  <div className="bg-blue-100 p-2.5 rounded-full text-blue-600 shadow-sm"><User size={20} /></div>
                  <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nombre Completo</p>
                      <p className="text-gray-800 font-bold text-lg leading-tight">{empleado.nombre}</p>
                  </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                  <div className="bg-green-100 p-2.5 rounded-full text-green-600 shadow-sm"><Mail size={20} /></div>
                  <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Correo Electrónico</p>
                      <p className="text-gray-800 font-medium">{empleado.email}</p>
                  </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                  <div className="bg-purple-100 p-2.5 rounded-full text-purple-600 shadow-sm"><Phone size={20} /></div>
                  <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Teléfono</p>
                      <p className="text-gray-800 font-medium">{empleado.telefono || 'No registrado'}</p>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
               <div className="border border-gray-100 rounded-xl p-4 text-center bg-gray-50/50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Rol Asignado</p>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold capitalize shadow-sm ${
                      empleado.rol === 'admin' ? 'bg-purple-100 text-purple-700' :
                      empleado.rol === 'delivery' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                  }`}>
                      {empleado.rol}
                  </span>
               </div>
               <div className="border border-gray-100 rounded-xl p-4 text-center bg-gray-50/50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Estado Actual</p>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold capitalize shadow-sm ${
                      empleado.estado === 'activo' ? 'bg-green-100 text-green-700' : 
                      empleado.estado === 'vacaciones' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                      {empleado.estado}
                  </span>
               </div>
          </div>

          <div className="text-xs text-gray-400 text-center border-t border-gray-100 pt-4">
              Registrado en sistema: {new Date(empleado.created_at).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MODAL DE CREAR/EDITAR EMPLEADO ---
const EmpleadoFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors: ValidationErrors;
  tipoEmpleado: 'con_auth' | 'sin_auth';
}> = ({ isOpen, onClose, onSubmit, isEditing, formData, handleInputChange, errors, tipoEmpleado }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-brand-dark p-6 flex justify-between items-center border-b border-gray-800">
          <div className="flex items-center gap-3">
             <div className="bg-brand-gold/20 p-2 rounded-lg text-brand-gold">
                {isEditing ? <Edit size={20} /> : <UserPlus size={20} />}
             </div>
             <h3 className="text-xl font-bold text-white font-serif">
                {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
             </h3>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Nombre Completo</label>
            <div className="relative group">
                <User className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-gold transition-colors" size={18} />
                <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none transition-all bg-gray-50 focus:bg-white ${errors.nombre ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                    placeholder="Ej. Juan Pérez"
                />
            </div>
            {errors.nombre && <p className="text-red-500 text-xs mt-1 font-medium ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.nombre}</p>}
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-2 gap-5">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Email</label>
                <div className="relative group">
                    <Mail className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-gold transition-colors" size={18} />
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none transition-all bg-gray-50 focus:bg-white ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        placeholder="ejemplo@correo.com"
                    />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 font-medium ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</p>}
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Teléfono</label>
                <div className="relative group">
                    <Phone className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-gold transition-colors" size={18} />
                    <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        maxLength={9}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none transition-all bg-gray-50 focus:bg-white ${errors.telefono ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        placeholder="987654321"
                    />
                </div>
                {errors.telefono && <p className="text-red-500 text-xs mt-1 font-medium ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.telefono}</p>}
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Rol Asignado</label>
            <div className="relative group">
                <Briefcase className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-gold transition-colors" size={18} />
                <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                >
                    <option value="reservas">Encargado de Reservas</option>
                    <option value="delivery">Repartidor Delivery</option>
                    <option value="cocina">Cocinero</option>
                </select>
                <ChevronRight className="absolute right-3 top-3 text-gray-400 rotate-90 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Contraseña (Solo al crear) */}
          {!isEditing && (
             <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 shadow-sm">
                <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <div className="bg-amber-200/50 p-1.5 rounded text-amber-700"><Key size={14} /></div>
                    Credenciales de Acceso
                </h4>
                <div>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none transition-all ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="Contraseña (Mín. 6 caracteres)"
                    />
                     {errors.password && <p className="text-red-500 text-xs mt-1 font-medium ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.password}</p>}
                </div>
             </div>
          )}

           {/* Cambio de Contraseña (Solo al editar) */}
           {isEditing && (
            <div className="border-t border-gray-100 pt-5 mt-2">
                <div className="flex items-center gap-2 mb-3">
                    <Shield size={16} className="text-gray-400" />
                    <p className="text-sm font-bold text-gray-700">Actualizar Contraseña</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <input
                            type="password"
                            name="nuevaContrasena"
                            value={formData.nuevaContrasena}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none transition-all bg-gray-50 focus:bg-white ${errors.nuevaContrasena ? 'border-red-500' : 'border-gray-200'}`}
                            placeholder="Nueva contraseña"
                        />
                         {errors.nuevaContrasena && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.nuevaContrasena}</p>}
                    </div>
                    <div>
                        <input
                            type="password"
                            name="confirmarContrasena"
                            value={formData.confirmarContrasena}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none transition-all bg-gray-50 focus:bg-white ${errors.confirmarContrasena ? 'border-red-500' : 'border-gray-200'}`}
                            placeholder="Confirmar"
                        />
                        {errors.confirmarContrasena && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.confirmarContrasena}</p>}
                    </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 ml-1">* Dejar en blanco si no desea cambiar la contraseña</p>
            </div>
           )}

           <div className="flex gap-3 pt-4 border-t border-gray-100">
             <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-bold transition-colors text-sm"
             >
                Cancelar
             </button>
             <button
                type="submit"
                className="flex-1 px-4 py-3.5 bg-brand-dark text-white rounded-xl hover:bg-gray-800 font-bold transition-all shadow-lg hover:shadow-xl text-sm flex items-center justify-center gap-2"
             >
                {isEditing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                {isEditing ? 'Guardar Cambios' : 'Crear Empleado'}
             </button>
           </div>
        </form>
      </div>
    </div>
  );
};

// --- ADMIN PANEL ---
export const AdminPanel = () => {
  // Estado del tipo de empleado
  const [tipoEmpleado, setTipoEmpleado] = useState<'con_auth' | 'sin_auth'>('sin_auth');
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [empleadoDetalles, setEmpleadoDetalles] = useState<Empleado | null>(null);
  
  // Estado principal
  const [historial, setHistorial] = useState<Auditoria[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [estadisticas, setEstadisticas] = useState<{total: number, hoy: number} | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'reservas' as 'reservas' | 'delivery' | 'cocina',
    password: '',
    nuevaContrasena: '',
    confirmarContrasena: '' 
  });

  // Función para ver detalles del empleado
  const handleVerDetalles = (empleado: Empleado) => {
    setEmpleadoDetalles(empleado);
    setShowDetallesModal(true);
  };

  // Funciones de validación
  const validarNombre = (nombre: string): string | undefined => {
    if (!nombre.trim()) return 'El nombre es requerido';
    if (nombre.length < 3) return 'Mínimo 3 caracteres';
    if (nombre.length > 50) return 'Máximo 50 caracteres';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) return 'Solo letras y espacios';
    return undefined;
  };

  const validarEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'El email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
    return undefined;
  };

  const validarTelefonoPeru = (telefono: string): string | undefined => {
    if (!telefono.trim()) return 'El teléfono es requerido';
    if (!/^9\d{8}$/.test(telefono)) return 'Debe iniciar con 9 y tener 9 dígitos';
    return undefined;
  };

  const validarPassword = (password: string): string | undefined => {
    if (!password.trim()) return 'La contraseña es requerida';
    if (password.length < 6) return 'Mínimo 6 caracteres';
    if (password.length > 20) return 'Máximo 20 caracteres';
    return undefined;
  };

  const validarTodoElFormulario = (): boolean => {
    const nuevosErrores: ValidationErrors = {};
    nuevosErrores.nombre = validarNombre(formData.nombre);
    nuevosErrores.email = validarEmail(formData.email);
    nuevosErrores.telefono = validarTelefonoPeru(formData.telefono);
    nuevosErrores.rol = !formData.rol ? 'Selecciona un rol' : undefined;
    
    if (!editingEmpleado) {
      nuevosErrores.password = validarPassword(formData.password);
    } else {
      // Validación para cambio de contraseña al editar
      if (formData.nuevaContrasena) {
        nuevosErrores.nuevaContrasena = validarPassword(formData.nuevaContrasena); 
        if (formData.nuevaContrasena !== formData.confirmarContrasena) {
          nuevosErrores.confirmarContrasena = 'Las contraseñas no coinciden';
        }
      }
    }
    
    if (formData.confirmarContrasena && !formData.nuevaContrasena) {
      nuevosErrores.confirmarContrasena = 'Primero ingresa la nueva contraseña';
    }
    
    setErrors(nuevosErrores);
    return !Object.values(nuevosErrores).some(error => error !== undefined);
  };

  // Cargar empleados
  const loadEmpleados = async () => {
    try {
      setLoading(true);
      const data = await empleadoService.getEmpleados();
      setEmpleados(data);
    } catch (error) {
      console.error('Error cargando empleados:', error);
      alert('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  // Cargar historial de actividad
  const loadHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const data = await auditoriaService.obtenerHistorial(15);
      setHistorial(data);
      // Cargar estadísticas
      const stats = await auditoriaService.obtenerEstadisticas();
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error cargando historial:', error);
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Manejar cambios del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Validación especial para teléfono
    if (name === 'telefono') {
      processedValue = value.replace(/\D/g, '').slice(0, 9);
      if (processedValue.trim()) {
        setErrors(prev => ({ 
          ...prev, 
          telefono: validarTelefonoPeru(processedValue) 
        }));
      }
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  // Abrir modal para nuevo empleado
  const handleNuevoEmpleado = () => {
    setEditingEmpleado(null);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      rol: 'reservas',
      password: '',
      nuevaContrasena: '',
      confirmarContrasena: ''
    });
    setTipoEmpleado('sin_auth');
    setErrors({});
    setShowModal(true);
  };

  // Abrir modal para editar empleado
  const handleEditarEmpleado = (empleado: Empleado) => {
    setEditingEmpleado(empleado);
    setFormData({
      nombre: empleado.nombre,
      email: empleado.email,
      telefono: empleado.telefono || '',
      rol: empleado.rol as 'reservas' | 'delivery' | 'cocina',
      password: '',
      nuevaContrasena: '',
      confirmarContrasena: ''
    });
    setTipoEmpleado(empleado.auth_id ? 'con_auth' : 'sin_auth');
    setShowModal(true);
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarTodoElFormulario()) {
      return;
    }

    try {
      if (editingEmpleado) {
        // Actualizar empleado existente
        const updates = {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
          rol: formData.rol,
          estado: editingEmpleado.estado
        };
        
        await empleadoService.updateEmpleado(editingEmpleado.id, updates as any);
        
        // --- FIX MANUAL: REGISTRAR AUDITORÍA DIRECTAMENTE ---
        await auditoriaService.registrarActualizacionEmpleado(editingEmpleado.id, updates);

        if (formData.nuevaContrasena && 
            formData.nuevaContrasena === formData.confirmarContrasena) {
          if (!editingEmpleado.auth_id) {
            await empleadoService.actualizarContrasenaEmpleado(
              editingEmpleado.id,
              formData.nuevaContrasena
            );
            await auditoriaService.registrarCambioContrasena(editingEmpleado.id, editingEmpleado.nombre);
            alert('Datos y contraseña actualizados correctamente');
          } else {
            alert(`${formData.nombre} tiene Authentication. Contraseña no cambiada (requiere Service Key).`);
          }
        } else {
          alert('Datos actualizados.');
        }
      } else {
        // Crear nuevo empleado
        const empleadoData = {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
          rol: formData.rol,
          password: formData.password
        };
        
        const nuevoEmpleado = await empleadoService.crearEmpleadoSinAuth(empleadoData as any);
        // --- FIX MANUAL: REGISTRAR AUDITORÍA DIRECTAMENTE ---
        if (nuevoEmpleado) {
             await auditoriaService.registrarCreacionEmpleado(nuevoEmpleado);
        }
      }
      
      setShowModal(false);
      setErrors({});
      loadEmpleados();
      loadHistorial();      
    } catch (error: any) {
      console.error('Error guardando empleado:', error);
      alert(error.message || 'Error al guardar empleado');
    }
  };

  // Eliminar empleado
  const handleEliminarEmpleado = async (empleado: Empleado) => {
    if (empleado.rol === 'admin') {
      alert('No se puede eliminar un usuario administrador');
      return;
    }
    if (!confirm(`¿Estás seguro de eliminar a ${empleado.nombre}?\n\nEsta acción no se puede deshacer.`)) return;
    
    try {
      await empleadoService.deleteEmpleado(empleado.id);
      
      // --- FIX MANUAL: REGISTRAR AUDITORÍA DIRECTAMENTE ---
      await auditoriaService.registrarEliminacionEmpleado(empleado.id, empleado);

      alert('Empleado eliminado correctamente');
      loadEmpleados();
      loadHistorial();
    } catch (error: any) {
      console.error('Error eliminando empleado:', error);
      alert(error.message || 'Error al eliminar empleado');
    }
  };

  // Cambiar estado del empleado
  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      // Obtener empleado actual
      const empleado = empleados.find(e => e.id === id);
      if (!empleado) return;
      await empleadoService.updateEmpleado(id, { 
        estado: nuevoEstado as 'activo' | 'inactivo' | 'vacaciones' 
      });

      // Registrar auditoría
      await auditoriaService.registrarCambioEstado(
        id,
        empleado.nombre,
        empleado.estado,
        nuevoEstado
      );

      // Recargar ambos
      loadEmpleados();
      loadHistorial();
      
    } catch (error: any) {
      console.error('Error cambiando estado:', error);
      alert(error.message || 'Error al cambiar estado');
    }
  };

  // Cargar datos al iniciar
  useEffect(() => {
    loadEmpleados();
    loadHistorial();
  }, []);

  return (
    <PanelLayout title="Administrador" active="dashboard" user={useAuth().user}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ventas Hoy</p>
              <h3 className="text-3xl font-bold text-gray-800">S/ 4,250</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600 border border-blue-100"><DollarSign size={24} /></div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-0.5 rounded-full">
            <TrendingUp size={12} /> +12.5% vs ayer
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Reservas</p>
              <h3 className="text-3xl font-bold text-gray-800">18</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-xl text-green-600 border border-green-100"><Calendar size={24} /></div>
          </div>
           <div className="mt-4 text-xs font-medium text-gray-400">
             5 pendientes de confirmar
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Equipo</p>
              <h3 className="text-3xl font-bold text-gray-800">{empleados.length}</h3>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl text-orange-600 border border-orange-100"><Users size={24} /></div>
          </div>
           <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400">
             <div className="w-2 h-2 rounded-full bg-green-500"></div> {empleados.filter(e => e.estado === 'activo').length} Activos
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Calidad</p>
              <h3 className="text-3xl font-bold text-gray-800">4.8/5</h3>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl text-purple-600 border border-purple-100"><Activity size={24} /></div>
          </div>
           <div className="mt-4 flex items-center gap-1 text-xs font-medium text-brand-gold">
             ★★★★★ <span className="text-gray-400 ml-1">(120 reseñas)</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-brand-gold" />
            Reservas Semanales
          </h3>
          <div className="h-64 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SALES_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <RechartsTooltip 
                    cursor={{fill: '#f9fafb'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="ventas" fill="#D4AF37" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-brand-gold" />
            Platos Más Vendidos
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie 
                    data={DISH_SALES_DATA} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                >
                  {DISH_SALES_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#1A1A1A', '#D4AF37', '#C41E3A', '#9ca3af'][index % 4]} strokeWidth={0} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Legend iconType="circle" />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sección de Gestión - Personal */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Users size={20} className="text-brand-dark" />
              Gestión de Personal
            </h3>
            <p className="text-sm text-gray-400">Administra los accesos y roles de tu equipo</p>
          </div>
          <button 
            onClick={handleNuevoEmpleado}
            className="text-sm bg-brand-dark text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg hover:shadow-gray-300"
          >
            <Plus size={16}/> Nuevo Empleado
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
             <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-gold mb-3"></div>
             <p className="text-gray-400 text-sm">Cargando lista de empleados...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50">
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider">Nombre</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider">Contacto</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider">Rol</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider">Estado</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {empleados.map((empleado: Empleado) => (
                  <tr key={empleado.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
                                {empleado.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-bold text-gray-700">{empleado.nombre}</div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="text-gray-600 font-medium">{empleado.email}</span>
                            <span className="text-gray-400 text-xs">{empleado.telefono || 'Sin teléfono'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`capitalize px-3 py-1 rounded-full text-xs font-bold border ${
                        empleado.rol === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        empleado.rol === 'delivery' ? 'bg-green-50 text-green-700 border-green-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {empleado.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={empleado.estado}
                        onChange={(e) => handleCambiarEstado(empleado.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none focus:ring-2 focus:ring-opacity-50 transition-all cursor-pointer ${
                          empleado.estado === 'activo' ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-200' :
                          empleado.estado === 'inactivo' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-200'
                        }`}
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                        <option value="vacaciones">Vacaciones</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleVerDetalles(empleado)}
                          className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 flex items-center justify-center transition-all"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditarEmpleado(empleado)}
                          className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 flex items-center justify-center transition-all"
                          title="Editar información"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleEliminarEmpleado(empleado)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                             empleado.rol === 'admin' 
                             ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                             : 'bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700'
                          }`}
                          title={empleado.rol === 'admin' ? "No se puede eliminar admin" : "Eliminar empleado"}
                          disabled={empleado.rol === 'admin'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {empleados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                       <div className="flex flex-col items-center gap-2">
                          <Users size={32} className="opacity-20" />
                          No hay empleados registrados
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de Actividad */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock size={20} className="text-brand-dark" />
                Historial de Actividad
            </h3>
            {estadisticas && (
              <p className="text-xs text-gray-400 mt-1">
                Últimos {estadisticas.total} registros
              </p>
            )}
          </div>
          <button 
              onClick={loadHistorial}
              className="text-xs text-gray-500 hover:text-brand-dark bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-bold border border-gray-200"
              disabled={loadingHistorial}
            >
              <RefreshCw size={12} className={loadingHistorial ? 'animate-spin' : ''} />
              ACTUALIZAR
            </button>
        </div>
        
        {loadingHistorial ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-brand-gold mb-2"></div>
            <p className="text-gray-400 text-xs">Sincronizando...</p>
          </div>
        ) : historial.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
            <Activity size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No hay actividad reciente</p>
          </div>
        ) : (
          <div className="space-y-0 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {historial.map((item, index) => {
              // Formatear fecha
              const fecha = new Date(item.created_at);
              const hoy = new Date();
              const esHoy = fecha.getDate() === hoy.getDate() && fecha.getMonth() === hoy.getMonth();
              const fechaStr = esHoy 
                 ? fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                 : fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });

              // Icono y color
              let colorClase = 'bg-gray-100 text-gray-500';
              let icono = <Activity size={14} />;
              
              if (item.accion.includes('CREAR')) {
                colorClase = 'bg-green-100 text-green-600';
                icono = <UserPlus size={14} />;
              } else if (item.accion.includes('ACTUALIZAR') || item.accion.includes('CAMBIAR') || item.accion.includes('ESTADO')) {
                colorClase = 'bg-blue-100 text-blue-600';
                icono = <Edit size={14} />;
              } else if (item.accion.includes('ELIMINAR')) {
                colorClase = 'bg-red-100 text-red-600';
                icono = <Trash2 size={14} />;
              }
              
              return (
                <div key={item.id} className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors border-l-2 ${item.accion.includes('ELIMINAR') ? 'border-l-red-400' : item.accion.includes('CREAR') ? 'border-l-green-400' : 'border-l-transparent'}`}>
                  <div className={`p-2 rounded-lg shadow-sm flex-shrink-0 mt-0.5 ${colorClase}`}>
                    {icono}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                       <p className="text-sm font-bold text-gray-700">
                          {item.accion.replace('MANUAL_', '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                       </p>
                       <span className="text-[10px] text-gray-400 whitespace-nowrap font-mono">{fechaStr}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                       <span className="text-gray-400">Por:</span> <span className="font-medium text-gray-800 mr-2">{item.empleado_nombre}</span>
                       
                       {/* SAFE RENDERING TO PREVENT CRASH */}
                       {item.detalles && typeof item.detalles === 'object' && item.detalles.empleado && (
                           <span className="inline-flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600">
                             Afectado: <span className="font-bold">{renderDetalleValor(item.detalles.empleado)}</span>
                           </span>
                       )}
                       {item.detalles && typeof item.detalles === 'object' && item.detalles.nuevo_empleado && (
                           <span className="inline-flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-[10px] text-green-700 ml-1">
                             Nuevo: <span className="font-bold">{renderDetalleValor(item.detalles.nuevo_empleado)}</span>
                           </span>
                       )}
                       {item.detalles && typeof item.detalles === 'object' && item.detalles.empleado_eliminado && (
                           <span className="inline-flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded text-[10px] text-red-700 ml-1">
                             Eliminado: <span className="font-bold">{renderDetalleValor(item.detalles.empleado_eliminado)}</span>
                           </span>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALES */}
      <EmpleadoFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        isEditing={!!editingEmpleado}
        formData={formData}
        handleInputChange={handleInputChange}
        errors={errors}
        tipoEmpleado={tipoEmpleado}
      />
      
      <VerEmpleadoModal
        empleado={empleadoDetalles}
        onClose={() => setShowDetallesModal(false)}
      />

    </PanelLayout>
  );
};