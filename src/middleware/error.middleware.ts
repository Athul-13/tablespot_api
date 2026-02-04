import type { Request, Response, NextFunction } from "express";
import { AuthError } from "@/errors/auth";
import { logger } from "@/lib/logger";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express requires 4-arg signature for error middleware
  _next: NextFunction
): void {
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof Error) {
    logger.error("Unhandled error", { message: err.message, stack: err.stack });
  } else {
    logger.error("Unhandled error", { error: err });
  }

  res.status(500).json({ error: "Internal server error" });
}
