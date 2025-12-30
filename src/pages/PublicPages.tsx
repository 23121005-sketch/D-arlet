import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { MENU_ITEMS } from "../constants";
import { DishCard, Carousel } from "../components/Components";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  X,
  Send,
  MessageCircle,
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { auditoriaService } from "../services/auditoriaService";
import Principal from "../imagenes/Principal.png";

// --- COMPONENTE: FORMULARIO LIBRO DE RECLAMACIONES ---
const LibroReclamacionesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    cliente_nombre: "",
    cliente_dni: "",
    cliente_direccion: "",
    cliente_telefono: "",
    cliente_email: "",
    tipo_bien: "servicio" as "producto" | "servicio",
    monto_reclamado: "",
    descripcion_bien: "",
    tipo: "reclamacion" as "reclamacion" | "queja",
    detalle: "",
    pedido_consumidor: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: dbError } = await supabase
        .from("reclamaciones")
        .insert([
          {
            ...formData,
            monto_reclamado: formData.monto_reclamado
              ? parseFloat(formData.monto_reclamado)
              : null,
            fecha: new Date().toISOString(),
            estado: "pendiente", // Asegurar minúsculas para consistencia
          },
        ])
        .select();

      if (dbError) throw dbError;

      // Registrar en auditoría como evento automático del sistema
      await auditoriaService.registrarAccion(
        "NUEVA_RECLAMACION_CLIENTE",
        "reclamaciones",
        data?.[0]?.id,
        {
          cliente: formData.cliente_nombre,
          tipo: formData.tipo,
          email: formData.cliente_email,
        }
      );

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al enviar la reclamación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl relative my-8 animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 p-2 rounded-full z-10"
        >
          <X size={24} />
        </button>

        {success ? (
          <div className="p-16 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-3xl font-serif font-bold text-gray-800">
              ¡Registro Exitoso!
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Su reclamo/queja ha sido registrado bajo la normativa vigente. Nos
              pondremos en contacto con usted a la brevedad vía correo
              electrónico.
            </p>
          </div>
        ) : (
          <div className="flex flex-col max-h-[90vh]">
            <div className="p-8 border-b bg-gray-50 rounded-t-3xl">
              <div className="flex items-center gap-4">
                <div className="bg-brand-dark p-3 rounded-2xl text-brand-gold shadow-lg">
                  <FileText size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-brand-dark">
                    Libro de Reclamaciones
                  </h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                    Conforme al Código de Protección al Consumidor
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-8 space-y-8 overflow-y-auto custom-scrollbar"
            >
              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium animate-shake">
                  <AlertCircle size={20} /> {error}
                </div>
              )}

              {/* Sección 1: Identificación del Consumidor */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] border-b pb-2">
                  1. Identificación del Consumidor Reclamante
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Nombres y Apellidos
                    </label>
                    <input
                      required
                      className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-gold outline-none text-sm font-medium text-black bg-white"
                      placeholder="Nombre completo"
                      value={formData.cliente_nombre}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cliente_nombre: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      DNI / CE
                    </label>
                    <input
                      required
                      className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-gold outline-none text-sm font-medium text-black bg-white"
                      placeholder="Número de documento"
                      value={formData.cliente_dni}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cliente_dni: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                    Domicilio
                  </label>
                  <input
                    required
                    className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-gold outline-none text-sm font-medium text-black bg-white"
                    placeholder="Dirección actual"
                    value={formData.cliente_direccion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente_direccion: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Teléfono
                    </label>
                    <input
                      required
                      type="tel"
                      className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-gold outline-none text-sm font-medium text-black bg-white"
                      placeholder="Ej. 987654321"
                      value={formData.cliente_telefono}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cliente_telefono: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Email (Obligatorio para Respuesta)
                    </label>
                    <input
                      required
                      type="email"
                      className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-gold outline-none text-sm font-medium text-black bg-white"
                      placeholder="correo@ejemplo.com"
                      value={formData.cliente_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cliente_email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Detalle del Bien */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] border-b pb-2">
                  2. Identificación del Bien Contratado
                </h4>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="tipo_bien"
                      checked={formData.tipo_bien === "producto"}
                      onChange={() =>
                        setFormData({ ...formData, tipo_bien: "producto" })
                      }
                      className="accent-brand-gold"
                    />
                    <span className="text-xs font-bold text-gray-600 group-hover:text-brand-dark">
                      Producto
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="tipo_bien"
                      checked={formData.tipo_bien === "servicio"}
                      onChange={() =>
                        setFormData({ ...formData, tipo_bien: "servicio" })
                      }
                      className="accent-brand-gold"
                    />
                    <span className="text-xs font-bold text-gray-600 group-hover:text-brand-dark">
                      Servicio
                    </span>
                  </label>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Descripción
                    </label>
                    <input
                      required
                      className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-gold outline-none text-sm font-medium text-black bg-white"
                      placeholder="Ej. Plato de fondo, atención de mesa..."
                      value={formData.descripcion_bien}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descripcion_bien: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Monto Reclamado (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-gold outline-none text-sm font-black text-brand-dark"
                      placeholder="0.00"
                      value={formData.monto_reclamado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monto_reclamado: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Detalle de Reclamación */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] border-b pb-2">
                  3. Detalle de la Reclamación y Pedido del Consumidor
                </h4>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="tipo"
                      checked={formData.tipo === "reclamacion"}
                      onChange={() =>
                        setFormData({ ...formData, tipo: "reclamacion" })
                      }
                      className="accent-brand-gold"
                    />
                    <span className="text-xs font-bold text-gray-600">
                      Reclamación (Disconformidad relacionada al bien)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="tipo"
                      checked={formData.tipo === "queja"}
                      onChange={() =>
                        setFormData({ ...formData, tipo: "queja" })
                      }
                      className="accent-brand-gold"
                    />
                    <span className="text-xs font-bold text-gray-600">
                      Queja (Disconformidad no relacionada al bien)
                    </span>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                    Detalle del Reclamo/Queja
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-gold outline-none text-sm font-medium text-black bg-white"
                    placeholder="Explique lo sucedido detalladamente..."
                    value={formData.detalle}
                    onChange={(e) =>
                      setFormData({ ...formData, detalle: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                    Pedido o Solicitud
                  </label>
                  <textarea
                    required
                    rows={2}
                    className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-gold outline-none text-sm font-medium text-black bg-white"
                    placeholder="¿Qué solución espera obtener?"
                    value={formData.pedido_consumidor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pedido_consumidor: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-dark text-brand-gold py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  Enviar Registro Oficial
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-4">
                  Al enviar este formulario, usted declara que los datos
                  proporcionados son verídicos y acepta ser notificado al correo
                  registrado.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE: FOOTER ---
const Footer = () => {
  const [showReclamos, setShowReclamos] = useState(false);

  return (
    <footer className="bg-brand-dark text-white pt-20 pb-10 border-t border-brand-gold/10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="space-y-6">
          <h2 className="text-3xl font-serif font-bold text-brand-gold">
            Arlet's
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Excelencia gastronómica y tradición en cada plato. Una experiencia
            inolvidable en Puerto Maldonado.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-gold hover:text-brand-dark transition-all"
            >
              <Facebook size={18} />
            </a>
            <a
              href="#"
              className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-gold hover:text-brand-dark transition-all"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-brand-gold font-bold uppercase text-xs tracking-widest mb-8">
            Navegación
          </h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li>
              <NavLink
                to="/"
                className="hover:text-brand-gold transition-colors"
              >
                Inicio
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/nosotros"
                className="hover:text-brand-gold transition-colors"
              >
                Nosotros
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/menu"
                className="hover:text-brand-gold transition-colors"
              >
                Nuestra Carta
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contacto"
                className="hover:text-brand-gold transition-colors"
              >
                Contáctanos
              </NavLink>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-brand-gold font-bold uppercase text-xs tracking-widest mb-8">
            Horario
          </h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li className="flex justify-between">
              <span>Lunes - Sábado</span>{" "}
              <span className="text-white">12:00 - 23:00</span>
            </li>
            <li className="flex justify-between">
              <span>Domingos</span>{" "}
              <span className="text-white">12:00 - 18:00</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-brand-gold font-bold uppercase text-xs tracking-widest mb-8">
            Atención Legal
          </h4>
          <button
            onClick={() => setShowReclamos(true)}
            className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-brand-gold/50 transition-all group w-full"
          >
            <div className="p-2 bg-brand-gold/10 rounded-xl text-brand-gold group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold">
                Libro de
              </p>
              <p className="text-xs font-bold text-white">
                Reclamaciones Virtual
              </p>
            </div>
          </button>
          <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck size={14} className="text-green-500" />
            <span>Sitio Protegido y Seguro</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        <p>© 2024 Arlet's Restaurant. Todos los derechos reservados.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">
            Políticas de Privacidad
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Términos y Condiciones
          </a>
        </div>
      </div>

      <LibroReclamacionesModal
        isOpen={showReclamos}
        onClose={() => setShowReclamos(false)}
      />
    </footer>
  );
};

// --- HOME ---
export const Home = () => {
  return (
    <div className="min-h-screen">
      <div className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
            alt="Restaurante Ambiente"
            className="w-full h-full object-cover brightness-50"
          />
        </div>
        <div className="relative z-10 text-center px-4 animate-fade-in-up">
          <h2 className="text-brand-gold font-serif text-2xl md:text-3xl mb-4 tracking-widest uppercase">
            Bienvenido a
          </h2>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white font-bold mb-8 drop-shadow-xl">
            Arlet’s Restaurant
          </h1>
          <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
            Una experiencia culinaria única donde la tradición se encuentra con
            la elegancia moderna.
          </p>
          <NavLink
            to="/nosotros"
            className="inline-block border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark px-8 py-3 rounded transition-all duration-300 uppercase tracking-wider font-bold"
          >
            Conoce nuestra historia
          </NavLink>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// --- NOSOTROS ---
export const About = () => (
  <div className="flex flex-col min-h-screen">
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto flex-1">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark border-l-4 border-brand-gold pl-6">
            Nuestra Historia
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Arlet’s Restaurant nació del sueño de llevar los sabores auténticos
            del norte a la mesa más exigente. Lo que comenzó como un pequeño
            comedor familiar, hoy es un referente de la gastronomía regional y
            fusión.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed">
            Nuestra filosofía se basa en tres pilares: ingredientes frescos,
            respeto por la tradición y una atención que te hace sentir en casa.
            Cada plato cuenta una historia, cada rincón de nuestro local ha sido
            diseñado para tu confort.
          </p>
          <div className="flex gap-4 pt-4">
            <div className="text-center">
              <span className="block text-4xl font-bold text-brand-gold">
                2+
              </span>
              <span className="text-sm text-gray-500 uppercase tracking-wide">
                Años de experiencia
              </span>
            </div>
            <div className="text-center border-l pl-4">
              <span className="block text-4xl font-bold text-brand-gold">
                1+
              </span>
              <span className="text-sm text-gray-500 uppercase tracking-wide">
                Premios{" "}
              </span>
            </div>
          </div>
        </div>
        <div className="relative h-[500px] rounded-lg overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
          <img
            src={Principal}
            alt="Chef cooking"
            className="w-full h-full object-contain brightness-50"
          />
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

// --- MENU ---
export const Menu = () => (
  <div className="flex flex-col min-h-screen">
    <div className="pt-24 pb-16 bg-gray-50 flex-1">
      <div className="max-w-7xl mx-auto px-4 text-center mb-12">
        <h2 className="text-4xl font-serif font-bold text-brand-dark mb-4">
          Nuestra Carta
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explora una selección de nuestros mejores platillos, preparados con
          pasión y los mejores ingredientes.
        </p>
      </div>
      <div className="mb-16">
        <Carousel items={MENU_ITEMS} />
      </div>
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MENU_ITEMS.map((item) => (
          <DishCard
            key={item.id}
            title={item.name}
            desc={item.description}
            price={item.price}
            img={item.image}
          />
        ))}
      </div>
    </div>
    <Footer />
  </div>
);

// --- GALERIA ---
export const Gallery = () => {
  const [filter, setFilter] = useState<
    "Todos" | "Regional" | "Pescado" | "Casa"
  >("Todos");
  const [selectedDish, setSelectedDish] = useState<any>(null);

  const filteredItems =
    filter === "Todos"
      ? MENU_ITEMS
      : MENU_ITEMS.filter((i) => i.category === filter);
  const filters = ["Todos", "Regional", "Pescado", "Casa"];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="pt-24 pb-16 flex-1">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-serif font-bold text-center text-brand-dark mb-8">
            Galería Culinaria
          </h2>
          <div className="flex justify-center flex-wrap gap-4 mb-12">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${
                  filter === f
                    ? "bg-brand-dark text-brand-gold shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <DishCard
                key={item.id}
                {...{
                  title: item.name,
                  desc: item.description,
                  price: item.price,
                  img: item.image,
                }}
                onClick={() => setSelectedDish(item)}
              />
            ))}
          </div>
        </div>

        {selectedDish && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedDish(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-64 md:h-80">
                <img
                  src={selectedDish.image}
                  alt={selectedDish.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedDish(null)}
                  className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white text-black"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-3xl font-serif font-bold text-brand-dark">
                      {selectedDish.name}
                    </h3>
                    <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded">
                      {selectedDish.category}
                    </span>
                  </div>
                  <span className="text-3xl font-bold text-brand-accent">
                    S/ {selectedDish.price}
                  </span>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {selectedDish.description}
                </p>
                <a
                  href={`https://wa.me/51900857774?text=${encodeURIComponent(
                    `Hola, quisiera consultar la disponibilidad del plato: ${selectedDish.name}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 w-full block text-center bg-brand-gold text-brand-dark py-3 font-bold rounded hover:bg-yellow-500 transition-colors"
                >
                  Preguntar Disponibilidad
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

// --- COCINA ---
export const Kitchen = () => {
  const images = [
    {
      src: "https://burgosrestaurant.com/img/about.jpg",
      title: "Nuestra Cocina",
    },
    {
      src: "https://burgosrestaurant.com/img/team/02.jpg",
      title: "Bar Exclusivo",
    },
    {
      src: "https://burgosrestaurant.com/img/intro-bg.jpg",
      title: "Salón Principal",
    },
    {
      src: "https://burgosrestaurant.com/img/team/01.jpg",
      title: "Detalles de Mesa",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="pt-24 pb-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-brand-dark">
            Espacios y Ambientes
          </h2>
          <p className="mt-4 text-gray-600">Conoce el corazón de Arlet's.</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative h-80 group overflow-hidden rounded-lg shadow-xl"
            >
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-white text-3xl font-serif font-bold border-b-2 border-brand-gold pb-2">
                  {img.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

// --- CONTACTO ---
export const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:reservas@gmail.com?subject=Mensaje de ${formData.name}&body=${formData.message} (Responder a: ${formData.email})`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="pt-24 pb-16 flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-brand-dark mb-4">
              Contáctanos
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-brand-dark text-white p-10 rounded-2xl">
              <h3 className="text-2xl font-bold mb-8 text-brand-gold">
                Información
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <MapPin className="text-brand-gold" />{" "}
                  <div>
                    <h4 className="font-bold">Ubicación</h4>
                    <p className="text-gray-300 italic">
                      Ica 1755, Puerto Maldonado, Perú.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Phone className="text-brand-gold" />{" "}
                  <div>
                    <h4 className="font-bold">Teléfono</h4>
                    <p className="text-gray-300">987 654 321</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Mail className="text-brand-gold" />{" "}
                  <div>
                    <h4 className="font-bold">Email</h4>
                    <p className="text-gray-300">darlet2025@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-10 rounded-2xl border">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">
                Envíanos un mensaje
              </h3>
              <form className="space-y-6" onSubmit={handleSendEmail}>
                <input
                  placeholder="Tu Nombre"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
                <textarea
                  placeholder="Mensaje..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-brand-dark text-white font-bold py-3 rounded-lg hover:bg-black transition-all flex justify-center items-center gap-2"
                >
                  <Send size={18} /> Enviar Mensaje
                </button>
                <a
                  href="https://wa.me/51900857774"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-green-600 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2"
                >
                  <MessageCircle size={18} /> WhatsApp Directo
                </a>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
