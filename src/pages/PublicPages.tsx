import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MENU_ITEMS } from '../constants';
import { DishCard, Carousel } from '../components/Components';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, X, Send, MessageCircle } from 'lucide-react';
import Principal from "../imagenes/Principal.png";
// --- HOME ---
export const Home = () => {
  return (
     
    <div className="min-h-screen">
      <div className="relative h-screen flex items-center justify-center">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop" 
            alt="Restaurante Ambiente" 
            className="w-full h-full object-cover brightness-50"
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 animate-fade-in-up">
          <h2 className="text-brand-gold font-serif text-2xl md:text-3xl mb-4 tracking-widest uppercase">Bienvenido a</h2>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white font-bold mb-8 drop-shadow-xl">
            Arlet’s Restaurant
          </h1>
          <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
            Una experiencia culinaria única donde la tradición se encuentra con la elegancia moderna.
          </p>
          <NavLink 
            to="/nosotros" 
            className="inline-block border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark px-8 py-3 rounded transition-all duration-300 uppercase tracking-wider font-bold"
          >
            Conoce nuestra historia
          </NavLink>
        </div>
      </div>
    </div>
  );
};

// --- NOSOTROS ---
export const About = () => (
  <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark border-l-4 border-brand-gold pl-6">Nuestra Historia</h2>
        <p className="text-gray-600 text-lg leading-relaxed">
          Arlet’s Restaurant nació del sueño de llevar los sabores auténticos del norte a la mesa más exigente. Lo que comenzó como un pequeño comedor familiar, hoy es un referente de la gastronomía regional y fusión.
        </p>
        <p className="text-gray-600 text-lg leading-relaxed">
          Nuestra filosofía se basa en tres pilares: ingredientes frescos, respeto por la tradición y una atención que te hace sentir en casa. Cada plato cuenta una historia, cada rincón de nuestro local ha sido diseñado para tu confort.
        </p>
        <div className="flex gap-4 pt-4">
          <div className="text-center">
            <span className="block text-4xl font-bold text-brand-gold">25+</span>
            <span className="text-sm text-gray-500 uppercase tracking-wide">Años de experiencia</span>
          </div>
          <div className="text-center border-l pl-4">
            <span className="block text-4xl font-bold text-brand-gold">50+</span>
            <span className="text-sm text-gray-500 uppercase tracking-wide">Premios </span>
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
);

// --- MENU ---
export const Menu = () => (
  <div className="pt-24 pb-16 bg-gray-50 min-h-screen">
    <div className="max-w-7xl mx-auto px-4 text-center mb-12">
      <h2 className="text-4xl font-serif font-bold text-brand-dark mb-4">Nuestra Carta</h2>
      <p className="text-gray-600 max-w-2xl mx-auto">Explora una selección de nuestros mejores platillos, preparados con pasión y los mejores ingredientes.</p>
    </div>
    
    <div className="mb-16">
      <Carousel items={MENU_ITEMS} />
    </div>

    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {MENU_ITEMS.map(item => (
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
);

// --- GALERIA ---
export const Gallery = () => {
  const [filter, setFilter] = useState<'Todos' | 'Regional' | 'Pescado' | 'Casa'>('Todos');
  const [selectedDish, setSelectedDish] = useState<any>(null);

  const filteredItems = filter === 'Todos' ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === filter);

  const filters = ['Todos', 'Regional', 'Pescado', 'Casa'];

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-serif font-bold text-center text-brand-dark mb-8">Galería Culinaria</h2>
        
        {/* Filters */}
        <div className="flex justify-center flex-wrap gap-4 mb-12">
          {filters.map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-full font-bold transition-all ${
                filter === f 
                  ? 'bg-brand-dark text-brand-gold shadow-lg' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <DishCard 
              key={item.id} 
              {...{title: item.name, desc: item.description, price: item.price, img: item.image}}
              onClick={() => setSelectedDish(item)}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedDish(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="relative h-64 md:h-80">
              <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedDish(null)} className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white text-black">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-3xl font-serif font-bold text-brand-dark">{selectedDish.name}</h3>
                  <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded">
                    {selectedDish.category}
                  </span>
                </div>
                <span className="text-3xl font-bold text-brand-accent">S/ {selectedDish.price}</span>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">{selectedDish.description}</p>
              <button className="mt-8 w-full bg-brand-gold text-brand-dark py-3 font-bold rounded hover:bg-yellow-500 transition-colors">
                Preguntar Disponibilidad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COCINA ---
export const Kitchen = () => {
  const images = [
    { src: "https://burgosrestaurant.com/img/about.jpg", title: "Nuestra Cocina" },
    { src: "https://burgosrestaurant.com/img/team/02.jpg", title: "Bar Exclusivo" },
    { src: "https://burgosrestaurant.com/img/intro-bg.jpg", title: "Salón Principal" },
    { src: "https://burgosrestaurant.com/img/team/01.jpg", title: "Detalles de Mesa" }
  ];

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 text-center mb-12">
        <h2 className="text-4xl font-serif font-bold text-brand-dark">Espacios y Ambientes</h2>
        <p className="mt-4 text-gray-600">Conoce el corazón de Arlet's.</p>
      </div>
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {images.map((img, idx) => (
          <div key={idx} className="relative h-80 group overflow-hidden rounded-lg shadow-xl">
            <img src={img.src} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <h3 className="text-white text-3xl font-serif font-bold border-b-2 border-brand-gold pb-2">{img.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- CONTACTO ---
export const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:reservas@gmail.com?subject=Mensaje de ${formData.name}&body=${formData.message} (Responder a: ${formData.email})`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-brand-dark mb-4">Contáctanos</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-brand-dark text-white p-10 rounded-2xl">
            <h3 className="text-2xl font-bold mb-8 text-brand-gold">Información</h3>
            <div className="space-y-6">
              <div className="flex gap-4"><MapPin className="text-brand-gold" /> <div><h4 className="font-bold">Ubicación</h4><p className="text-gray-300 italic">Av. Principal 123, Chiclayo</p></div></div>
              <div className="flex gap-4"><Phone className="text-brand-gold" /> <div><h4 className="font-bold">Teléfono</h4><p className="text-gray-300">987 654 321</p></div></div>
              <div className="flex gap-4"><Mail className="text-brand-gold" /> <div><h4 className="font-bold">Email</h4><p className="text-gray-300">reservas@gmail.com</p></div></div>
            </div>
          </div>
          <div className="bg-gray-50 p-10 rounded-2xl border">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Envíanos un mensaje</h3>
            <form className="space-y-6" onSubmit={handleSendEmail}>
              <input placeholder="Tu Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
              <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
              <textarea placeholder="Mensaje..." rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
              <button type="submit" className="w-full bg-brand-dark text-white font-bold py-3 rounded-lg hover:bg-black transition-all flex justify-center items-center gap-2">
                <Send size={18} /> Enviar Mensaje
              </button>
              <a href="https://wa.me/51987654321" target="_blank" rel="noreferrer" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2">
                <MessageCircle size={18} /> WhatsApp Directo
              </a>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};