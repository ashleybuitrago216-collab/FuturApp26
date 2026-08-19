export const seed = {
  users: [
    { id: 1, nombre: "Alejandro", apellido: "Torres", correo: "admin@tech.com", password: "admin123", telefono: "3001234567", rol: "admin", area: "", activo: true },
    { id: 2, nombre: "Maria", apellido: "Salcedo", correo: "tec@tech.com", password: "tec123", telefono: "3109876543", rol: "tecnico", area: "Hardware", activo: true },
    { id: 3, nombre: "Juan", apellido: "Perez", correo: "user@tech.com", password: "user123", telefono: "3205551234", rol: "usuario", area: "", activo: true },
  ],
  servicios: [
    { id: 101, usuarioId: 3, tipo: "Mantenimiento de Hardware", descripcion: "PC se apaga sola", fecha: "2026-04-15", prioridad: "Alta", estado: "En progreso", tecnicoId: 2 },
    { id: 102, usuarioId: 3, tipo: "Soporte tecnico", descripcion: "Configurar VPN", fecha: "2026-04-20", prioridad: "Media", estado: "Pendiente", tecnicoId: null },
    { id: 103, usuarioId: 3, tipo: "Mantenimiento preventivo de computador", descripcion: "Limpieza, optimizacion y revision general", fecha: "2026-06-02", prioridad: "Media", estado: "Completado", tecnicoId: 2, valor: 80000, duracion: "2 horas" },
    { id: 104, usuarioId: 3, tipo: "Configuracion de red domestica", descripcion: "Instalacion y ajuste de router con acceso seguro", fecha: "2026-06-01", prioridad: "Baja", estado: "Completado", tecnicoId: 2, valor: 120000, duracion: "3 horas" },
  ],
  citas: [
    { id: 201, clienteId: 3, servicio: "Mantenimiento de Hardware", fecha: "2026-04-28", hora: "10:00", contacto: "3205551234", estado: "Confirmada", tecnicoId: 2 },
    { id: 202, clienteId: 3, servicio: "Asesoria de Software", fecha: "2026-05-02", hora: "14:30", contacto: "3205551234", estado: "Pendiente", tecnicoId: null },
    { id: 203, servicioId: 103, clienteId: 3, usuarioId: 3, servicio: "Mantenimiento preventivo de computador", fecha: "2026-06-02", hora: "10:00", contacto: "3205551234", estado: "Confirmada", tecnicoId: 2, duracion: "2 horas" },
    { id: 204, servicioId: 104, clienteId: 3, usuarioId: 3, servicio: "Configuracion de red domestica", fecha: "2026-06-01", hora: "15:30", contacto: "3205551234", estado: "Confirmada", tecnicoId: 2, duracion: "3 horas" },
  ],
  pagos: [
    { id: 301, txId: "TXN-4821", usuarioId: 3, servicio: "Mantenimiento de Hardware", fecha: "2026-04-15", valor: 180000, medio: "Nequi", estado: "Pagado" },
    { id: 302, txId: "TXN-7304", usuarioId: 3, userId: 3, technicianId: 2, tecnicoId: 2, serviceId: 104, appointmentId: 204, servicio: "Configuracion de red domestica", fecha: "2026-06-01", hora: "15:30", valor: 120000, amount: 120000, platformCommission: 30000, technicianEarnings: 90000, medio: "Bancolombia", method: "Bancolombia", estado: "Pagado", status: "Pagado", confirmedByTechnician: true, confirmedAt: "2026-06-01T21:00:00.000Z", paidAt: "2026-06-01T21:00:00.000Z", referencia: "SRV-2026-00104" },
  ],
  comentarios: [
    { id: 401, autorId: 3, texto: "Excelente atencion, muy profesionales.", fecha: "2026-04-16", hora: "15:42", respuesta: "Gracias! Es un placer atenderle.", respondidoPor: "admin" },
  ],
  notificaciones: [
    { id: 501, usuarioId: 3, mensaje: "Su cita del 28 de abril a las 10:00 fue confirmada.", fecha: "2026-04-23", leida: false, tipo: "cita" },
    { id: 502, usuarioId: 3, mensaje: "Pago de $180,000 recibido por Mantenimiento de Hardware.", fecha: "2026-04-15", leida: true, tipo: "pago" },
  ],
};
