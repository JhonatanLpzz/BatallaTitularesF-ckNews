import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { authRoutes } from "./routes/auth.js";
import { battleRoutes } from "./routes/battles.js";
import { voteRoutes } from "./routes/votes.js";
import { sseRoutes } from "./routes/sse.js";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify({
  logger: { level: config.logLevel },
});

await app.register(cors, {
  origin: config.nodeEnv === "production" 
    ? [config.corsOrigin]
    : ["http://localhost:5173"],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true,
});

// Register API routes
await app.register(authRoutes);
await app.register(battleRoutes);
await app.register(voteRoutes);
await app.register(sseRoutes);

// Health check endpoint for Railway
app.get("/health", async () => {
  return { 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  };
});

// In production, serve the Vite build
if (config.nodeEnv === "production") {
  await app.register(fastifyStatic, {
    root: path.join(__dirname, "../dist"),
    prefix: "/",
  });

  // SPA fallback
  app.setNotFoundHandler((_req, reply) => {
    return reply.sendFile("index.html");
  });
}

const PORT = config.port;

try {
  await app.listen({ port: PORT, host: config.host });
  console.log(`⚔️  Batalla de Titulares API running on http://${config.host}:${PORT}`);
  console.log(`[INFO] Environment: ${config.nodeEnv}`);
  console.log(`[INFO] CORS Origin: ${config.corsOrigin}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
