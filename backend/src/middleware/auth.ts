import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../lib/jwt";

// Extend Express Request with user info
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Optional auth — doesn't fail, just sets req.user if valid
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      req.user = verifyAccessToken(token);
    } catch {
      // Ignore invalid tokens in optional auth
    }
  }

  next();
}
