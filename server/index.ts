import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { authRoutes } from "./routes/auth.js";
import { battleRoutes } from "./routes/battles.js";
import { voteRoutes } from "./routes/votes.js";
import { sseRoutes } from "./routes/sse.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
});

// Register API routes
await app.register(authRoutes);
await app.register(battleRoutes);
await app.register(voteRoutes);
await app.register(sseRoutes);

// In production, serve the Vite build
if (process.env.NODE_ENV === "production") {
  await app.register(fastifyStatic, {
    root: path.join(__dirname, "../dist"),
    prefix: "/",
  });

  // SPA fallback
  app.setNotFoundHandler((_req, reply) => {
    return reply.sendFile("index.html");
  });
}

const PORT = parseInt(process.env.PORT || "3001");

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`⚔️  Batalla de Titulares API running on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
