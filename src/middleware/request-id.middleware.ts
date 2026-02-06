import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";

const REQUEST_ID_HEADER = "x-request-id";

/* eslint-disable @typescript-eslint/no-namespace -- Express Request augmentation */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function requestIdMiddleware(): RequestHandler {
  return (req, res, next) => {
    const id =
      (typeof req.headers[REQUEST_ID_HEADER] === "string" &&
        req.headers[REQUEST_ID_HEADER]) ||
      randomUUID();
    req.requestId = id;
    res.locals.requestId = id;
    next();
  };
}
