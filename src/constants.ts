import type {
  Dish,
  Employee,
  DeliveryOrder,
  Reservation,
  Review,
  Log,
} from "./types";
//import type {DeliveryOrder} from './types';
// Auth Mock Data
export const USERS = {
  admin: { password: "1234", role: "admin", name: "Administrador Principal" },
  reserva: { password: "1234", role: "reserva", name: "Encargado de Reservas" },
  delivery: { password: "1234", role: "delivery", name: "Gestor de Envíos" },
};

// Menu Data
export const MENU_ITEMS: Dish[] = [
  {
    id: 1,
    name: "Ceviche Norteño",
    description: "Pescado fresco marinado en limón con ají limo y culantro.",
    price: 45,
    category: "Pescado",
    image:
      "https://plus.unsplash.com/premium_photo-1730240724921-8de763b6d0d1?q=80&w=464&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 2,
    name: "Lomo Saltado",
    description: "Trozos de lomo fino salteados al wok con cebolla y tomate.",
    price: 55,
    category: "Casa",
    image:
      "https://plus.unsplash.com/premium_photo-1669261881284-61bc3d7a8c17?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 3,
    name: "Arroz con Pato",
    description: "Pato tierno cocido en chicha de jora y culantro.",
    price: 48,
    category: "Regional",
    image:
      "https://plus.unsplash.com/premium_photo-1669261882028-c418e8865b2e?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 4,
    name: "Jalea Mixta",
    description:
      "Mariscos fritos crocantes acompañados de yuca y sarza criolla.",
    price: 60,
    category: "Pescado",
    image:
      "https://images.unsplash.com/photo-1535400255456-984241443b29?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 5,
    name: "Cabrito a la Norteña",
    description: "Cabrito macerado en chicha de jora servido con frejoles.",
    price: 52,
    category: "Regional",
    image:
      "https://plus.unsplash.com/premium_photo-1669260109482-68170db4e037?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 6,
    name: "Ají de Gallina",
    description: "Pechuga deshilachada en crema de ají amarillo con nueces.",
    price: 38,
    category: "Casa",
    image:
      "https://images.unsplash.com/photo-1535400875775-0269e7a919af?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

// Mock Dashboard Data
export const MOCK_EMPLOYEES: Employee[] = [
  { id: 1, name: "Juan Pérez", role: "Chef", status: "Activo" },
  { id: 2, name: "Maria Garcia", role: "Mesera", status: "Activo" },
  { id: 3, name: "Carlos Lopez", role: "Repartidor", status: "Vacaciones" },
];

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 1,
    customerName: "Roberto Gomez",
    phone: "999888777",
    date: "2023-11-20",
    time: "19:00",
    people: 4,
    status: "Confirmada",
    tableId: 5,
  },
  {
    id: 2,
    customerName: "Ana Silva",
    phone: "987654321",
    date: "2023-11-20",
    time: "20:30",
    people: 2,
    status: "Pendiente",
  },
  {
    id: 3,
    customerName: "Luis Torres",
    phone: "951753852",
    date: "2023-11-21",
    time: "13:00",
    people: 6,
    status: "Cancelada",
  },
];

export const MOCK_ORDERS: DeliveryOrder[] = [
  {
    id: "ORD-001",
    customerName: "Elena White",
    address: "Av. Larco 123",
    dish: "Lomo Saltado x2",
    paymentMethod: "Tarjeta",
    status: "En camino",
    total: 110,
  },
  {
    id: "ORD-002",
    customerName: "Jorge Black",
    address: "Calle Lima 456",
    dish: "Ceviche Norteño",
    paymentMethod: "Yape/Plin",
    status: "Pendiente",
    total: 45,
  },
  {
    id: "ORD-003",
    customerName: "Sofia Green",
    address: "Jr. Union 789",
    dish: "Ají de Gallina",
    paymentMethod: "Efectivo",
    status: "Entregado",
    total: 38,
  },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    user: "Carla M.",
    rating: 5,
    comment: "¡Excelente comida y ambiente!",
  },
  {
    id: 2,
    user: "Pedro P.",
    rating: 4,
    comment: "Muy rico pero demoró un poco.",
  },
  {
    id: 3,
    user: "Juan D.",
    rating: 5,
    comment: "El mejor Lomo Saltado de la ciudad.",
  },
];

export const MOCK_LOGS: Log[] = [
  {
    id: 1,
    action: "Agregó empleado: Juan Pérez",
    user: "Admin",
    time: "10:30 AM",
  },
  { id: 2, action: "Confirmó reserva #1", user: "Reserva", time: "11:15 AM" },
  {
    id: 3,
    action: "Cambió estado pedido #ORD-001",
    user: "Delivery",
    time: "12:00 PM",
  },
];

export const SALES_DATA = [
  { name: "Lun", ventas: 4000 },
  { name: "Mar", ventas: 3000 },
  { name: "Mie", ventas: 2000 },
  { name: "Jue", ventas: 2780 },
  { name: "Vie", ventas: 5890 },
  { name: "Sab", ventas: 8390 },
  { name: "Dom", ventas: 7490 },
];

export const DISH_SALES_DATA = [
  { name: "Lomo Saltado", value: 400 },
  { name: "Ceviche", value: 300 },
  { name: "Ají Gallina", value: 300 },
  { name: "Arroz Pato", value: 200 },
];
