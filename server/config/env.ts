import dotenv from "dotenv";

dotenv.config();

const requiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`[ENV ERROR] Thiếu biến môi trường: ${key}`);
  }

  return value;
};

export const ENV = {
  PORT: Number(process.env.PORT) || 3000,

  NODE_ENV: process.env.NODE_ENV || "development",

  MONGODB_URI: requiredEnv("MONGODB_URI"),

  DB_NAME: requiredEnv("DB_NAME"),

  JWT_SECRET: requiredEnv("JWT_SECRET"),

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  VITE_API_URL: process.env.VITE_API_URL || "/api",
};

// Validate configuration
if (ENV.NODE_ENV === "production" && ENV.JWT_SECRET.length < 32) {
  throw new Error(
    "[ENV ERROR] JWT_SECRET phải có ít nhất 32 ký tự trong production.",
  );
}
