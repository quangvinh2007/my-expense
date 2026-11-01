import express, { Request, Response, NextFunction } from "express";

import { corsMiddleware } from "./config/cors.ts";
import { isMongooseConnected } from "./config/database.ts";
import { ENV } from "./config/env.ts";

import authRoutes from "./routes/authRoutes.ts";
import transactionRoutes from "./routes/transactionRoutes.ts";
import familyRoutes from "./routes/familyRoutes.ts";
import categoryRoutes from "./routes/categoryRoutes.ts";
import reportRoutes from "./routes/reportRoutes.ts";

export const app = express();

// ============================================
// GLOBAL MIDDLEWARES
// ============================================

app.disable("x-powered-by");

app.use(corsMiddleware);

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (_req: Request, res: Response) => {
  const databaseConnected = isMongooseConnected;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    app: "My Expense",
    status: databaseConnected ? "healthy" : "database_disconnected",
    environment: ENV.NODE_ENV,
    database: {
      connected: databaseConnected,
      name: databaseConnected ? ENV.DB_NAME : null,
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// API ROUTES
// ============================================

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reports", reportRoutes);

// ============================================
// API 404 HANDLER
// ============================================

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API endpoint không tồn tại.",
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use(
  (
    err: Error & { status?: number },
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    console.error("[SERVER ERROR]", err);

    const statusCode = err.status || 500;

    res.status(statusCode).json({
      success: false,
      message: statusCode >= 500 ? "Đã xảy ra lỗi máy chủ." : err.message,
    });
  },
);
