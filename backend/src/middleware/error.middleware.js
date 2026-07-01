// backend/src/middleware/error.middleware.js
import { AppError } from "../utils/AppError.js";

export const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message };

  // Prisma: unique constraint
  if (err.code === "P2002") {
    error = new AppError(`${err.meta?.target?.[0] ?? "Field"} already exists`, 409);
  }

  // Prisma: record not found
  if (err.code === "P2025") {
    error = new AppError("Resource not found", 404);
  }

  // JWT
  if (err.name === "JsonWebTokenError") error = new AppError("Invalid token", 401);
  if (err.name === "TokenExpiredError") error = new AppError("Token expired", 401);

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : "Something went wrong";

  if (process.env.NODE_ENV === "development") {
    console.error("ERROR:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
