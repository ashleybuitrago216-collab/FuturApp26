import { LEGACY_TABLES } from "../../../infrastructure/database/legacyTables";

export const LEGACY_LOCATION_SCHEMA = {
  table: LEGACY_TABLES.technicianLocations,
  primaryKey: "id_ubicacion",
  technicianForeignKey: "id_usrs",
  latitude: "latitud",
  longitude: "longitud",
  createdAt: "fecha_registro",
};

