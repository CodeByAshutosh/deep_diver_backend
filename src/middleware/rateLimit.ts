import { Request, Response, NextFunction } from "express";
import { apiUsage, auditLogs } from "../auth.js";
import crypto from "crypto";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name: string;
        isAdmin: boolean;
      };
    }
  }
}

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Admin bypass
  if (user.isAdmin) {
    return next();
  }

  const userUsage = apiUsage[user.userId] || [];
  const slideCount = userUsage.length;

  if (slideCount >= 5) {
    // Log rate limit hit
    auditLogs.push({
      id: crypto.randomUUID(),
      userId: user.userId,
      action: "reach_limit",
      details: "Attempted to generate slides but hit 5-slide limit",
      timestamp: new Date(),
    });

    return res.status(429).json({
      error: "Rate limit exceeded",
      message: "You have reached your 5 free slides limit. Upgrade to Pro for unlimited slides.",
      slidesUsed: slideCount,
      slidesRemaining: 0,
    });
  }

  // Store remaining slides in response locals for later use
  res.locals.slidesRemaining = 5 - slideCount;
  next();
}
