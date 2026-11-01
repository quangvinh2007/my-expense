import cors from "cors";
import { ENV } from "./env.ts";

const allowedOrigins = [
  ENV.CLIENT_URL,
  ...(ENV.NODE_ENV === "development"
    ? [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
      ]
    : []),
];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin (curl, server-to-server, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Allow configured frontend origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow AI Studio / Cloud Run only if needed
    if (ENV.NODE_ENV !== "production" && origin.endsWith(".run.app")) {
      return callback(null, true);
    }

    // Reject untrusted origins
    return callback(new Error(`CORS blocked: ${origin}`));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);
