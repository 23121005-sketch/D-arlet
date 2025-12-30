import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  Truck,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  UserCheck,
  Clock,
  MapPin,
  LogOut,
  Activity,
  X,
  ChevronRight,
  Eye,
  Key,
  RefreshCw,
  UserPlus,
  Edit,
  Phone,
  Package,
  ChefHat,
  FileText,
  AlertCircle,
  Shield,
  Mail,
  Briefcase,
  User,
  Utensils,
  Receipt,
  Map,
  Bell,
  Lock,
  ArrowRight,
  Edit3,
  Download,
  Info,
  MessageSquareText,
  Send,
  FileCheck,
} from "lucide-react";
import { VolumeX, Volume2 } from "lucide-react";
import { CrearPedidoModal } from "../components/CrearPedidoModal";
import { pedidoService } from "../services/pedidoService";
import { auditoriaService } from "../services/auditoriaService";
import type { Auditoria, Pedido, Empleado } from "../types";
import { useAuth } from "../services/authService";
import { supabase } from "../supabaseClient";
import { empleadoService } from "../services/empleadoService";
import type { ValidationErrors } from "../types";
import type { Reclamacion } from "../types";

// --- INTERFAZ LOCAL PARA RESERVAS ---
const getLocalDate = () => {
  const d = new Date();
  return d.toLocaleDateString("sv-SE");
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
  zona: "Salon" | "Terraza" | "VIP" | "Eventos";
}

const MESAS_CONFIG: MesaConfig[] = [
  { id: "T-01", label: "T-01", capacidad: 2, zona: "Terraza" },
  { id: "T-02", label: "T-02", capacidad: 2, zona: "Terraza" },
  { id: "T-03", label: "T-03", capacidad: 4, zona: "Terraza" },
  { id: "T-04", label: "T-04", capacidad: 4, zona: "Terraza" },
  { id: "S-01", label: "S-01", capacidad: 4, zona: "Salon" },
  { id: "S-02", label: "S-02", capacidad: 4, zona: "Salon" },
  { id: "S-03", label: "S-03", capacidad: 6, zona: "Salon" },
  { id: "S-04", label: "S-04", capacidad: 6, zona: "Salon" },
  { id: "S-12", label: "S-12", capacidad: 4, zona: "Salon" },
  { id: "S-15", label: "S-15", capacidad: 6, zona: "Salon" },
  { id: "VIP-01", label: "VIP", capacidad: 10, zona: "VIP" },
  { id: "EVENTO", label: "Eventos", capacidad: 20, zona: "Eventos" },
];

const formatTicketId = (id: string) =>
  id ? `ORD-${id.slice(-6).toUpperCase()}` : "---";

const formatTime = (isoString?: string) => {
  if (!isoString) return "--:--";
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mapEstadoDBtoFront = (estadoDB: string) => {
  if (!estadoDB) return "Pendiente";
  const lower = estadoDB.toLowerCase();
  if (lower === "completada") return "Finalizada";
  return lower.charAt(0).toUpperCase() + lower.slice(1).replace("_", " ");
};

const mapEstadoFrontToDB = (estadoFront: string) => {
  const lower = estadoFront.toLowerCase();
  if (lower === "finalizada") return "completada";
  return lower;
};

// --- SHARED PANEL LAYOUT ---
const PanelLayout: React.FC<{
  title: string;
  children: React.ReactNode;
  active: string;
  user: any;
}> = ({ title, children, active, user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <Activity size={20} />,
      path: "/admin",
      roles: ["admin"],
    },
    {
      id: "delivery",
      label: "Pedidos",
      icon: <Truck size={20} />,
      path: "/delivery",
      roles: ["admin", "delivery"],
    },
    {
      id: "reservas",
      label: "Reservas",
      icon: <Calendar size={20} />,
      path: "/reservas",
      roles: ["admin", "reservas"],
    },
    {
      id: "cocina",
      label: "Cocina",
      icon: <ChefHat size={20} />,
      path: "/cocina-panel",
      roles: ["cocina", "admin"],
    },
    {
      id: "reclamaciones",
      label: "Reclamos",
      icon: <MessageSquareText size={20} />,
      path: "/admin-reclamos",
      roles: ["admin"],
    },
  ].filter((item) => item.roles.includes(user?.role || ""));

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <div className="w-64 bg-brand-dark text-white flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-serif text-brand-gold font-bold tracking-wide">
            Arlet's Panel
          </h2>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-gold text-brand-dark flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold truncate w-32">{user?.name}</p>
              <span className="text-[10px] bg-brand-gold text-brand-dark px-2 rounded-full font-black uppercase tracking-tighter">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                active === item.id
                  ? "bg-brand-gold text-brand-dark font-black shadow-lg shadow-yellow-900/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon} <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 text-red-400 hover:bg-red-900/20 w-full px-4 py-3 rounded-xl font-bold transition-all"
          >
            <LogOut size={20} /> Salir
          </button>
        </div>
      </div>
      <div className="flex-1 ml-64 p-8 overflow-x-hidden">
        <header className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 font-serif tracking-tight">
            {title}
          </h1>
          <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-black flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>{" "}
            SISTEMA ACTIVO
          </div>
        </header>
        {children}
      </div>
    </div>
  );
};

// --- COMPONENTES DE RESERVAS ---

