import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './services/authService';
import { Login } from './pages/Login';
import { Navbar, Chatbot, ProtectedRoute } from './components/Components';
import { Home, About, Menu, Gallery, Kitchen, Contact } from './pages/PublicPages';
import { 
  AdminPanel, 
  ReservationPanel, 
  DeliveryPanel, 
  PanelCocina, 
  AdminPedidosPanel 
} from './pages/PanelPages';

const Footer = () => (
  <footer className="bg-brand-dark text-white py-12 border-t border-brand-gold/30">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <h2 className="text-2xl font-serif text-brand-gold font-bold mb-4">Arlet's Restaurant</h2>
      <p className="text-gray-400 text-sm mb-6">Sabor, tradición y elegancia en cada bocado.</p>
      <div className="text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Arlet's Restaurant. Todos los derechos reservados.
      </div>
    </div>
  </footer>
);

// Layout wrapper for public pages to include Navbar and Footer
const PublicLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* ESPACIO PARA QUE EL NAV NO TAPE EL CONTENIDO */}
      <main className="flex-grow pt-24">
        {children}
      </main>

      <Chatbot />
      <Footer />
    </div>
  );
};

const AppContent = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/nosotros" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/menu" element={<PublicLayout><Menu /></PublicLayout>} />
      <Route path="/galeria" element={<PublicLayout><Gallery /></PublicLayout>} />
      <Route path="/cocina" element={<PublicLayout><Kitchen /></PublicLayout>} />
      <Route path="/contacto" element={<PublicLayout><Contact /></PublicLayout>} />
      
      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* PROTECTED ROUTES - NUEVA ESTRUCTURA */}
      {/* Panel Administrador */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        } 
      />

      {/* Panel de Reservas */}
      <Route 
        path="/reservas" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'reservas']}>
            <ReservationPanel />
          </ProtectedRoute>
        } 
      />

      {/* Panel Delivery */}
      <Route 
        path="/delivery" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'delivery']}>
            <DeliveryPanel />
          </ProtectedRoute>
        } 
      />

      {/* Panel Cocina - HABILITADO PARA ROL 'cocina' y 'admin' */}
      <Route 
        path="/cocina-panel" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'cocina']}>
            <PanelCocina />
          </ProtectedRoute>
        } 
      />

      {/* Todos los Pedidos (Admin) */}
      <Route 
        path="/admin/pedidos" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPedidosPanel />
          </ProtectedRoute>
        } 
      />

      {/* Ruta de fallback - Redirigir al home si no existe */}
      <Route path="*" element={<PublicLayout><Home /></PublicLayout>} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;