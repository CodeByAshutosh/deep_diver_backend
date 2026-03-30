import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { DecodedToken } from "../auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-prod";

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
