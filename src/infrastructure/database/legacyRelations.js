import { LEGACY_TABLES } from "./legacyTables";

export const LEGACY_RELATIONS = [
  { from: LEGACY_TABLES.users, column: "id_tp_doc", to: LEGACY_TABLES.documentTypes, targetColumn: "id_tipo_doc" },
  { from: LEGACY_TABLES.users, column: "id_area", to: LEGACY_TABLES.specialtyAreas, targetColumn: "id_area" },
  { from: LEGACY_TABLES.users, column: "id_rol", to: LEGACY_TABLES.roles, targetColumn: "id_rol" },
  { from: LEGACY_TABLES.devices, column: "id_usrs", to: LEGACY_TABLES.users, targetColumn: "id_usrs" },
  { from: LEGACY_TABLES.devices, column: "id_estado", to: LEGACY_TABLES.statuses, targetColumn: "id_estado" },
  { from: LEGACY_TABLES.serviceRequests, column: "id_usrs", to: LEGACY_TABLES.users, targetColumn: "id_usrs" },
  { from: LEGACY_TABLES.serviceRequests, column: "id_equipo", to: LEGACY_TABLES.devices, targetColumn: "id_equipo" },
  { from: LEGACY_TABLES.serviceRequests, column: "id_tp_servicio", to: LEGACY_TABLES.serviceTypes, targetColumn: "id_tp_servicio" },
  { from: LEGACY_TABLES.serviceRequests, column: "id_prioridad", to: LEGACY_TABLES.priorities, targetColumn: "id_prioridad" },
  { from: LEGACY_TABLES.serviceRequests, column: "id_estado", to: LEGACY_TABLES.statuses, targetColumn: "id_estado" },
  { from: LEGACY_TABLES.appointments, column: "id_solicitud", to: LEGACY_TABLES.serviceRequests, targetColumn: "id_solicitud" },
  { from: LEGACY_TABLES.appointments, column: "id_usrs", to: LEGACY_TABLES.users, targetColumn: "id_usrs" },
  { from: LEGACY_TABLES.appointments, column: "id_estado", to: LEGACY_TABLES.statuses, targetColumn: "id_estado" },
  { from: LEGACY_TABLES.payments, column: "id_cita", to: LEGACY_TABLES.appointments, targetColumn: "id_cita" },
  { from: LEGACY_TABLES.payments, column: "id_medio", to: LEGACY_TABLES.paymentMethods, targetColumn: "id_medio" },
  { from: LEGACY_TABLES.payments, column: "id_estado_pago", to: LEGACY_TABLES.paymentStatuses, targetColumn: "id_estado" },
  { from: LEGACY_TABLES.payments, column: "id_usrs", to: LEGACY_TABLES.users, targetColumn: "id_usrs" },
  { from: LEGACY_TABLES.comments, column: "id_cita", to: LEGACY_TABLES.appointments, targetColumn: "id_cita" },
  { from: LEGACY_TABLES.comments, column: "id_usrs", to: LEGACY_TABLES.users, targetColumn: "id_usrs" },
  { from: LEGACY_TABLES.commentResponses, column: "id_comentario", to: LEGACY_TABLES.comments, targetColumn: "id_comentario" },
  { from: LEGACY_TABLES.commentResponses, column: "id_respondedor", to: LEGACY_TABLES.users, targetColumn: "id_usrs" },
  { from: LEGACY_TABLES.notifications, column: "id_usrs", to: LEGACY_TABLES.users, targetColumn: "id_usrs" },
  { from: LEGACY_TABLES.notifications, column: "id_tipo_notif", to: LEGACY_TABLES.notificationTypes, targetColumn: "id_tipo_notif" },
  { from: LEGACY_TABLES.technicianLocations, column: "id_usrs", to: LEGACY_TABLES.users, targetColumn: "id_usrs" },
];

