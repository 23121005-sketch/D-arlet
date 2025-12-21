
import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, MapPin, Phone, User, Clock, 
  Package, DollarSign, CheckCircle, RefreshCw,
  Truck, AlertCircle, FileText
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { pedidoService } from '../services/pedidoService';
import type { Empleado } from '../types';

// Helper para fecha local YYYY-MM-DD
const getLocalDate = () => new Date().toLocaleDateString('sv-SE');

interface CrearPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  repartidores: Empleado[];
}

interface ProductoItem {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  notasItem?: string;
}

export const CrearPedidoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  repartidores: Empleado[];
}> = ({ isOpen, onClose, onSuccess, repartidores }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    cliente_nombre: '', telefono: '', hora_entrega: '13:00', direccion: '', referencia: '',
    productos: [{ id: Date.now().toString(), nombre: '', cantidad: 1, precio: 0 }],
    metodo_pago: 'efectivo', repartidor_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      const userStr = localStorage.getItem('arlet_user');
      if (userStr) setFormData(prev => ({ ...prev, repartidor_id: JSON.parse(userStr).id }));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_nombre || !formData.direccion || !formData.telefono) {
        setError('Complete campos marcados.');
        return;
    }
    setLoading(true);
    try {
      const { error: insErr } = await supabase.from('pedidos').insert({
          cliente_nombre: formData.cliente_nombre, direccion: formData.direccion, telefono: formData.telefono,
          total: formData.productos.reduce((acc, p) => acc + (p.cantidad * p.precio), 0),
          estado: 'pendiente', pagado: true, hora_entrega: formData.hora_entrega, referencia: formData.referencia,
          detalles_pedido: formData.productos.map(p => ({ item: p.nombre, cantidad: p.cantidad, precio: p.precio })),
          empleado_id: formData.repartidor_id, repartidor_id: formData.repartidor_id
      });
      if (insErr) throw insErr;
      onSuccess();
      onClose();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2"><Truck size={24}/> Nuevo Pedido Delivery</h3>
          <button onClick={onClose}><X size={24}/></button>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-2 text-xs mb-4 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Cliente *" value={formData.cliente_nombre} onChange={e => setFormData({...formData, cliente_nombre: e.target.value})} className="border p-2.5 rounded-lg" required />
                <input type="tel" placeholder="987654321 *" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="border p-2.5 rounded-lg" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input type="time" placeholder="Hora de Entrega *" value={formData.hora_entrega} onChange={e => setFormData({...formData, hora_entrega: e.target.value})} className="border p-2.5 rounded-lg" required />
                <input type="text" placeholder="Referencia" value={formData.referencia} onChange={e => setFormData({...formData, referencia: e.target.value})} className="border p-2.5 rounded-lg" />
            </div>
            <input type="text" placeholder="Dirección Exacta *" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full border p-2.5 rounded-lg" required />
            <div className="border-t pt-4">
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Items</h4>
                {formData.productos.map(p => (
                    <div key={p.id} className="flex gap-2 mb-2">
                        <input type="text" placeholder="Plato" value={p.nombre} onChange={e => setFormData({...formData, productos: formData.productos.map(pr => pr.id === p.id ? {...pr, nombre: e.target.value} : pr)})} className="flex-1 border p-2 rounded-lg text-xs" />
                        <input type="number" placeholder="S/" value={p.precio} onChange={e => setFormData({...formData, productos: formData.productos.map(pr => pr.id === p.id ? {...pr, precio: parseFloat(e.target.value)} : pr)})} className="w-20 border p-2 rounded-lg text-xs" />
                    </div>
                ))}
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-dark text-white p-4 rounded-xl font-bold shadow-xl">{loading ? 'Cargando...' : 'Registrar Orden'}</button>
        </form>
      </div>
    </div>
  );
};
