import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  nodeEnv: process.env.NODE_ENV || "development",
  mail: {
    enabled: String(process.env.MAIL_ENABLED || "false").toLowerCase() === "true",
    host: process.env.MAIL_HOST || "",
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE || "false").toLowerCase() === "true",
    user: process.env.MAIL_USER || "",
    pass: process.env.MAIL_PASS || "",
    fromName: process.env.MAIL_FROM_NAME || "FuturApp",
    fromAddress: process.env.MAIL_FROM_ADDRESS || "no-reply@futurapp.com",
  },
  ors: {
    apiKey: process.env.ORS_API_KEY || "",
    baseUrl: process.env.ORS_BASE_URL || "https://api.openrouteservice.org",
    profile: process.env.ORS_PROFILE || "driving-car",
    routeCacheSeconds: Number(process.env.GEO_ROUTE_CACHE_SECONDS || 30),
  },
  geo: {
    nearRadiusMeters: Number(process.env.GEO_NEAR_RADIUS_METERS || 300),
    arrivalRadiusMeters: Number(process.env.GEO_ARRIVAL_RADIUS_METERS || 100),
  },
};
