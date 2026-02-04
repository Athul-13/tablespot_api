import cors from "cors";
import { env } from "@/config";

const allowedOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);

export const corsMiddleware = cors({
  origin: allowedOrigins,
  credentials: true,
});
