import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import routes from "./routes/index.js";

export const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: "ok",
      app: "FuturApp API",
      database: "connected",
    });
  } catch {
    return res.json({
      status: "ok",
      app: "FuturApp API",
      database: "disconnected",
    });
  }
});

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);
