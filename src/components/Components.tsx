import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Menu as MenuIcon, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../services/authService';
import { Navigate } from 'react-router-dom';

// --- Navbar (Public) 
export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const activeClass = "text-brand-gold font-bold";
  const baseClass = "hover:text-brand-gold transition-colors duration-200 text-white font-serif tracking-wide";
  return (
    <nav className="fixed w-full z-50 bg-brand-dark/95 backdrop-blur-sm shadow-lg border-b border-brand-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 flex items-center">
             <h1 className="text-2xl font-serif text-brand-gold font-bold">Arlet's Restaurant</h1>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {['/', '/nosotros', '/menu', '/galeria', '/cocina', '/contacto'].map((path) => (
              <NavLink 
                key={path} 
                to={path} 
                className={({ isActive }) => isActive ? activeClass : baseClass}
              >
                {path === '/' ? 'Home' : path.substring(1).charAt(0).toUpperCase() + path.substring(2)}
              </NavLink>
            ))}
            <NavLink 
              to="/login"
              className="bg-brand-gold text-brand-dark px-5 py-2 rounded-full font-bold hover:bg-yellow-500 transition-colors flex items-center gap-2"
            >
              <User size={18} /> Login
            </NavLink>
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-brand-gold">
              {isOpen ? <X size={28} /> : <MenuIcon size={28} />}
            </button>
          </div>
        </div>
      </div>    
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-brand-dark border-t border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             {['/', '/nosotros', '/menu', '/galeria', '/cocina', '/contacto'].map((path) => (
              <NavLink 
                key={path} 
                to={path} 
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-brand-gold' : 'text-white'}`}
              >
                 {path === '/' ? 'Home' : path.substring(1).charAt(0).toUpperCase() + path.substring(2)}
              </NavLink>
            ))}
            <NavLink 
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center mt-4 bg-brand-gold text-brand-dark px-3 py-3 rounded-md font-bold"
            >
              Iniciar Sesión
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
};
// --- Chatbot ---
export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, isBot: boolean}[]>([
    { text: "¡Hola! Bienvenido a Arlet's Restaurant. ¿En qué puedo ayudarte?", isBot: true }
  ]);
  const handleOption = (option: string) => {
    setMessages(prev => [...prev, { text: option, isBot: false }]);
    setTimeout(() => {
      let response = "";
      switch(option) {
        case "¿Hacen delivery?":
          response = "¡Sí! Hacemos delivery a toda la ciudad. Puedes hacer pedidos al WhatsApp: +51 987654321.";
          break;
        case "Horario de atención":
          response = "Atendemos de Lunes a Domingo de 12:00 PM a 10:00 PM.";
          break;
        case "¿Hacen reservas?":
          response = "Sí, puedes reservar directamente desde nuestra sección de contacto o llamándonos.";
          break;
        case "Ver carta":
          response = "Puedes ver nuestra deliciosa carta en la sección 'Menú' de esta web.";
          break;
        default:
          response = "Un asesor se pondrá en contacto contigo pronto.";
      }
      setMessages(prev => [...prev, { text: response, isBot: true }]);
    }, 600);
  };
  const handleSupport = () => {
    window.open("https://wa.me/51900857774", "_blank");
  };
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-brand-gold hover:bg-yellow-500 text-brand-dark p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center gap-2 font-bold"
        >
          <MessageCircle size={24} />
          <span className="hidden sm:inline">Chat</span>
        </button>
      )}    
      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl w-80 sm:w-96 overflow-hidden flex flex-col h-[500px] border border-gray-200">
          <div className="bg-brand-dark text-brand-gold p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-bold">Asistente Virtual</h3>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.isBot ? 'bg-white border text-gray-800 rounded-tl-none' : 'bg-brand-gold text-brand-dark font-medium rounded-tr-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-t space-y-2">
            <p className="text-xs text-gray-500 mb-2 font-semibold">Opciones frecuentes:</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleOption("¿Hacen delivery?")} className="text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded text-left"> Delivery</button>
              <button onClick={() => handleOption("Horario de atención")} className="text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded text-left"> Horario</button>
              <button onClick={() => handleOption("¿Hacen reservas?")} className="text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded text-left">Reservas</button>
              <button onClick={() => handleOption("Ver carta")} className="text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded text-left"> Carta</button>
            </div>
            <button onClick={handleSupport} className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded flex justify-center items-center gap-2 text-sm">
              <Send size={14} /> Hablar con soporte (WhatsApp)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
// --- Protected Route ---
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('🛡️ ========== PROTECTED ROUTE ==========');
  console.log('📍 Ruta actual:', location.pathname);
  console.log('👤 Usuario completo:', user);
  console.log('🎯 Rol del usuario:', user?.role);
  console.log('🔢 Tipo de rol:', typeof user?.role);
  console.log('✅ Roles permitidos:', allowedRoles);
  console.log('🔍 ¿Usuario tiene rol?', !!user?.role);
  console.log('🎯 ¿Rol en allowedRoles?', user?.role ? allowedRoles.includes(user.role) : 'No hay rol');
  console.log('📊 ¿User truthy?', !!user);
  console.log('⏳ Loading?', loading);
  
  if (loading) {
    console.log('⏳ ProtectedRoute: Mostrando loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ ProtectedRoute: No hay usuario, redirigiendo a /login');
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // VERIFICACIÓN DETALLADA DEL ROL
  console.log('🔍 Verificando rol...');
  console.log('   - User.role:', user.role);
  console.log('   - allowedRoles:', allowedRoles);
  console.log('   - allowedRoles.includes(user.role!):', allowedRoles.includes(user.role!));
  
  if (!allowedRoles.includes(user.role!)) {
    console.log('🚫 ProtectedRoute: Acceso denegado. Rol:', user.role, 'no está en', allowedRoles);
    alert(`Acceso denegado. Tu rol (${user.role}) no tiene permiso para esta sección.`);
    return <Navigate to="/" replace />;
  }

  console.log('✅ ProtectedRoute: Acceso concedido para rol:', user.role);
  return <>{children}</>;
};
// --- Dish Card ---
export const DishCard: React.FC<{ title: string, desc: string, price: number, img: string, onClick?: () => void }> = ({ title, desc, price, img, onClick }) => (
  <div onClick={onClick} className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-all duration-300 group">
    <div className="h-48 overflow-hidden">
      <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
    </div>
    <div className="p-5">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-serif text-xl font-bold text-gray-800">{title}</h3>
        <span className="text-brand-accent font-bold text-lg">S/ {price}</span>
      </div>
      <p className="text-gray-600 text-sm line-clamp-2">{desc}</p>
    </div>
  </div>
);
// --- Custom Carousel ---
export const Carousel: React.FC<{ items: any[] }> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };
  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="overflow-hidden rounded-2xl shadow-2xl relative h-[400px] md:h-[500px]">
        {items.map((item, index) => (
          <div 
            key={item.id}
            className={`absolute w-full h-full transition-all duration-500 ease-in-out transform ${
              index === currentIndex ? 'opacity-100 translate-x-0' : 
              index < currentIndex ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'
            }`}
          >
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 text-white">
              <h3 className="text-3xl font-serif font-bold mb-2">{item.name}</h3>
              <p className="text-lg mb-2 text-gray-200">{item.description}</p>
              <span className="inline-block bg-brand-gold text-brand-dark px-4 py-1 rounded-full font-bold">S/ {item.price}</span>
            </div>
          </div>
        ))}
      </div>
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-sm transition-all">
        <ChevronLeft size={32} />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-sm transition-all">
        <ChevronRight size={32} />
      </button>
    </div>
  );
};