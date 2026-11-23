import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5055),
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
  dataDir: path.resolve(process.env.DATA_DIR || path.resolve(__dirname, "../../data")),
  adminEmail: process.env.ADMIN_EMAIL || "admin@reneo.my.id",
  adminPassword: process.env.ADMIN_PASSWORD || "reneo-admin-2026",
  sessionSecret: process.env.SESSION_SECRET || "reneo-skills-dev-secret-change-me",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5178",
  publicUrl: process.env.PUBLIC_URL || "http://localhost:5055",
  frontendDistDir: path.resolve(process.env.FRONTEND_DIST_DIR || path.resolve(__dirname, "../../frontend/dist")),
};
