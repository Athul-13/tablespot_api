import type { RequestHandler } from "express";
import { logger } from "@/lib/logger";

export function requestLoggerMiddleware(): RequestHandler {
  return (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const durationMs = Date.now() - start;
      const meta: Record<string, unknown> = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
        requestId: req.requestId,
      };
      if (req.user?.id) {
        meta.userId = req.user.id;
      }
      logger.info("Request completed", meta);
    });
    next();
  };
}
