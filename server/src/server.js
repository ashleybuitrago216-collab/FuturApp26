import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { registerLocationSocket } from "./modules/locations/locations.socket.js";

const PORT = env.port || 4000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.clientUrl,
    credentials: true,
  },
});

app.set("io", io);
registerLocationSocket(io);

server.listen(PORT, () => {
  console.log(`FuturApp API running on http://localhost:${PORT}`);
});

server.on("error", error => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the previous FuturApp API process and try again.`);
  } else {
    console.error("FuturApp API failed to start:", error);
  }

  process.exit(1);
});

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}. Shutting down FuturApp API...`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