const ReservaDetallesModal: React.FC<{
  reserva: ReservaLocal;
  onClose: () => void;
  onStatusChange: (id: string | number, status: string) => void;
  onDelete: (id: string | number) => void;
  onEdit: (reserva: ReservaLocal) => void;
  userRole?: string | null;
}> = ({ reserva, onClose, onStatusChange, onDelete, onEdit, userRole }) => {
  const isReadOnly = userRole === "admin";
  const isTerminal = ["Finalizada", "Cancelada", "No Asistio"].includes(
    reserva.status
  );
  const isConfirmada = reserva.status === "Confirmada";
  const isPendiente = reserva.status === "Pendiente";

  const getAllowedStatuses = () => {
    if (isPendiente)
      return ["Pendiente", "Confirmada", "Cancelada", "No Asistio"];
    if (isConfirmada)
      return ["Confirmada", "Finalizada", "Cancelada", "No Asistio"];
    return [reserva.status];
  };

  return (
    <div
      className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-dark p-6 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-brand-gold font-serif flex items-center gap-2">
              <Calendar size={24} /> Detalle de Reserva
            </h3>
            <p className="text-white/50 text-xs mt-1">ID: #{reserva.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              reserva.status === "Confirmada"
                ? "bg-green-50 border-green-200 text-green-800"
                : reserva.status === "Pendiente"
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : reserva.status === "Finalizada"
                ? "bg-blue-50 border-blue-200 text-blue-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {reserva.status === "Confirmada" ? (
                <CheckCircle size={24} />
              ) : reserva.status === "Cancelada" ? (
                <XCircle size={24} />
              ) : reserva.status === "Finalizada" ? (
                <UserCheck size={24} />
              ) : (
                <Clock size={24} />
              )}
              <div>
                <p className="text-xs font-bold uppercase opacity-70">
                  Estado Actual
                </p>
                <p className="text-lg font-bold">{reserva.status}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">
                  Cliente
                </p>
                <p className="font-bold text-gray-800 text-lg">
                  {reserva.customerName}
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Phone size={20} className="text-blue-600" />
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase">
                    Teléfono
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {reserva.phone}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase">
                Fecha y Hora
              </p>
              <p className="font-bold text-gray-800 text-lg">{reserva.date}</p>
              <p className="text-xl font-bold text-brand-dark">
                {reserva.time}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-600" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Registrado por
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {reserva.createdBy || "Desconocido"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase">
                Mesa Asignada
              </p>
              <p className="text-sm font-black text-brand-dark">
                {reserva.table || "Sin mesa"}
              </p>
            </div>
          </div>

          {!isReadOnly && !isTerminal && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                Cambiar Estado
              </label>
              <select
                value={reserva.status}
                onChange={(e) => onStatusChange(reserva.id, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-brand-gold outline-none bg-white"
              >
                {getAllowedStatuses().map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isReadOnly ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {isPendiente && (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(reserva);
                    }}
                    className="col-span-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 flex items-center justify-center gap-2 border border-gray-300"
                  >
                    <Edit size={16} /> Editar Datos
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("¿Eliminar esta reserva?")) {
                        onDelete(reserva.id);
                        onClose();
                      }
                    }}
                    className="col-span-2 border border-red-100 text-red-500 py-3 rounded-xl font-bold hover:bg-red-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Eliminar Reserva
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
            <button
              onClick={onClose}
              className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 shadow-lg"
            >
              Cerrar Ficha
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Mapa de Mesas (Visual)
const MapaMesas: React.FC<{ reservas: ReservaLocal[]; dateFilter: string }> = ({
  reservas,
  dateFilter,
}) => {
  const reservasActivas = reservas.filter(
    (r) =>
      r.date === dateFilter &&
      (r.status === "Confirmada" ||
        r.status === "Pendiente" ||
        r.status === "Finalizada")
  );

  const getMesaStatus = (mesaId: string) => {
    const reservasMesa = reservasActivas.filter((r) => r.table === mesaId);
    if (reservasMesa.length === 0) return { ocupada: false };
    return {
      ocupada: true,
      reservas: reservasMesa,
    };
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Map size={20} className="text-brand-dark" /> Mapa de Mesas (
        {dateFilter})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {["Terraza", "Salon", "VIP"].map((zona) => (
          <div
            key={zona}
            className={`p-4 rounded-xl border ${
              zona === "Terraza"
                ? "bg-green-50/50 border-green-100"
                : zona === "Salon"
                ? "bg-brand-gold/5 border-brand-gold/20"
                : "bg-purple-50 border-purple-100"
            }`}
          >
            <p
              className={`text-xs font-bold uppercase mb-3 text-center ${
                zona === "Terraza"
                  ? "text-green-700"
                  : zona === "Salon"
                  ? "text-brand-dark"
                  : "text-purple-700"
              }`}
            >
              Zona {zona}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {MESAS_CONFIG.filter((m) => m.zona === zona).map((mesa) => {
                const status = getMesaStatus(mesa.id);
                return (
                  <div
                    key={mesa.id}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition-all p-2 bg-white ${
                      status.ocupada
                        ? "border-red-200 shadow-sm"
                        : "border-gray-200"
                    }`}
                  >
                    <span className="font-bold text-lg">{mesa.label}</span>
                    <div className="flex items-center gap-1 text-[10px] opacity-60 mb-1">
                      <Users size={10} /> {mesa.capacidad}
                    </div>
                    {status.ocupada ? (
                      <div className="flex flex-col gap-1 w-full overflow-y-auto max-h-[60px] custom-scrollbar">
                        {status.reservas?.map((r, idx) => (
                          <span
                            key={idx}
                            className={`text-[9px] font-bold px-1 rounded text-center truncate ${
                              r.status === "Finalizada"
                                ? "bg-gray-100 text-gray-500"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {r.time} - {r.customerName.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-green-600 font-bold">
                        LIBRE
                      </span>
                    )}
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

// 3. Nueva/Editar Reserva Modal (Con validación de conflictos)
const NuevaReservaModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (reserva: any) => Promise<void>;
  reservaEditar?: ReservaLocal | null;
  reservasExistentes?: ReservaLocal[];
}> = ({ isOpen, onClose, onSave, reservaEditar, reservasExistentes = [] }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    observaciones: "",
    fecha: getLocalDate(),
    hora: "13:00",
    personas: 2,
    mesaManual: "",
  });
  const [error, setError] = useState("");
  const [telefonoError, setTelefonoError] = useState("");
  const [fechaError, setFechaError] = useState("");
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AUTO-SELECCIÓN DE MESA
  useEffect(() => {
    if (isOpen && !reservaEditar) {
      setIsAutoSelecting(true);
      // Filtrar mesas ocupadas en esa fecha y hora (considerando margen de 2 horas aprox)
      const mesasOcupadas = reservasExistentes
        .filter(
          (r) =>
            r.date === formData.fecha &&
            r.time === formData.hora &&
            r.status !== "Cancelada"
        )
        .map((r) => r.table);

      // Buscar la mejor mesa disponible por capacidad
      const mesaDisponible = MESAS_CONFIG.find(
        (m) => m.capacidad >= formData.personas && !mesasOcupadas.includes(m.id)
      );

      if (mesaDisponible) {
        setFormData((prev) => ({ ...prev, mesaManual: mesaDisponible.id }));
      } else {
        setFormData((prev) => ({ ...prev, mesaManual: "" }));
      }
      setIsAutoSelecting(false);
    }
  }, [
    formData.personas,
    formData.fecha,
    formData.hora,
    isOpen,
    reservasExistentes,
    reservaEditar,
  ]);

  useEffect(() => {
    if (isOpen) {
      if (reservaEditar) {
        setFormData({
          nombre: reservaEditar.customerName,
          telefono: reservaEditar.phone,
          email: reservaEditar.email || "",
          observaciones: reservaEditar.notes || "",
          fecha: reservaEditar.date,
          hora: reservaEditar.time,
          personas: reservaEditar.people,
          mesaManual: reservaEditar.table || "",
        });
      } else {
        setFormData({
          nombre: "",
          telefono: "",
          email: "",
          observaciones: "",
          fecha: getLocalDate(),
          hora: "13:00",
          personas: 2,
          mesaManual: "",
        });
      }
      setTelefonoError("");
      setFechaError("");
      setError("");
    }
  }, [isOpen, reservaEditar]);

  const validarTelefono = (tel: string) => {
    if (!tel) return "Requerido";
    if (!tel.startsWith("9")) return "Inicia con 9";
    if (tel.length < 9) return `${tel.length}/9 dgt`;
    if (!/^9\d{8}$/.test(tel)) return "Inválido";
    return "";
  };

  const validarFecha = (fecha: string) => {
    const hoy = getLocalDate();
    if (!fecha) return "Requerido";
    if (fecha < hoy) return "¡Fecha pasada!";
    return "";
  };

  const handleTelefonoChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 9);
    setFormData({ ...formData, telefono: digitsOnly });
    if (digitsOnly.length > 0) {
      setTelefonoError(validarTelefono(digitsOnly));
    } else {
      setTelefonoError("");
    }
  };

  const handleFechaChange = (value: string) => {
    setFormData({ ...formData, fecha: value });
    setFechaError(validarFecha(value));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const telErr = validarTelefono(formData.telefono);
    const dateErr = validarFecha(formData.fecha);

    if (telErr || dateErr) {
      setTelefonoError(telErr);
      setFechaError(dateErr);
      setError("Por favor corrija los errores resaltados.");
      return;
    }

    if (!formData.nombre || !formData.telefono) {
      setError("Complete los campos obligatorios (*)");
      return;
    }

    const reservaData = {
      customerName: formData.nombre,
      phone: formData.telefono,
      email: formData.email,
      date: formData.fecha,
      time: formData.hora,
      people: formData.personas,
      status: reservaEditar ? reservaEditar.status : "Pendiente",
      table: formData.mesaManual,
      notes: formData.observaciones,
    };

    setIsSubmitting(true);
    try {
      await onSave(reservaData);
      onClose(); // Solo cerrar si onSave termina sin errores
    } catch (err: any) {
      setError(
        err.message || "Ocurrió un error inesperado al guardar la reserva."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[95vh] border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-dark p-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 bg-brand-gold/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <h3 className="text-xl font-bold text-brand-gold font-serif flex items-center gap-3 relative z-10">
            <div className="bg-brand-gold/20 p-2 rounded-xl text-brand-gold shadow-inner">
              <Calendar size={22} />
            </div>
            {reservaEditar ? "Editar Reserva" : "Nueva Reserva"}
          </h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-all p-2 hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8 overflow-y-auto custom-scrollbar"
        >
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[11px] font-black flex items-center gap-4 animate-shake border border-red-100 shadow-sm uppercase tracking-widest leading-tight">
              <div className="bg-red-600 text-white p-1.5 rounded-full flex-shrink-0">
                <AlertCircle size={16} />
              </div>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Cliente Solicitante *
              </label>
              <div className="relative group">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-gold transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className={`w-full border-2 p-3 pl-10 rounded-2xl outline-none transition-all font-bold text-gray-700 bg-gray-50 focus:bg-white ${
                    formData.nombre.length > 3
                      ? "border-green-100 focus:border-green-400"
                      : "border-gray-100 focus:border-brand-gold"
                  }`}
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Teléfono Móvil *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 border-r-2 border-gray-100 h-8 my-auto pr-2">
                  <span className="text-[10px] font-black">+51</span>
                </div>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  className={`w-full border-2 p-3 pl-14 rounded-2xl outline-none transition-all font-black text-gray-700 bg-gray-50 focus:bg-white tracking-widest ${
                    telefonoError
                      ? "border-red-200 focus:border-red-400 bg-red-50"
                      : formData.telefono.length === 9
                      ? "border-green-200 focus:border-green-400 bg-green-50"
                      : "border-gray-100 focus:border-brand-gold"
                  }`}
                  placeholder="987654321"
                />
                {telefonoError && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-red-500 uppercase tracking-tighter bg-white px-2 py-1 rounded-lg border border-red-50 shadow-sm">
                    {telefonoError}
                  </span>
                )}
              </div>
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Fecha de Reserva *
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={getLocalDate()}
                  value={formData.fecha}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  className={`w-full border-2 p-3 rounded-2xl outline-none transition-all font-black text-gray-700 bg-gray-50 focus:bg-white appearance-none cursor-pointer ${
                    fechaError
                      ? "border-red-200 focus:border-red-400"
                      : "border-gray-100 focus:border-brand-gold"
                  }`}
                />
                <Calendar
                  className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${
                    fechaError ? "text-red-400" : "text-gray-300"
                  }`}
                  size={18}
                />
                {fechaError && (
                  <p className="text-[9px] text-red-600 font-black uppercase mt-1 ml-2 animate-pulse">
                    {fechaError}
                  </p>
                )}
              </div>
            </div>

            {/* Hora */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Hora Programada *
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={formData.hora}
                  onChange={(e) =>
                    setFormData({ ...formData, hora: e.target.value })
                  }
                  className="w-full border-2 border-gray-100 p-3 rounded-2xl outline-none focus:border-brand-gold transition-all font-black text-gray-700 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                />
                <Clock
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                  size={18}
                />
              </div>
            </div>

            {/* Mesa */}
            <div className="relative space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                Mesa Asignada{" "}
                {isAutoSelecting && (
                  <span className="animate-pulse text-brand-gold text-[8px] bg-brand-gold/10 px-2 py-0.5 rounded-full">
                    SISTEMA BUSCANDO...
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  value={formData.mesaManual}
                  onChange={(e) =>
                    setFormData({ ...formData, mesaManual: e.target.value })
                  }
                  className="w-full border-2 border-gray-100 p-3 rounded-2xl outline-none focus:border-brand-gold bg-gray-50 focus:bg-white font-black text-gray-700 appearance-none cursor-pointer"
                >
                  <option value="">-- Sin mesa disponible --</option>
                  {MESAS_CONFIG.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} (Aforo: {m.capacidad})
                    </option>
                  ))}
                </select>
                <ChevronRight
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 rotate-90 pointer-events-none"
                  size={18}
                />
              </div>
              {!formData.mesaManual && (
                <p className="text-[9px] text-red-400 font-bold mt-1 ml-2 italic">
                  No hay disponibilidad para este horario/aforo.
                </p>
              )}
            </div>

            {/* Personas */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Aforo (Personas)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={formData.personas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personas: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full border-2 border-gray-100 p-3 rounded-2xl outline-none focus:border-brand-gold font-black text-gray-700 bg-gray-50 focus:bg-white"
                />
                <Users
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                  size={18}
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Observaciones Especiales
            </label>
            <textarea
              placeholder="Ej. Alergias, cumpleaños, ubicación específica..."
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              className="w-full border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-brand-gold bg-gray-50 focus:bg-white font-medium text-gray-700 transition-all resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black hover:bg-gray-200 transition-all uppercase text-[10px] tracking-[0.2em] disabled:opacity-50"
            >
              Descartar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-brand-dark text-brand-gold rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 uppercase text-[10px] tracking-[0.3em] border border-brand-gold/30 group disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <CheckCircle
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
              )}
              {isSubmitting ? "Validando..." : "Confirmar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HistorialAvanzadoSection: React.FC<{
  historial: Auditoria[];
  onRefresh: () => void;
  loading: boolean;
  estadisticas: { total: number; hoy: number } | null;
}> = ({ historial, onRefresh, loading, estadisticas }) => {
  const [filters, setFilters] = useState({
    usuario: "",
    rol: "",
    modulo: "",
    fecha: getLocalDate(),
  });

  const filteredLogs = historial.filter((log) => {
    const matchUser = log.empleado_nombre
      ?.toLowerCase()
      .includes(filters.usuario.toLowerCase());
    const matchRol = filters.rol ? log.empleado_rol === filters.rol : true;
    const matchModulo = filters.modulo
      ? log.tabla_afectada === filters.modulo
      : true;
    const matchDate = filters.fecha
      ? log.created_at.startsWith(filters.fecha)
      : true;
    return matchUser && matchRol && matchModulo && matchDate;
  });

  const getActionBadge = (accion: string) => {
    const text = accion.replace("MANUAL_", "").replace(/_/g, " ");
    let colors = "bg-gray-100 text-gray-600 border-gray-200";
    if (accion.includes("CREAR"))
      colors = "bg-green-50 text-green-700 border-green-200";
    if (accion.includes("ACTUALIZAR") || accion.includes("EDITAR"))
      colors = "bg-blue-50 text-blue-700 border-blue-200";
    if (accion.includes("ELIMINAR") || accion.includes("CANCELAR"))
      colors = "bg-red-50 text-red-700 border-red-200";
    if (accion.includes("CAMBIO_ESTADO"))
      colors = "bg-orange-50 text-orange-700 border-orange-200";
    if (accion.includes("LOGIN") || accion.includes("ACCESO"))
      colors = "bg-indigo-50 text-indigo-700 border-indigo-200";

    return (
      <span
        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${colors}`}
      >
        {text}
      </span>
    );
  };

  const getModuloBadge = (modulo: string) => {
    const map: any = {
      empleados: {
        label: "Empleados",
        icon: <Users size={12} />,
        color: "text-purple-600 bg-purple-50",
      },
      pedidos: {
        label: "Pedidos",
        icon: <Package size={12} />,
        color: "text-blue-600 bg-blue-50",
      },
      reservas: {
        label: "Reservas",
        icon: <Calendar size={12} />,
        color: "text-amber-600 bg-amber-50",
      },
      auditoria: {
        label: "Sistema",
        icon: <Shield size={12} />,
        color: "text-slate-600 bg-slate-50",
      },
    };
    const config = map[modulo] || {
      label: modulo,
      icon: <Info size={12} />,
      color: "text-gray-600 bg-gray-50",
    };
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-[10px] ${config.color}`}
      >
        {config.icon} <span>{config.label}</span>
      </div>
    );
  };

  return (
    <div className="bg-white p-8 rounded-[48px] shadow-sm border border-gray-100 mb-8 animate-fadeIn">
      {/* Header con estadísticas rápidas */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 px-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-dark text-brand-gold rounded-2xl shadow-lg">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">
                Bitácora de Operaciones
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                Control de auditoría y trazabilidad en tiempo real
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Actividad de Hoy
            </p>
            <p className="text-xl font-black text-brand-dark">
              {estadisticas?.hoy || 0}
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-brand-dark hover:text-white transition-all shadow-sm"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => auditoriaService.exportarAExcel(filteredLogs)}
            className="flex items-center gap-2 px-6 py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 shadow-lg transition-all active:scale-95"
          >
            <Download size={16} /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtros Profesionales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">
            Usuario
          </label>
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-gold transition-colors"
              size={14}
            />
            <input
              type="text"
              placeholder="Buscar ejecutor..."
              className="w-full pl-9 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-brand-gold/10 transition-all"
              value={filters.usuario}
              onChange={(e) =>
                setFilters({ ...filters, usuario: e.target.value })
              }
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">
            Módulo
          </label>
          <select
            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-brand-gold/10 appearance-none cursor-pointer"
            value={filters.modulo}
            onChange={(e) => setFilters({ ...filters, modulo: e.target.value })}
          >
            <option value="">Todos los Módulos</option>
            <option value="empleados">Gestión Empleados</option>
            <option value="pedidos">Pedidos & Cocina</option>
            <option value="reservas">Reservas</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">
            Rol Usuario
          </label>
          <select
            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-brand-gold/10 appearance-none cursor-pointer"
            value={filters.rol}
            onChange={(e) => setFilters({ ...filters, rol: e.target.value })}
          >
            <option value="">Cualquier Rol</option>
            <option value="admin">Administrador</option>
            <option value="delivery">Delivery</option>
            <option value="reservas">Reservas</option>
            <option value="cocina">Cocina</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">
            Fecha Evento
          </label>
          <input
            type="date"
            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-brand-gold/10 cursor-pointer"
            value={filters.fecha}
            onChange={(e) => setFilters({ ...filters, fecha: e.target.value })}
          />
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="overflow-x-auto rounded-[32px] border border-gray-100 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-brand-dark text-white">
            <tr className="text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-5">Fecha / Hora</th>
              <th className="px-6 py-5">Usuario / Rol</th>
              <th className="px-6 py-5">Módulo</th>
              <th className="px-6 py-5">Acción Realizada</th>
              <th className="px-6 py-5">Descripción Detallada</th>
              <th className="px-6 py-5 text-center">Referencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest"
                >
                  Actualizando registros...
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const date = new Date(log.created_at);
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50/80 transition-all group"
                  >
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-black text-gray-800">
                        {date.toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">
                        {date.toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-brand-dark border border-gray-200 uppercase">
                          {log.empleado_nombre?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-800 uppercase tracking-tighter">
                            {log.empleado_nombre}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">
                            {log.empleado_rol || "sistema"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {getModuloBadge(log.tabla_afectada)}
                    </td>
                    <td className="px-6 py-5">{getActionBadge(log.accion)}</td>
                    <td className="px-6 py-5">
                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed max-w-xs line-clamp-2 italic">
                        {log.detalles?.empleado_eliminado
                          ? `Se eliminó al empleado: ${log.detalles.empleado_eliminado}`
                          : log.detalles?.nuevo_empleado
                          ? `Registro de nuevo personal: ${log.detalles.nuevo_empleado}`
                          : log.detalles?.cambio
                          ? `Cambio de estado: ${log.detalles.cambio}`
                          : JSON.stringify(log.detalles)
                              .replace(/{|}|"/g, "")
                              .slice(0, 100) || "Sin detalles adicionales"}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-[9px] font-mono text-gray-300 font-black tracking-tighter">
                        {log.registro_id
                          ? `REF-${log.registro_id.slice(-6).toUpperCase()}`
                          : "---"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <div className="flex flex-col items-center opacity-20">
                    <Activity size={64} />
                    <p className="mt-4 font-black uppercase text-[10px] tracking-widest">
                      No se encontraron registros para los filtros aplicados
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-between items-center px-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Página 1 de 1 (Mostrando {filteredLogs.length} registros)
        </p>
        <div className="flex gap-2">
          <button
            disabled
            className="px-4 py-2 border rounded-xl text-[10px] font-black uppercase opacity-30 cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            disabled
            className="px-4 py-2 border rounded-xl text-[10px] font-black uppercase opacity-30 cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export const ReservationPanel = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(getLocalDate());
  const [reservations, setReservations] = useState<ReservaLocal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<ReservaLocal | null>(
    null
  );
  const [, setLoading] = useState(false);
  const [editingReserva, setEditingReserva] = useState<ReservaLocal | null>(
    null
  );

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reservas")
        .select(`*, empleados:empleado_id (nombre)`)
        .order("fecha", { ascending: true });

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
          createdBy: item.empleados?.nombre || "Desconocido",
        }));
        setReservations(mappedData);
      }
    } catch (error: any) {
      console.error("Error cargando reservas:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
    const subscription = supabase
      .channel("reservas_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservas" },
        () => {
          fetchReservations();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchReservations]);

  const handleStatusChange = async (id: string | number, newStatus: string) => {
    const dbStatus = mapEstadoFrontToDB(newStatus);
    try {
      const { error } = await supabase
        .from("reservas")
        .update({ estado: dbStatus })
        .eq("id", id);
      if (!error) {
        await auditoriaService.registrarReserva("ESTADO", id, {
          nuevo_estado: newStatus,
        });
      }
      fetchReservations();
    } catch (e) {
      alert("Error actualizando estado");
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      const resToDelete = reservations.find((r) => r.id === id);
      const { error } = await supabase.from("reservas").delete().eq("id", id);
      if (!error) {
        await auditoriaService.registrarReserva("ELIMINAR", id, {
          cliente: resToDelete?.customerName,
        });
      }
      fetchReservations();
    } catch (e) {
      alert("Error eliminando");
    }
  };

  const handleGuardarReserva = async (datosReserva: any) => {
    const hoy = getLocalDate();
    if (datosReserva.date < hoy) {
      throw new Error("La fecha de reserva no puede ser anterior a hoy.");
    }

    const userStr = localStorage.getItem("arlet_user");
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
      empleado_id: userData?.id,
    };

    if (editingReserva) {
      const { error } = await supabase
        .from("reservas")
        .update(resDB)
        .eq("id", editingReserva.id);
      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "La mesa seleccionada ya se encuentra ocupada para esa fecha y hora."
          );
        }
        throw error;
      }
      await auditoriaService.registrarReserva("EDITAR", editingReserva.id, {
        cliente: resDB.cliente_nombre,
      });
    } else {
      const { data, error } = await supabase
        .from("reservas")
        .insert(resDB)
        .select();
      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "La mesa seleccionada ya se encuentra ocupada para esa fecha y hora."
          );
        }
        throw error;
      }
      if (data?.[0]) {
        await auditoriaService.registrarReserva("CREAR", data[0].id, {
          cliente: resDB.cliente_nombre,
        });
      }
    }

    fetchReservations();
  };

  const filteredReservations = reservations.filter((res) => {
    const matchesSearch = res.customerName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDate = res.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  return (
    <PanelLayout title="Gestión de Reservas" active="reservas" user={user}>
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center border border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              viewMode === "list"
                ? "bg-brand-dark text-white shadow-lg"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Listado
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              viewMode === "map"
                ? "bg-brand-dark text-white shadow-lg"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Mesas
          </button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-brand-gold"
          />
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>
          {user?.role !== "admin" && (
            <button
              onClick={() => {
                setEditingReserva(null);
                setShowModal(true);
              }}
              className="bg-brand-gold text-brand-dark px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-all shadow-md"
            >
              + Nueva Reserva
            </button>
          )}
        </div>
      </div>

      {viewMode === "map" ? (
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
              {filteredReservations.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-brand-dark">
                    {res.time}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">
                      {res.customerName}
                    </p>
                    <p className="text-[10px] text-gray-400">{res.phone}</p>
                  </td>
                  <td className="px-6 py-4 font-black text-brand-dark">
                    {res.table || "---"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        res.status === "Confirmada"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : res.status === "Pendiente"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : res.status === "Finalizada"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {res.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedReserva(res);
                        setShowDetailModal(true);
                      }}
                      className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReservations.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-20 text-center text-gray-400 italic font-medium"
                  >
                    No hay reservas para este día
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <NuevaReservaModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleGuardarReserva}
          reservaEditar={editingReserva}
          reservasExistentes={reservations}
        />
      )}
      {showDetailModal && selectedReserva && (
        <ReservaDetallesModal
          reserva={selectedReserva}
          onClose={() => setShowDetailModal(false)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onEdit={(r) => {
            setEditingReserva(r);
            setShowModal(true);
          }}
          userRole={user?.role}
        />
      )}
    </PanelLayout>
  );
};

const PedidoDetallesModal: React.FC<{
  pedido: Pedido;
  onClose: () => void;
}> = ({ pedido, onClose }) => {
  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-brand-dark text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-gold/20 rounded-xl text-brand-gold">
              <Receipt size={24} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-black text-brand-gold uppercase tracking-tighter">
                Detalle de Orden
              </h3>
              <p className="text-[10px] font-mono text-white/50">
                {formatTicketId(pedido.id)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {/* TRAZABILIDAD DE TIEMPOS */}
          <div className="grid grid-cols-3 gap-1 bg-gray-50 rounded-2xl border border-gray-100 p-1">
            <div className="p-3 text-center border-r border-gray-200">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Registro
              </p>
              <p className="font-mono text-gray-800 font-bold">
                {formatTime(pedido.created_at)}
              </p>
            </div>
            <div className="p-3 text-center border-r border-gray-200">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Salida
              </p>
              <p className="font-mono text-indigo-600 font-bold">
                {formatTime(pedido.hora_salida_real)}
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Entrega
              </p>
              <p className="font-mono text-green-600 font-bold">
                {formatTime(pedido.hora_entrega_real)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] border-b border-gray-100 pb-2">
                Datos Cliente
              </h4>
              <div>
                <p className="text-xs font-black text-gray-800">
                  {pedido.cliente_nombre}
                </p>
                <p className="text-sm font-bold text-blue-600 flex items-center gap-1 mt-1">
                  <Phone size={14} /> {pedido.telefono}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {pedido.direccion}
                </p>
                {pedido.referencia && (
                  <p className="mt-2 p-2 bg-yellow-50 text-[10px] italic border border-yellow-100 rounded-lg text-yellow-800">
                    Ref: {pedido.referencia}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-4 text-right">
              <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] border-b border-gray-100 pb-2">
                Reparto
              </h4>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                  Responsable
                </p>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                  <span className="text-xs font-black text-gray-800">
                    {pedido.repartidores?.nombre || "SISTEMA"}
                  </span>
                  <div className="w-6 h-6 bg-brand-dark text-brand-gold rounded-full flex items-center justify-center text-[10px] font-black">
                    {pedido.repartidores?.nombre?.charAt(0) || "A"}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                  Método de Pago
                </p>
                <p className="text-xs font-black text-brand-dark uppercase">
                  {pedido.metodo_pago}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[8px] font-black mt-1 ${
                    pedido.pagado
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {pedido.pagado ? "✓ PAGADO" : "✗ PENDIENTE"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-4">
              Detalle de Productos
            </h4>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 text-gray-400 border-b border-gray-200 uppercase font-black text-[9px]">
                  <tr>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(pedido.detalles_pedido || []).map(
                    (item: any, i: number) => (
                      <tr key={i} className="hover:bg-white transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-800">
                          {item.item}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-gray-500">
                          {item.cantidad}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-gray-800">
                          S/ {(item.cantidad * item.precio).toFixed(2)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
                <tfoot className="bg-brand-dark text-brand-gold border-t border-brand-gold/20">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest"
                    >
                      Total Orden
                    </td>
                    <td className="px-4 py-4 text-right font-black text-xl">
                      S/ {pedido.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {pedido.notas && (
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="text-orange-500 mt-1 flex-shrink-0"
              />
              <div>
                <p className="text-[10px] font-black text-orange-700 uppercase mb-1">
                  Notas del Pedido
                </p>
                <p className="text-sm text-orange-900 italic font-medium">
                  "{pedido.notas}"
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-brand-dark text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-xl shadow-gray-200"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};

export const DeliveryPanel = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(getLocalDate());
  const [selPedido, setSelPedido] = useState<Pedido | null>(null);
  const [pedidoAEditar, setPedidoAEditar] = useState<Pedido | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // NUEVO: Estados para Alerta Sonora y Visual
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showReadyAlert, setShowReadyAlert] = useState(false);
  const [readyOrderName, setReadyOrderName] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seenReadyIds = useRef<Set<string>>(new Set());

  const isAdmin = user?.role === "admin";

  // NUEVO: Inicializar audio para Delivery
  useEffect(() => {
    audioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
    );
    audioRef.current.volume = 0.5;
  }, []);

  const enableAudio = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current?.pause();
          setAudioEnabled(true);
        })
        .catch((e) => console.error("Error activando audio:", e));
    }
  };

  const playAlert = useCallback(() => {
    if (audioEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => console.warn("Audio bloqueado", e));
    }
  }, [audioEnabled]);

  const cargarData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          "*, creador:empleado_id(nombre), repartidores:repartidor_id(nombre)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPedidos(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // MONITOR: Detectar pedidos LISTOS PARA REPARTO
  useEffect(() => {
    const listosParaReparto = pedidos.filter(
      (p) => p.estado === "listo_para_reparto"
    );
    let hasNewReady = false;
    let lastReadyName = "";

    listosParaReparto.forEach((p) => {
      if (!seenReadyIds.current.has(p.id)) {
        seenReadyIds.current.add(p.id);
        hasNewReady = true;
        lastReadyName = p.cliente_nombre;
      }
    });

    if (hasNewReady && pedidos.length > 0) {
      setReadyOrderName(lastReadyName);
      setShowReadyAlert(true);
      playAlert();
      setTimeout(() => setShowReadyAlert(false), 8000);
    }
  }, [pedidos, playAlert]);

  useEffect(() => {
    cargarData();
    const sub = supabase
      .channel("pedidos-live-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => {
          cargarData();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [cargarData]);

  const handleStatus = async (id: string, next: string) => {
    try {
      await pedidoService.cambiarEstadoPedido(id, next);
      await auditoriaService.registrarPedido("ESTADO", id, {
        nuevo_estado: next,
      });
      await cargarData();
    } catch (e) {
      alert("Error al actualizar estado.");
    }
  };

  // Filtro de fecha
  const filtered = pedidos.filter((p) => {
    const matchSearch =
      p.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const orderDate = p.created_at
      ? new Date(p.created_at).toLocaleDateString("sv-SE")
      : "";
    const matchDate = orderDate === dateFilter;
    return matchSearch && matchDate && p.estado !== "cancelado";
  });

  const columns = [
    { id: "pendiente", label: "Pendientes", color: "border-t-blue-400" },
    { id: "en_preparacion", label: "En Cocina", color: "border-t-yellow-400" },
    {
      id: "listo_para_reparto",
      label: "Listos para Recojo",
      color: "border-t-orange-500",
    },
    { id: "en_camino", label: "En Camino", color: "border-t-purple-400" },
    { id: "entregado", label: "Entregados", color: "border-t-green-400" },
  ];

  return (
    <PanelLayout title="Gestión de Reparto" active="delivery" user={user}>
      {/* ALERTA VISUAL: EL PEDIDO ESTÁ LISTO PARA RECOJO */}
      {showReadyAlert && (
        <div className="fixed bottom-10 right-10 z-[100] animate-bounce-in">
          <div className="bg-brand-dark border-2 border-brand-gold shadow-2xl rounded-3xl p-6 flex items-center gap-5 max-w-sm">
            <div className="bg-brand-gold p-3 rounded-2xl text-brand-dark">
              <Bell size={24} className="animate-pulse" />
            </div>
            <div>
              <p className="text-brand-gold font-black text-sm uppercase tracking-tighter leading-tight">
                El pedido está listo para recojo
              </p>
              <p className="text-white text-[10px] font-bold uppercase tracking-widest mt-1">
                Cliente: {readyOrderName}
              </p>
              <p className="text-gray-400 text-[9px] mt-1 italic">
                Notificación oficial de Cocina.
              </p>
            </div>
            <button
              onClick={() => setShowReadyAlert(false)}
              className="text-white/30 hover:text-white p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-[56px] shadow-sm border border-gray-100 mb-12 flex justify-between items-center animate-fadeIn">
        <div className="flex gap-5 items-center">
          <div className="relative group">
            <Search
              size={22}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar orden..."
              className="pl-16 pr-8 py-5 bg-gray-50 border-none rounded-[32px] text-xs font-black outline-none focus:ring-4 focus:ring-brand-gold/10 w-80 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="py-5 px-8 bg-gray-50 border-none rounded-[32px] text-xs font-black outline-none focus:ring-4 focus:ring-brand-gold/10 shadow-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          {!audioEnabled && (
            <button
              onClick={enableAudio}
              className="bg-purple-50 text-purple-700 px-6 py-4 rounded-3xl border border-purple-200 animate-pulse hover:bg-purple-100 transition-all shadow-sm flex items-center gap-2"
            >
              <VolumeX size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Activar Sonido Reparto
              </span>
            </button>
          )}
          {!isAdmin && (
            <button
              onClick={() => {
                setPedidoAEditar(null);
                setShowAdd(true);
              }}
              className="bg-brand-gold text-brand-dark px-14 py-5 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-yellow-500 active:scale-95 transition-all"
            >
              <Plus size={24} /> Registrar Pedido
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`flex flex-col min-h-[700px] bg-gray-50/50 rounded-[56px] p-6 border-t-[10px] shadow-sm transition-all ${col.color}`}
          >
            <div className="flex justify-between items-center mb-10 px-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">
                {col.label}
              </h3>
              <span className="bg-white px-5 py-2 rounded-2xl text-[11px] font-black text-brand-dark shadow-sm border border-gray-100">
                {filtered.filter((p) => p.estado === col.id).length}
              </span>
            </div>
            <div className="space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar pr-2">
              {filtered
                .filter((p) => p.estado === col.id)
                .map((p) => (
                  <OrderCard
                    key={p.id}
                    pedido={p}
                    onStatusChange={handleStatus}
                    onView={setSelPedido}
                    onEdit={(ped) => {
                      setPedidoAEditar(ped);
                      setShowAdd(true);
                    }}
                    isAdmin={isAdmin}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <CrearPedidoModal
          isOpen={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={cargarData}
          repartidores={[]}
          pedidoParaEditar={pedidoAEditar}
        />
      )}
      {selPedido && (
        <PedidoDetallesModal
          pedido={selPedido}
          onClose={() => setSelPedido(null)}
        />
      )}
    </PanelLayout>
  );
};

const OrderCard: React.FC<{
  pedido: Pedido;
  onStatusChange: (id: string, next: string) => void;
  onView: (p: Pedido) => void;
  onEdit: (p: Pedido) => void;
  isAdmin: boolean;
}> = ({ pedido, onStatusChange, onView, onEdit, isAdmin }) => {
  // Configuración de estados y transiciones
  const statusConfig: any = {
    pendiente: {
      label: "Registrado",
      color: "bg-blue-100 text-blue-700",
      next: "en_preparacion",
      nextLabel: "A Cocina",
      editable: true,
    },
    en_preparacion: {
      label: "En Cocina",
      color: "bg-yellow-100 text-yellow-700",
      next: null,
      nextLabel: null,
      editable: false,
    },
    listo_para_reparto: {
      label: "Listo Recojo",
      color: "bg-orange-100 text-orange-700",
      next: "en_camino",
      nextLabel: "Iniciar Reparto",
      editable: false,
    },
    en_camino: {
      label: "En Camino",
      color: "bg-purple-100 text-purple-700",
      next: "entregado",
      nextLabel: "Entregar",
      editable: false,
    },
    entregado: {
      label: "Entregado",
      color: "bg-green-100 text-green-700",
      next: null,
      editable: false,
    },
  };

  const cfg = statusConfig[pedido.estado] || {
    label: pedido.estado,
    color: "bg-gray-100",
    next: null,
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[9px] font-mono text-gray-300 tracking-tighter">
          #{pedido.id.slice(-6).toUpperCase()}
        </span>
        <span
          className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${cfg.color}`}
        >
          {cfg.label}
        </span>
      </div>
      <h4 className="font-black text-sm text-gray-800 truncate mb-1 uppercase tracking-tighter">
        {pedido.cliente_nombre}
      </h4>
      <div className="flex items-center gap-1.5 mb-4">
        <Phone size={12} className="text-blue-500" />
        <span className="text-[11px] font-black text-blue-600">
          {pedido.telefono}
        </span>
      </div>

      {/* Mensaje Informativo si no es editable */}
      {!cfg.editable && (
        <div className="mb-4 bg-gray-50 p-2 rounded-xl flex items-center gap-2 border border-dashed border-gray-200">
          <Lock size={12} className="text-gray-400" />
          <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">
            Orden en proceso - Edición bloqueada
          </span>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
        <div className="flex gap-1 items-center">
          <span className="font-black text-sm text-brand-dark">
            S/ {pedido.total.toFixed(2)}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onView(pedido)}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
            title="Ver Ticket"
          >
            <Eye size={18} />
          </button>

          {!isAdmin && cfg.editable && (
            <button
              onClick={() => onEdit(pedido)}
              className="p-2 text-brand-gold hover:bg-brand-gold/10 rounded-xl transition-colors"
              title="Editar Pedido"
            >
              <Edit3 size={18} />
            </button>
          )}

          {!isAdmin && cfg.next && (
            <button
              onClick={() => onStatusChange(pedido.id, cfg.next)}
              className="bg-brand-dark text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-black shadow-lg transition-all active:scale-95"
            >
              {cfg.nextLabel} <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- PANEL COCINA ---
export const PanelCocina = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(getLocalDate());
  const [kitchenStates, setKitchenStates] = useState<
    Record<string, "pendiente" | "preparando" | "listo">
  >({});

  // Audio State & Refs
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // NUEVO: Estado para Alerta Visual Cocina
  const [showNewOrderVisual, setShowNewOrderVisual] = useState(false);

  // RESTRICCIÓN DE ROLES: Solo cocina puede interactuar
  const canModifyKitchen = (user?.role as string) === "cocina";

  // Seguimiento de IDs para evitar duplicar sonidos
  const seenIds = useRef<Set<string>>(new Set());

  // Inicializar audio al montar
  useEffect(() => {
    audioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
    );
    audioRef.current.volume = 0.6;
  }, []);

  const enableAudio = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current?.pause();
          setAudioEnabled(true);
        })
        .catch((e) => console.error("Error activando audio:", e));
    }
  };

  const playAlert = useCallback(() => {
    if (audioEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch((e) => console.warn("Audio bloqueado por navegador", e));
    }
  }, [audioEnabled]);

  const cargarPedidosCocina = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          `*, creador:empleado_id(nombre), repartidores:repartidor_id(nombre)`
        )
        .in("estado", ["en_preparacion", "listo_para_reparto", "en_camino"])
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPedidos(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Monitor de "Pedidos Nuevos" para disparar sonido
  useEffect(() => {
    const comandasNuevas = pedidos.filter((p) => {
      const kState =
        kitchenStates[p.id] ||
        (p.estado === "en_camino" || p.estado === "listo_para_reparto"
          ? "listo"
          : "pendiente");
      return kState === "pendiente";
    });

    let foundNew = false;
    comandasNuevas.forEach((pedido) => {
      if (!seenIds.current.has(pedido.id)) {
        seenIds.current.add(pedido.id);
        foundNew = true;
      }
    });

    if (foundNew && pedidos.length > 0) {
      playAlert();
      setShowNewOrderVisual(true);
      setTimeout(() => setShowNewOrderVisual(false), 6000);
    }
  }, [pedidos, kitchenStates, playAlert]);

  useEffect(() => {
    cargarPedidosCocina();

    const sub = supabase
      .channel("cocina-realtime-monitor")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => {
          cargarPedidosCocina();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [cargarPedidosCocina]);

  const moverAPreparacion = (id: string) => {
    setKitchenStates((prev) => ({ ...prev, [id]: "preparando" }));
    auditoriaService.registrarPedido("ESTADO", id, {
      evento: "INICIO DE PREPARACIÓN EN COCINA",
    });
  };

  const marcarComoListo = async (id: string) => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({
          estado: "listo_para_reparto",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await auditoriaService.registrarPedido("COCINA", id, {
        evento: "PEDIDO LISTO PARA RECOJO",
      });
      setKitchenStates((prev) => ({ ...prev, [id]: "listo" }));
      await cargarPedidosCocina();
    } catch (e: any) {
      alert(`Error al notificar pedido listo: ${e.message}`);
    }
  };

  const secciones = [
    { id: "pendiente", label: "Comandas Nuevas", icon: <Clock size={20} /> },
    { id: "preparando", label: "En Fogones", icon: <Utensils size={20} /> },
    {
      id: "listo",
      label: "Listo para Reparto",
      icon: <CheckCircle size={20} />,
    },
  ];

  const filteredPedidos = pedidos.filter((p) => {
    const orderDate = p.created_at
      ? new Date(p.created_at).toLocaleDateString("sv-SE")
      : "";
    return orderDate === dateFilter;
  });

  const getPedidosPorSeccion = (secId: string) => {
    return filteredPedidos.filter((p) => {
      const kState =
        kitchenStates[p.id] ||
        (p.estado === "en_camino" || p.estado === "listo_para_reparto"
          ? "listo"
          : "pendiente");
      return kState === secId;
    });
  };

  return (
    <PanelLayout title="Panel de Comandas" active="cocina" user={user}>
      {showNewOrderVisual && (
        <div className="fixed top-24 right-10 z-[100] animate-bounce-in">
          <div className="bg-brand-dark border-2 border-brand-gold shadow-2xl rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-brand-gold p-3 rounded-xl text-brand-dark shadow-inner">
              <Bell size={24} className="animate-pulse" />
            </div>
            <div>
              <p className="text-brand-gold font-black text-sm uppercase tracking-widest">
                ¡Nuevo Pedido!
              </p>
              <p className="text-white text-[10px] font-black uppercase opacity-60 mt-0.5">
                Tienes una orden nueva en cola
              </p>
            </div>
            <button
              onClick={() => setShowNewOrderVisual(false)}
              className="text-white/20 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-[56px] shadow-sm border border-gray-100 mb-12 flex justify-between items-center animate-fadeIn">
        <div className="flex gap-5 items-center">
          <div className="bg-brand-dark/5 p-3 rounded-2xl text-brand-dark flex items-center gap-2">
            <ChefHat size={20} />{" "}
            <span className="text-[10px] font-black uppercase tracking-widest">
              Monitor de Cocina
            </span>
          </div>
          <input
            type="date"
            className="py-5 px-8 bg-gray-50 border-none rounded-[32px] text-xs font-black outline-none focus:ring-4 focus:ring-brand-gold/10 cursor-pointer shadow-sm transition-all"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          {!audioEnabled ? (
            <button
              onClick={enableAudio}
              className="flex items-center gap-3 bg-amber-50 text-amber-700 px-6 py-4 rounded-3xl border border-amber-200 animate-pulse hover:bg-amber-100 transition-all shadow-sm"
            >
              <VolumeX size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Activar Alerta Sonora
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-green-50 text-green-700 px-6 py-4 rounded-3xl border border-green-200 shadow-sm">
              <Volume2 size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Alertas Activas
              </span>
            </div>
          )}

          <button
            onClick={cargarPedidosCocina}
            className="p-4 bg-gray-100 text-gray-400 rounded-full hover:bg-brand-dark hover:text-white transition-all"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full animate-fadeIn">
        {secciones.map((sec) => (
          <div
            key={sec.id}
            className="flex flex-col bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]"
          >
            <div
              className={`p-6 flex items-center justify-between border-b ${
                sec.id === "pendiente"
                  ? "bg-blue-50/50"
                  : sec.id === "preparando"
                  ? "bg-orange-50/50"
                  : "bg-green-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`${
                    sec.id === "pendiente"
                      ? "text-blue-600"
                      : sec.id === "preparando"
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {sec.icon}
                </span>
                <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-gray-700">
                  {sec.label}
                </h3>
              </div>
              <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black shadow-sm">
                {getPedidosPorSeccion(sec.id).length}
              </span>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[75vh]">
              {getPedidosPorSeccion(sec.id).map((p) => (
                <div
                  key={p.id}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all animate-scaleIn"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-mono font-black text-gray-300 tracking-tighter">
                      #{p.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-lg flex items-center gap-1">
                      <Clock size={10} /> {formatTime(p.created_at)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Cliente
                    </p>
                    <p className="font-black text-lg text-gray-800 uppercase tracking-tighter leading-none border-l-4 border-brand-gold pl-3">
                      {p.cliente_nombre}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    {(p.detalles_pedido || []).map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm font-black text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-100/50"
                      >
                        <span className="text-brand-dark bg-brand-gold/20 w-7 h-7 flex items-center justify-center rounded-lg">
                          {item.cantidad}
                        </span>
                        <span className="flex-1 ml-3 uppercase tracking-tighter text-[11px]">
                          {item.item}
                        </span>
                      </div>
                    ))}
                  </div>

                  {p.notas && (
                    <div className="mb-6 bg-yellow-50 p-4 rounded-2xl border-2 border-dashed border-yellow-100">
                      <p className="text-[9px] font-black text-yellow-600 uppercase mb-1 flex items-center gap-2">
                        <AlertTriangle size={12} /> Observación
                      </p>
                      <p className="text-xs text-yellow-900 italic font-black">
                        "{p.notas}"
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    {canModifyKitchen && sec.id === "pendiente" && (
                      <button
                        onClick={() => moverAPreparacion(p.id)}
                        className="w-full bg-brand-dark text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Utensils size={14} /> INICIAR COCINA
                      </button>
                    )}
                    {canModifyKitchen && sec.id === "preparando" && (
                      <button
                        onClick={() => marcarComoListo(p.id)}
                        className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <CheckCircle size={14} /> PEDIDO LISTO
                      </button>
                    )}
                    {sec.id === "listo" && (
                      <div className="p-4 bg-green-50 rounded-2xl text-center border border-green-100 flex items-center justify-center gap-2 animate-pulse">
                        <UserCheck size={16} className="text-green-600" />
                        <p className="text-[9px] font-black text-green-600 uppercase tracking-[0.3em]">
                          NOTIFICADO A REPARTO
                        </p>
                      </div>
                    )}
                    {!canModifyKitchen &&
                      (sec.id === "pendiente" || sec.id === "preparando") && (
                        <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic">
                            Solo lectura (Rol Admin)
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              ))}
              {getPedidosPorSeccion(sec.id).length === 0 && (
                <div className="py-24 text-center opacity-10 flex flex-col items-center select-none">
                  <Utensils size={72} />
                  <p className="mt-6 font-black uppercase text-[10px] tracking-widest">
                    Sin tareas activas
                  </p>
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
  const [, setLoading] = useState(true);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(
    null
  );

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const todosPedidos = await pedidoService.getAllPedidos();
      setPedidos(todosPedidos);
    } catch (error) {
      alert("Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setShowDetallesModal(true);
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  return (
    <PanelLayout title="Todos los Pedidos" active="pedidos" user={user}>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Ticket
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pedidos.map((pedido) => (
              <tr
                key={pedido.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {formatTicketId(pedido.id)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">
                  {pedido.cliente_nombre}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-green-600">
                  S/ {pedido.total?.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      pedido.estado === "pendiente"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : pedido.estado === "en_preparacion"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : pedido.estado === "listo_para_reparto"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : pedido.estado === "en_camino"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : pedido.estado === "entregado"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {pedido.estado.replace("_", " ").toUpperCase()}
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
const VerEmpleadoModal: React.FC<{
  empleado: Empleado | null;
  onClose: () => void;
}> = ({ empleado, onClose }) => {
  if (!empleado) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
        <div className="bg-brand-dark p-6 text-white flex justify-between items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ChefHat size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold font-serif text-brand-gold">
              Ficha de Empleado
            </h3>
            <p className="text-gray-300 text-xs mt-1 font-mono opacity-70">
              ID: {empleado.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors relative z-10"
          >
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
              <div className="bg-blue-100 p-2.5 rounded-full text-blue-600 shadow-sm">
                <User size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Nombre Completo
                </p>
                <p className="text-gray-800 font-bold text-lg leading-tight">
                  {empleado.nombre}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
              <div className="bg-green-100 p-2.5 rounded-full text-green-600 shadow-sm">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Correo Electrónico
                </p>
                <p className="text-gray-800 font-medium">{empleado.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
              <div className="bg-purple-100 p-2.5 rounded-full text-purple-600 shadow-sm">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Teléfono
                </p>
                <p className="text-gray-800 font-medium">
                  {empleado.telefono || "No registrado"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-xl p-4 text-center bg-gray-50/50">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                Rol Asignado
              </p>
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold capitalize shadow-sm ${
                  empleado.rol === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : empleado.rol === "delivery"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {empleado.rol}
              </span>
            </div>
            <div className="border border-gray-100 rounded-xl p-4 text-center bg-gray-50/50">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                Estado Actual
              </p>
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold capitalize shadow-sm ${
                  empleado.estado === "activo"
                    ? "bg-green-100 text-green-700"
                    : empleado.estado === "vacaciones"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {empleado.estado}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center border-t border-gray-100 pt-4">
            Registrado en sistema:{" "}
            {new Date(empleado.created_at).toLocaleDateString("es-PE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
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
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  errors: ValidationErrors;
  tipoEmpleado: "con_auth" | "sin_auth";
}> = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  formData,
  handleInputChange,
  errors,
}) => {
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
              {isEditing ? "Editar Empleado" : "Nuevo Empleado"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
        >
          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">
              Nombre Completo
            </label>
            <div className="relative group">
              <User
                className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-gold transition-colors"
                size={18}
              />
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none transition-all bg-gray-50 focus:bg-white ${
                  errors.nombre ? "border-red-500 bg-red-50" : "border-gray-200"
                }`}
                placeholder="Ej. Juan Pérez"
              />
            </div>
            {errors.nombre && (
              <p className="text-red-500 text-xs mt-1 font-medium ml-1 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.nombre}
              </p>
            )}
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">
                Email
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-gold transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none transition-all bg-gray-50 focus:bg-white ${
                    errors.email
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="ejemplo@correo.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 font-medium ml-1 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.email}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">
                Teléfono
              </label>
              <div className="relative group">
                <Phone
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-gold transition-colors"
                  size={18}
                />
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  maxLength={9}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none transition-all bg-gray-50 focus:bg-white ${
                    errors.telefono
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="987654321"
                />
              </div>
              {errors.telefono && (
                <p className="text-red-500 text-xs mt-1 font-medium ml-1 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.telefono}
                </p>
              )}
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">
              Rol Asignado
            </label>
            <div className="relative group">
              <Briefcase
                className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-gold transition-colors"
                size={18}
              />
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
              <ChevronRight
                className="absolute right-3 top-3 text-gray-400 rotate-90 pointer-events-none"
                size={16}
              />
            </div>
          </div>

          {/* Contraseña (Solo al crear) */}
          {!isEditing && (
            <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 shadow-sm">
              <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                <div className="bg-amber-200/50 p-1.5 rounded text-amber-700">
                  <Key size={14} />
                </div>
                Credenciales de Acceso
              </h4>
              <div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none transition-all ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Contraseña (Mín. 6 caracteres)"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 font-medium ml-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.password}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cambio de Contraseña (Solo al editar) */}
          {isEditing && (
            <div className="border-t border-gray-100 pt-5 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-gray-400" />
                <p className="text-sm font-bold text-gray-700">
                  Actualizar Contraseña
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="password"
                    name="nuevaContrasena"
                    value={formData.nuevaContrasena}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none transition-all bg-gray-50 focus:bg-white ${
                      errors.nuevaContrasena
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                    placeholder="Nueva contraseña"
                  />
                  {errors.nuevaContrasena && (
                    <p className="text-red-500 text-[10px] mt-1 ml-1">
                      {errors.nuevaContrasena}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="password"
                    name="confirmarContrasena"
                    value={formData.confirmarContrasena}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none transition-all bg-gray-50 focus:bg-white ${
                      errors.confirmarContrasena
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                    placeholder="Confirmar"
                  />
                  {errors.confirmarContrasena && (
                    <p className="text-red-500 text-[10px] mt-1 ml-1">
                      {errors.confirmarContrasena}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 ml-1">
                * Dejar en blanco si no desea cambiar la contraseña
              </p>
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
              {isEditing ? "Guardar Cambios" : "Crear Empleado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ADMIN PANEL ---
export const AdminPanel = () => {
  const { user } = useAuth();

  // Métricas reales
  const [counts, setCounts] = useState({
    totalReservas: 0,
    totalDelivery: 0,
    reservasHoy: 0,
    deliveryPendientes: 0,
  });
  const [, setLoadingStats] = useState(true);

  // Estados de Gestión
  const [tipoEmpleado] = useState<"con_auth" | "sin_auth">(
    "sin_auth"
  );
  const [empleadoDetalles, setEmpleadoDetalles] = useState<Empleado | null>(
    null
  );
  const [historial, setHistorial] = useState<Auditoria[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [estadisticasHistorial, setEstadisticasHistorial] = useState<{
    total: number;
    hoy: number;
  } | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rol: "reservas" as "reservas" | "delivery" | "cocina",
    password: "",
    nuevaContrasena: "",
    confirmarContrasena: "",
  });

  const fetchRealStats = async () => {
    try {
      setLoadingStats(true);
      const hoy = getLocalDate();
      const { count: totalRes } = await supabase
        .from("reservas")
        .select("*", { count: "exact", head: true });
      const { count: totalDel } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true });
      const { count: resHoy } = await supabase
        .from("reservas")
        .select("*", { count: "exact", head: true })
        .eq("fecha", hoy);
      const { count: delPen } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true })
        .in("estado", [
          "pendiente",
          "en_preparacion",
          "listo_para_reparto",
          "en_camino",
        ]);
      setCounts({
        totalReservas: totalRes || 0,
        totalDelivery: totalDel || 0,
        reservasHoy: resHoy || 0,
        deliveryPendientes: delPen || 0,
      });
    } catch (e) {
      console.error("Error fetching stats:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadEmpleados = async () => {
    try {
      setLoadingEmpleados(true);
      const data = await empleadoService.getEmpleados();
      setEmpleados(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const loadHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const data = await auditoriaService.obtenerHistorialCompleto({});
      setHistorial(data);
      const stats = await auditoriaService.obtenerEstadisticas();
      setEstadisticasHistorial(stats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    fetchRealStats();
    loadEmpleados();
    loadHistorial();

    const resSub = supabase
      .channel("stats-res")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservas" },
        () => {
          fetchRealStats();
          loadHistorial();
        }
      )
      .subscribe();

    const pedSub = supabase
      .channel("stats-ped")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => {
          fetchRealStats();
          loadHistorial();
        }
      )
      .subscribe();

    const auditSub = supabase
      .channel("audit-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "auditoria" },
        () => {
          loadHistorial();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(resSub);
      supabase.removeChannel(pedSub);
      supabase.removeChannel(auditSub);
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNuevoEmpleado = () => {
    setEditingEmpleado(null);
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      rol: "reservas",
      password: "",
      nuevaContrasena: "",
      confirmarContrasena: "",
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEditarEmpleado = (empleado: Empleado) => {
    setEditingEmpleado(empleado);
    setFormData({
      nombre: empleado.nombre,
      email: empleado.email,
      telefono: empleado.telefono || "",
      rol: empleado.rol as any,
      password: "",
      nuevaContrasena: "",
      confirmarContrasena: "",
    });
    setShowModal(true);
  };

  const handleEliminarEmpleado = async (empleado: Empleado) => {
    if (empleado.rol === "admin") return;
    if (!confirm(`¿Eliminar a ${empleado.nombre}?`)) return;
    try {
      await empleadoService.deleteEmpleado(empleado.id);
      await auditoriaService.registrarEliminacionEmpleado(
        empleado.id,
        empleado
      );
      loadEmpleados();
      loadHistorial();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const e = empleados.find((emp) => emp.id === id);
      if (!e) return;
      await empleadoService.updateEmpleado(id, { estado: nuevoEstado as any });
      await auditoriaService.registrarCambioEstado(
        id,
        e.nombre,
        e.estado,
        nuevoEstado
      );
      loadEmpleados();
      loadHistorial();
    } catch (error) {
      alert("Error al cambiar estado");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmpleado) {
        const updates = {
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          rol: formData.rol,
          estado: editingEmpleado.estado,
        };
        await empleadoService.updateEmpleado(
          editingEmpleado.id,
          updates as any
        );
        await auditoriaService.registrarActualizacionEmpleado(
          editingEmpleado.id,
          updates
        );
      } else {
        const nuevo = await empleadoService.crearEmpleadoSinAuth(
          formData as any
        );
        if (nuevo) await auditoriaService.registrarCreacionEmpleado(nuevo);
      }
      setShowModal(false);
      loadEmpleados();
      loadHistorial();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <PanelLayout
      title="Dashboard Administrativo"
      active="dashboard"
      user={user}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div className="relative group bg-white p-7 rounded-[40px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl group-hover:bg-brand-gold/10 transition-colors"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                Reservas
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-gray-800 leading-none">
                  {counts.totalReservas}
                </h3>
                <span className="text-xs font-bold text-gray-400">
                  registradas
                </span>
              </div>
            </div>
            <div className="p-4 bg-brand-gold/10 text-brand-gold rounded-2xl shadow-inner border border-brand-gold/10">
              <Calendar size={24} />
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2">
            <div className="h-1 flex-1 bg-gray-50 rounded-full overflow-hidden">
              <div className="h-full bg-brand-gold w-full opacity-30"></div>
            </div>
          </div>
        </div>

        <div className="relative group bg-white p-7 rounded-[40px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                Delivery
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-gray-800 leading-none">
                  {counts.totalDelivery}
                </h3>
                <span className="text-xs font-bold text-gray-400">pedidos</span>
              </div>
            </div>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner border border-blue-100">
              <Truck size={24} />
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2 text-xs font-black text-blue-600">
            <CheckCircle size={14} />{" "}
            <span className="uppercase tracking-widest">Pedidos Totales</span>
          </div>
        </div>

        <div className="relative group bg-white p-7 rounded-[40px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                Reservas Hoy
              </p>
              <h3 className="text-4xl font-black text-gray-800 leading-none">
                {counts.reservasHoy}
              </h3>
            </div>
            <div className="p-4 bg-green-50 text-green-600 rounded-2xl shadow-inner border border-green-100">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-8 bg-green-50 px-4 py-1.5 rounded-xl border border-green-100 w-fit">
            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">
              Programadas para hoy
            </p>
          </div>
        </div>

        <div className="relative group bg-brand-dark p-7 rounded-[40px] shadow-2xl border border-brand-dark overflow-hidden hover:scale-[1.02] transition-all duration-300">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black text-brand-gold/50 uppercase tracking-[0.2em] mb-3">
                Delivery Pendientes
              </p>
              <h3 className="text-4xl font-black text-brand-gold leading-none">
                {counts.deliveryPendientes}
              </h3>
            </div>
            <div className="p-4 bg-brand-gold/20 text-brand-gold rounded-2xl shadow-inner border border-brand-gold/20">
              <Package size={24} />
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2">
            <span className="w-2 h-2 bg-brand-gold rounded-full animate-pulse shadow-[0_0_10px_#D4AF37]"></span>
            <p className="text-[9px] font-black text-brand-gold uppercase tracking-[0.3em]">
              Requiere Atención
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[48px] shadow-sm border border-gray-100 mb-12">
        <div className="flex justify-between items-center mb-8 px-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <Users size={22} className="text-brand-dark" /> Gestión de
              Personal
            </h3>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-black">
              Equipo Operativo Arlet
            </p>
          </div>
          <button
            onClick={handleNuevoEmpleado}
            className="bg-brand-dark text-brand-gold px-10 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all"
          >
            + Registrar Miembro
          </button>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50/50">
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="px-6 py-5 font-black uppercase text-[9px] tracking-[0.2em]">
                  Colaborador
                </th>
                <th className="px-6 py-5 font-black uppercase text-[9px] tracking-[0.2em]">
                  Rol
                </th>
                <th className="px-6 py-5 font-black uppercase text-[9px] tracking-[0.2em]">
                  Estado
                </th>
                <th className="px-6 py-5 font-black uppercase text-[9px] tracking-[0.2em] text-center">
                  Gestión
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingEmpleados ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400">
                    Cargando personal...
                  </td>
                </tr>
              ) : (
                empleados.map((empleado) => (
                  <tr
                    key={empleado.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-6 font-bold text-gray-800">
                      {empleado.nombre}
                    </td>
                    <td className="px-6 py-6 uppercase font-black text-[10px] text-gray-500 tracking-tighter">
                      {empleado.rol}
                    </td>
                    <td className="px-6 py-6">
                      <select
                        value={empleado.estado}
                        onChange={(e) =>
                          handleCambiarEstado(empleado.id, e.target.value)
                        }
                        className="bg-white border rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-brand-gold/30 cursor-pointer"
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                        <option value="vacaciones">Vacaciones</option>
                      </select>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => {
                            setEmpleadoDetalles(empleado);
                          }}
                          className="p-3 bg-gray-100 text-gray-400 rounded-2xl hover:bg-brand-dark hover:text-white transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditarEmpleado(empleado)}
                          className="p-3 bg-gray-100 text-gray-400 rounded-2xl hover:bg-brand-dark hover:text-white transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleEliminarEmpleado(empleado)}
                          className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <HistorialAvanzadoSection
        historial={historial}
        onRefresh={loadHistorial}
        loading={loadingHistorial}
        estadisticas={estadisticasHistorial}
      />

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
        onClose={() => {
          setEmpleadoDetalles(null);
        }}
      />
    </PanelLayout>
  );
};
export const AdminReclamacionesPanel = () => {
  const { user } = useAuth();
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selReclamo, setSelReclamo] = useState<Reclamacion | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reclamaciones")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      setReclamaciones(data || []);
    } catch (e) {
      console.error("Error cargando reclamaciones:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") loadData();
  }, [user, loadData]);

  const handleEstado = async (id: string, nuevo: string) => {
    const reclamoActual = reclamaciones.find((r) => r.id === id);
    if (reclamoActual?.estado === "resuelto") {
      alert(
        "Este expediente ya está RESUELTO y cerrado legalmente. No puede ser modificado."
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("reclamaciones")
        .update({ estado: nuevo, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      await auditoriaService.registrarAccion(
        "GESTION_RECLAMACION",
        "reclamaciones",
        id,
        {
          anterior_estado: reclamoActual?.estado,
          nuevo_estado: nuevo,
          atendido_por: user?.name,
        }
      );

      loadData();
      if (selReclamo?.id === id)
        setSelReclamo((prev) =>
          prev ? { ...prev, estado: nuevo as any } : null
        );
    } catch (e) {
      alert("Error al actualizar estado");
    }
  };

  const handleResponder = async () => {
    if (!selReclamo || !respuesta.trim()) {
      alert("Por favor redacte una respuesta oficial.");
      return;
    }

    if (selReclamo.estado === "resuelto") {
      alert("Este reclamo ya tiene una respuesta oficial enviada.");
      return;
    }

    setEnviando(true);
    try {
      // --- 1. CONFIGURACIÓN DEL SERVICIO DE CORREO (EmailJS) ---
      const SERVICE_ID = "service_jqr7xzk";
      const TEMPLATE_ID = "template_3ga5ytk";
      const PUBLIC_KEY = "c-RdgjUwb3TeJ2HIi";

      // Validation corregida contra el texto placeholder genérico
      // Removed redundant check against 'TU_PUBLIC_KEY' which was causing TS error due to literal string mismatch
      if (!PUBLIC_KEY) {
        throw new Error(
          "Configuración de EmailJS incompleta en el código fuente."
        );
      }

      const emailPayload = {
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: PUBLIC_KEY,
        template_params: {
          to_email: selReclamo.cliente_email,
          to_name: selReclamo.cliente_nombre,
          subject: "Respuesta Oficial - Libro de Reclamaciones Arlet",
          message: respuesta,
          ticket_id: selReclamo.id.slice(-8).toUpperCase(),
          admin_name: user?.name,
        },
      };

      // --- 2. EJECUCIÓN DEL ENVÍO REAL ---
      const response = await fetch(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailPayload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`El servicio de correo falló: ${errorText}`);
      }

      // --- 3. ACTUALIZAR BASE DE DATOS (SOLO SI EL CORREO SALIÓ BIEN) ---
      const { error: dbError } = await supabase
        .from("reclamaciones")
        .update({
          respuesta_empresa: respuesta,
          estado: "resuelto",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selReclamo.id);

      if (dbError) throw dbError;

      // --- 4. REGISTRO DE AUDITORÍA ---
      await auditoriaService.registrarAccion(
        "RESPUESTA_RECLAMACION_ENVIADA_GMAIL",
        "reclamaciones",
        selReclamo.id,
        {
          respondido_por: user?.name,
          email_notificado: selReclamo.cliente_email,
          respuesta: respuesta,
        }
      );

      alert(
        "¡ÉXITO! La respuesta ha sido enviada al Gmail del cliente y el expediente se ha cerrado legalmente."
      );
      setRespuesta("");
      setSelReclamo(null);
      loadData();
    } catch (e: any) {
      console.error("Error en el proceso de respuesta:", e);
      alert(
        `ERROR: No se pudo enviar la respuesta oficial. Detalles: ${e.message}`
      );
    } finally {
      setEnviando(false);
    }
  };

  if (user?.role !== "admin")
    return (
      <div className="p-20 text-center font-black text-gray-300 uppercase tracking-widest">
        Acceso Denegado
      </div>
    );

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "en proceso":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "resuelto":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <PanelLayout
      title="Libro de Reclamaciones Virtual"
      active="reclamaciones"
      user={user}
    >
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
        <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">
              Expedientes de Consumidores
            </h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
              Cumplimiento Normativo - Puerto Maldonado
            </p>
          </div>
          <button
            onClick={loadData}
            className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-brand-dark hover:text-white transition-all shadow-sm"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">Fecha Registro</th>
                <th className="px-8 py-6">Consumidor</th>
                <th className="px-8 py-6">Tipo / Bien</th>
                <th className="px-8 py-6">Estado Legal</th>
                <th className="px-8 py-6 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-24 text-center text-gray-400 font-black uppercase tracking-widest animate-pulse"
                  >
                    Consultando registros legales...
                  </td>
                </tr>
              ) : reclamaciones.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-24 text-center text-gray-300 font-bold italic"
                  >
                    No existen reclamos o quejas registradas.
                  </td>
                </tr>
              ) : (
                reclamaciones.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 transition-all group"
                  >
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                        ID: #{r.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs font-bold text-gray-600 mt-1">
                        {new Date(r.fecha).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-black text-gray-800 uppercase leading-none">
                        {r.cliente_nombre}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold mt-1.5 uppercase tracking-tighter">
                        DNI: {r.cliente_dni}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border w-fit ${
                            r.tipo === "reclamacion"
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}
                        >
                          {r.tipo}
                        </span>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                          {r.tipo_bien}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border w-fit ${getStatusColor(
                          r.estado
                        )}`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.estado === "resuelto"
                              ? "bg-green-500"
                              : "animate-pulse bg-current"
                          }`}
                        ></div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                          {r.estado}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button
                        onClick={() => setSelReclamo(r)}
                        className="p-3 bg-gray-100 text-gray-400 rounded-2xl hover:bg-brand-dark hover:text-white transition-all shadow-sm"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selReclamo && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-brand-dark/95 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelReclamo(null)}
        >
          <div
            className="bg-white rounded-[48px] max-w-4xl w-full shadow-2xl overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-brand-dark p-10 flex justify-between items-start relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <FileText size={200} />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-serif font-bold text-brand-gold">
                  Expediente Oficial
                </h3>
                <p className="text-white/40 font-mono text-[10px] mt-2 tracking-[0.3em] uppercase">
                  Hoja de Reclamación Virtual #
                  {selReclamo.id.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelReclamo(null)}
                className="text-white/40 hover:text-white p-3 bg-white/5 rounded-full relative z-10 transition-all hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-12 space-y-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] border-b pb-2">
                    1. Información del Reclamante
                  </h4>
                  <div>
                    <p className="text-xl font-black text-gray-800 uppercase">
                      {selReclamo.cliente_nombre}
                    </p>
                    <p className="text-sm font-bold text-gray-400 mt-1 uppercase">
                      DNI: {selReclamo.cliente_dni}
                    </p>
                  </div>
                  <div className="space-y-2 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <p className="text-sm font-black text-blue-600 flex items-center gap-2">
                      <Phone size={14} /> {selReclamo.cliente_telefono}
                    </p>
                    <p className="text-sm font-bold text-gray-600 flex items-center gap-2">
                      <Mail size={14} /> {selReclamo.cliente_email}
                    </p>
                    <p className="text-xs text-gray-400 font-medium italic">
                      <MapPin size={12} className="inline" />{" "}
                      {selReclamo.cliente_direccion}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] border-b pb-2">
                    2. Identificación del Bien
                  </h4>
                  <div className="bg-brand-dark p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                    <p className="text-[9px] font-black text-brand-gold/50 uppercase mb-2 tracking-[0.2em]">
                      Bien Contratado:
                    </p>
                    <p className="text-lg font-black text-white leading-tight uppercase tracking-tighter">
                      {selReclamo.descripcion_bien}
                    </p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-[9px] font-black text-brand-dark bg-brand-gold px-3 py-1 rounded-full uppercase">
                        {selReclamo.tipo_bien}
                      </span>
                      {selReclamo.monto_reclamado && (
                        <span className="text-2xl font-black text-brand-gold">
                          S/ {Number(selReclamo.monto_reclamado).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] border-b pb-2">
                  3. Detalle de Incidencia
                </h4>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 relative">
                    <div className="absolute -top-3 left-8 bg-brand-dark text-brand-gold px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                      El Hecho
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed italic font-medium">
                      "{selReclamo.detalle}"
                    </p>
                  </div>
                  <div className="p-8 bg-amber-50 rounded-[40px] border border-amber-100 relative">
                    <div className="absolute -top-3 left-8 bg-amber-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                      Pedido Concreto
                    </div>
                    <p className="text-sm text-amber-900 font-black leading-relaxed italic">
                      "{selReclamo.pedido_consumidor}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-gray-100">
                <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4">
                  4. Resolución Administrativa
                </h4>

                {selReclamo.estado !== "resuelto" ? (
                  <>
                    <div className="flex flex-wrap gap-4 mb-6">
                      <button
                        onClick={() => handleEstado(selReclamo.id, "pendiente")}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          selReclamo.estado === "pendiente"
                            ? "bg-rose-500 text-white shadow-lg scale-105"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        Pendiente
                      </button>
                      <button
                        onClick={() =>
                          handleEstado(selReclamo.id, "en proceso")
                        }
                        // Fixed typo: compared against 'en_proceso' instead of 'en proceso'
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          selReclamo.estado === "en_proceso"
                            ? "bg-amber-500 text-white shadow-lg scale-105"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        En Proceso
                      </button>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-[40px] border-2 border-dashed border-gray-200 group focus-within:border-brand-gold transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-dark text-brand-gold rounded-xl shadow-lg">
                            <Send size={16} />
                          </div>
                          <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                            Respuesta Formal al Consumidor
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[8px] font-black text-blue-500 uppercase tracking-widest">
                          <Mail size={12} /> Envío vía Gmail Activado
                        </div>
                      </div>
                      <textarea
                        value={respuesta}
                        onChange={(e) => setRespuesta(e.target.value)}
                        placeholder="Redacte la respuesta legal. Al presionar el botón inferior se enviará automáticamente un correo a la cuenta del cliente."
                        className="w-full bg-white border-2 border-gray-100 rounded-3xl p-6 text-sm font-medium focus:border-brand-gold outline-none h-40 resize-none transition-all shadow-inner"
                      />
                      <div className="flex justify-end mt-6">
                        <button
                          onClick={handleResponder}
                          disabled={enviando || !respuesta.trim()}
                          className="bg-brand-dark text-brand-gold px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center gap-3 disabled:opacity-30 active:scale-95 border border-brand-gold/20"
                        >
                          {enviando ? (
                            <RefreshCw className="animate-spin" size={16} />
                          ) : (
                            <FileCheck size={16} />
                          )}
                          {enviando
                            ? "ENVIANDO GMAIL..."
                            : "ENVIAR RESPUESTA Y CERRAR"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-10 bg-green-50 rounded-[40px] border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="text-green-600" size={24} />
                      <h4 className="text-lg font-black text-green-800 uppercase tracking-tighter">
                        Expediente Resuelto
                      </h4>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">
                        Respuesta Enviada:
                      </p>
                      <p className="text-sm text-gray-700 italic font-medium leading-relaxed">
                        "{selReclamo.respuesta_empresa}"
                      </p>
                    </div>
                    <p className="text-[9px] text-green-600 font-bold mt-4 uppercase tracking-[0.2em] text-center">
                      Este expediente ya fue resuelto.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelReclamo(null)}
                className="px-12 py-4 bg-brand-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg"
              >
                Cerrar Visualización
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
};
