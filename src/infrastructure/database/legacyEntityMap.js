import { LEGACY_TABLES } from "./legacyTables";

export const DOMAIN_TO_LEGACY_TABLE = {
  users: LEGACY_TABLES.users,
  roles: LEGACY_TABLES.roles,
  services: LEGACY_TABLES.serviceRequests,
  appointments: LEGACY_TABLES.appointments,
  payments: LEGACY_TABLES.payments,
  comments: LEGACY_TABLES.comments,
  commentResponses: LEGACY_TABLES.commentResponses,
  notifications: LEGACY_TABLES.notifications,
  technicianLocations: LEGACY_TABLES.technicianLocations,
  devices: LEGACY_TABLES.devices,
};

export const FRONTEND_FIELD_TO_LEGACY_COLUMN = {
  user: {
    id: "id_usrs",
    nombre: "nombre",
    apellido: "apellido",
    correo: "correo",
    password: "clave",
    telefono: "telefono",
    area: "id_area",
    rol: "id_rol",
    activo: "activo",
  },
  service: {
    id: "id_solicitud",
    usuarioId: "id_usrs",
    tipo: "id_tp_servicio",
    descripcion: "descripcion_problema",
    prioridad: "id_prioridad",
    fecha: "fecha_solicitud",
    estado: "id_estado",
  },
  appointment: {
    id: "id_cita",
    clienteId: "id_usrs",
    servicioId: "id_solicitud",
    fecha: "fecha",
    hora: "hora",
    estado: "id_estado",
  },
  payment: {
    id: "id_pago",
    usuarioId: "id_usrs",
    citaId: "id_cita",
    medio: "id_medio",
    estado: "id_estado_pago",
    valor: "monto",
    fecha: "fecha_pago",
    comprobante: "detalle_comprobante",
  },
  technicianLocation: {
    id: "id_ubicacion",
    technicianId: "id_usrs",
    latitude: "latitud",
    longitude: "longitud",
    timestamp: "fecha_registro",
  },
};

