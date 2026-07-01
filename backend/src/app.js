// backend/src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import uploadRoutes from "./routes/upload.routes.js"
import authRoutes from "./routes/auth.routes.js";
import propertyRoutes from "./routes/property.routes.js";
import inquiryRoutes from "./routes/inquiry.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// ─── Security ───────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// ─── Rate Limiting ───────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 60,
  message: { success: false, message: "Too many attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Swagger ─────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Real Estate Platform API",
      version: "1.0.0",
      description: "API documentation for the real estate listing platform",
    },
    servers: [{ url: process.env.API_URL || "http://localhost:5000" }],
    tags: [
      { name: "Auth", description: "Registration, login, tokens, password reset" },
      { name: "Properties", description: "Property CRUD, search, filter, similar listings" },
      { name: "Inquiries", description: "Buyer-to-owner contact / lead module" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

// ─── 404 ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ─── Error Handler ───────────────────────────────────────────
app.use(errorHandler);

export default app;
