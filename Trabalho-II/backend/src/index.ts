import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import path from "node:path";
import { ensureDefaultAdmin } from "./bootstrap/ensure-default-admin";
import accessRoutes from "./modules/access/interfaces/http/access.routes";
import usersRoutes from "./modules/access/interfaces/http/users.routes";
import auditRoutes from "./modules/audit/interfaces/http/audit.routes";
import profilesRoutes from "./modules/profiles/interfaces/http/profiles.routes";
import productsRoutes from "./modules/products/interfaces/http/products.routes";
import commentsRoutes from "./modules/comments/interfaces/http/comments.routes";
import { auditLogger } from "./shared/http/middlewares/auditLogger";
import { UPLOADS_PATH } from "./shared/http/upload";

const app = express();
const port = Number(process.env.PORT || 3333);
const corsOrigin = process.env.CORS_ORIGIN || "*";
const allowedOrigins = corsOrigin.split(",").map((origin) => origin.trim());

app.use(
  cors({
    origin: corsOrigin === "*" ? true : allowedOrigins,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(auditLogger);

app.get("/health", (_req, res) => {
  return res.json({ status: "ok" });
});

app.use("/auth", accessRoutes);
app.use("/users", usersRoutes);
app.use("/audit-logs", auditRoutes);
app.use("/profiles", profilesRoutes);
app.use("/products", productsRoutes);
app.use(commentsRoutes);

app.use("/uploads", express.static(UPLOADS_PATH));

const frontendDir = path.join(__dirname, "..", "..", "frontend");
app.use(express.static(frontendDir));

async function startServer() {
  await ensureDefaultAdmin();

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

void startServer();
