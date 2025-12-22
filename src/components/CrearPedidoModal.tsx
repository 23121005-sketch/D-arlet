
import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, MapPin, Phone, User, Clock, 
  Package, DollarSign, CheckCircle, RefreshCw,
  Truck, AlertCircle, Calendar, Hash
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { pedidoService } from '../services/pedidoService';
import type { Empleado } from '../types';
import type {Pedido, PedidoItem } from '../types';

// Helper para fecha local YYYY-MM-DD
const getLocalDate = () => new Date().toLocaleDateString('sv-SE');

export interface CrearPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  repartidores: Empleado[];
  pedidoParaEditar?: Pedido | null; 
}

interface ProductoItem {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  notasItem?: string;
}

export const CrearPedidoModal: React.FC<CrearPedidoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  repartidores
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    telefono: '',
    fecha_entrega: getLocalDate(),
    hora_entrega: '', 
    direccion: '',
    referencia: '',
    productos: [{ id: Date.now().toString(), nombre: '', cantidad: 1, precio: 0 }] as ProductoItem[],
    nota_adicional: '',
    repartidor_id: '',
    metodo_pago: 'efectivo' as 'efectivo' | 'yape' | 'plin' | 'transferencia',
  });

  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const userStr = localStorage.getItem('arlet_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setFormData(prev => ({ 
          ...prev, 
          repartidor_id: user.id || '',
          fecha_entrega: getLocalDate(),
          cliente_nombre: '',
          telefono: '',
          direccion: '',
          referencia: '',
          productos: [{ id: Date.now().toString(), nombre: '', cantidad: 1, precio: 0 }],
          nota_adicional: ''
        }));
      }
      setTelefonoError('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    generarHorasDisponibles();
  }, [formData.fecha_entrega]);

  const generarHorasDisponibles = () => {
    const horas: string[] = [];
    for (let h = 8; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        horas.push(`${hh}:${mm}`);
      }
    }
    setHorasDisponibles(horas);
    
    // Sugerir hora válida (ahora + 30 min)
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 30);
    const hActual = ahora.getHours();
    const mActual = ahora.getMinutes();

    const sugerida = horas.find(h => {
        const [hh, mm] = h.split(':').map(Number);
        if (formData.fecha_entrega === getLocalDate()) {
            return hh > hActual || (hh === hActual && mm >= mActual);
        }
        return true;
    });

    if (sugerida && !formData.hora_entrega) {
        setFormData(prev => ({ ...prev, hora_entrega: sugerida }));
    } else if (!formData.hora_entrega) {
        setFormData(prev => ({ ...prev, hora_entrega: '13:00' }));
    }
  };

  const calcularTotal = () => formData.productos.reduce((sum, p) => sum + (p.cantidad * (p.precio || 0)), 0);

  const agregarProducto = () => {
    setFormData(prev => ({
      ...prev,
      productos: [...prev.productos, { id: Date.now().toString(), nombre: '', cantidad: 1, precio: 0 }]
    }));
  };

  const actualizarProducto = (id: string, campo: string, valor: any) => {
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.map(p => p.id === id ? { ...p, [campo]: valor } : p)
    }));
  };

  const eliminarProducto = (id: string) => {
    if (formData.productos.length > 1) {
      setFormData(prev => ({ ...prev, productos: prev.productos.filter(p => p.id !== id) }));
    }
  };

  const validarTelefono = (tel: string) => {
    if (!tel) return 'Requerido';
    if (!tel.startsWith('9')) return 'Inicia con 9';
    if (tel.length !== 9) return '9 dígitos';
    return '';
  };

  const handleTelefonoChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 9);
    setFormData({ ...formData, telefono: digitsOnly });
    if (digitsOnly.length > 0) setTelefonoError(validarTelefono(digitsOnly));
    else setTelefonoError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Validar Teléfono
    const telErr = validarTelefono(formData.telefono);
    if (telErr) {
        setTelefonoError(telErr);
        setError('El número de teléfono debe ser válido (9 dígitos, inicia con 9).');
        return;
    }

    // 2. VALIDACIÓN CRONOLÓGICA (Requerimiento Principal)
    const ahora = new Date();
    const [anio, mes, dia] = formData.fecha_entrega.split('-').map(Number);
    const [hora, min] = formData.hora_entrega.split(':').map(Number);
    const fechaSeleccionada = new Date(anio, mes - 1, dia, hora, min);

    if (fechaSeleccionada < ahora) {
        setError('La fecha o la hora de entrega no pueden ser anteriores a la hora actual.');
        document.querySelector('.custom-scrollbar')?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // 3. Validar Productos
    if (formData.productos.some(p => !p.nombre.trim() || p.precio <= 0)) {
        setError('Complete los nombres y precios de los productos.');
        return;
    }

    setLoading(true);
    try {
      const userStr = localStorage.getItem('arlet_user');
      const user = userStr ? JSON.parse(userStr) : null;

      const infoProgramacion = `ENTREGA PROGRAMADA: ${formData.fecha_entrega} a las ${formData.hora_entrega}.`;
      const notaFinal = `${infoProgramacion} ${formData.nota_adicional}`.trim();

      const pedidoBase = {
        cliente_nombre: formData.cliente_nombre.trim(),
        direccion: formData.direccion.trim(),
        telefono: formData.telefono.trim(),
        detalles_pedido: formData.productos.map(p => ({
          item: p.nombre,
          cantidad: p.cantidad,
          precio: p.precio,
          notas: p.notasItem || ''
        })),
        total: calcularTotal(),
        notas: notaFinal,
        metodo_pago: formData.metodo_pago,
        repartidor_id: formData.repartidor_id || user?.id,
        empleado_id: user?.id,
        estado: 'pendiente',
        pagado: true,
        referencia: formData.referencia.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Intentamos insertar con las columnas extendidas
      // Si falla por "column not found", reintentamos solo con las columnas base
      const { error: insertError } = await supabase.from('pedidos').insert({
        ...pedidoBase,
        fecha_entrega: formData.fecha_entrega,
        hora_entrega: formData.hora_entrega
      });

      if (insertError) {
        if (insertError.message.includes('column') || insertError.code === '42703') {
           // FALLBACK: La base de datos no tiene las columnas nuevas, guardamos todo en "notas"
           const { error: fallbackError } = await supabase.from('pedidos').insert(pedidoBase);
           if (fallbackError) throw fallbackError;
        } else {
          throw insertError;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Hubo un problema al conectar con el servidor. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-brand-dark p-8 flex justify-between items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 bg-brand-gold/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
            <div>
              <h3 className="text-2xl font-bold text-brand-gold font-serif flex items-center gap-3">
                <Truck size={32} /> Nuevo Pedido Delivery
              </h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Módulo de Logística Arlet</p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-all bg-white/5 p-2 rounded-full"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {error && (
            <div className="bg-red-50 border border-red-100 p-5 mb-8 rounded-3xl flex items-center gap-4 animate-shake">
              <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-red-200">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Aviso del Sistema</p>
                <p className="text-sm text-red-700 font-bold">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                        <User size={16} className="text-brand-gold" />
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ficha del Cliente</h4>
                    </div>
                    
                    <div className="space-y-4">
                        <input 
                            type="text" placeholder="Nombre completo *" 
                            value={formData.cliente_nombre} 
                            onChange={e => setFormData({...formData, cliente_nombre: e.target.value})} 
                            className="w-full border-2 border-gray-100 p-4 rounded-2xl bg-gray-50 focus:bg-white focus:border-brand-gold outline-none transition-all font-bold text-gray-700" required 
                        />

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-black text-xs border-r border-gray-200 h-8 my-auto pr-3">
                                +51
                            </div>
                            <input 
                                type="tel" placeholder="987654321 *" 
                                value={formData.telefono} 
                                onChange={e => handleTelefonoChange(e.target.value)} 
                                className={`w-full border-2 p-4 pl-16 rounded-2xl bg-gray-50 focus:bg-white outline-none transition-all font-black tracking-widest ${telefonoError ? 'border-red-300 text-red-700' : 'border-gray-100 focus:border-brand-gold'}`} 
                                required 
                            />
                            {telefonoError && <p className="mt-1 text-[9px] text-red-500 font-black uppercase ml-1">{telefonoError}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {['efectivo', 'yape', 'transferencia', 'tarjeta'].map(metodo => (
                                <button 
                                    key={metodo} type="button"
                                    onClick={() => setFormData({...formData, metodo_pago: metodo as any})}
                                    className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${formData.metodo_pago === metodo ? 'border-brand-gold bg-brand-gold/5 text-brand-dark' : 'border-gray-100 text-gray-400'}`}
                                >
                                    {metodo}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Calendar size={16} className="text-brand-gold" />
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Programación</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Fecha *</label>
                            <input 
                                type="date" min={getLocalDate()} value={formData.fecha_entrega}
                                onChange={e => setFormData({...formData, fecha_entrega: e.target.value})}
                                className="w-full border-2 border-gray-100 p-4 rounded-2xl bg-gray-50 focus:border-brand-gold font-black text-gray-700 outline-none" required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Hora *</label>
                            <select 
                                value={formData.hora_entrega} 
                                onChange={e => setFormData({...formData, hora_entrega: e.target.value})} 
                                className="w-full border-2 border-gray-100 p-4 rounded-2xl bg-gray-50 focus:border-brand-gold font-black text-gray-700 outline-none cursor-pointer" required
                            >
                                {horasDisponibles.map(h => <option key={h} value={h}>{h} hrs</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <textarea 
                            placeholder="Dirección de entrega *" 
                            value={formData.direccion} 
                            onChange={e => setFormData({...formData, direccion: e.target.value})} 
                            className="w-full border-2 border-gray-100 p-4 rounded-2xl bg-gray-50 h-24 outline-none focus:border-brand-gold resize-none font-bold text-sm" required 
                        />
                        <input 
                            type="text" placeholder="Referencias (piso, dpto, etc.)" 
                            value={formData.referencia} 
                            onChange={e => setFormData({...formData, referencia: e.target.value})} 
                            className="w-full border-2 border-gray-100 p-4 rounded-2xl bg-gray-50 focus:border-brand-gold outline-none font-medium text-sm" 
                        />
                    </div>
                </div>
            </div>

            {/* Listado de Productos */}
            <div className="bg-gray-50/50 rounded-[35px] border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Listado de Productos</h4>
                    <button type="button" onClick={agregarProducto} className="text-[9px] bg-brand-dark text-brand-gold px-6 py-2.5 rounded-full font-black uppercase tracking-widest">+ Agregar Ítem</button>
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
                    {formData.productos.map((p, index) => (
                        <div key={p.id} className="flex gap-4 items-center bg-white p-5 rounded-3xl border border-gray-100 group hover:border-brand-gold/30 transition-all shadow-sm">
                            <input 
                                type="text" placeholder="Nombre del producto *" value={p.nombre} 
                                onChange={e => actualizarProducto(p.id, 'nombre', e.target.value)} 
                                className="flex-1 bg-transparent border-none font-black text-gray-800 outline-none text-sm" required 
                            />
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 flex items-center">
                                    <span className="text-[9px] font-black text-gray-400 mr-2">CANT</span>
                                    <input type="number" min="1" value={p.cantidad} onChange={e => actualizarProducto(p.id, 'cantidad', parseInt(e.target.value) || 1)} className="w-10 bg-transparent text-center font-black text-brand-dark outline-none" />
                                </div>
                                <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 flex items-center">
                                    <span className="text-[9px] font-black text-gray-400 mr-2">S/</span>
                                    <input type="number" step="0.1" value={p.precio} onChange={e => actualizarProducto(p.id, 'precio', parseFloat(e.target.value) || 0)} className="w-16 bg-transparent text-right font-black text-brand-dark outline-none" />
                                </div>
                                <button type="button" onClick={() => eliminarProducto(p.id)} className="p-3 text-red-300 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="bg-brand-dark p-7 rounded-[35px] text-white shadow-xl flex flex-col justify-center">
                    <p className="text-[9px] font-black text-brand-gold/50 uppercase tracking-[0.3em] mb-1">Monto Total</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-brand-gold/60">S/</span>
                        <span className="text-4xl font-black text-brand-gold">{calcularTotal().toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4 col-span-2">
                    <button type="submit" disabled={loading} className="w-full py-6 bg-brand-gold text-brand-dark rounded-[25px] font-black hover:bg-yellow-500 shadow-xl transition-all disabled:opacity-50 uppercase text-[11px] tracking-[0.3em] border-b-4 border-yellow-700">
                        {loading ? <RefreshCw className="animate-spin mx-auto" size={20} /> : 'Confirmar Pedido'}
                    </button>
                    <button type="button" onClick={onClose} className="w-full py-4 text-gray-400 font-black hover:text-gray-600 transition-colors uppercase text-[9px] tracking-widest">Descartar</button>
                </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
