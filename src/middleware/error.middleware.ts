import type { Request, Response, NextFunction } from "express";
import { AuthError } from "@/errors/auth";
import { RestaurantError } from "@/errors/restaurant";
import { logger } from "@/lib/logger";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express requires 4-arg signature for error middleware
  _next: NextFunction
): void {
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  if (err instanceof RestaurantError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  const meta: Record<string, unknown> = { requestId: req.requestId };
  if (err instanceof Error) {
    logger.error("Unhandled error", {
      ...meta,
      message: err.message,
      stack: err.stack,
    });
  } else {
    logger.error("Unhandled error", { ...meta, error: err });
  }

  res.status(500).json({ error: "Internal server error" });
}
