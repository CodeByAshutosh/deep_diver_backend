import express from "express";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import crypto from "crypto";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-prod";
const JWT_EXPIRY = "7d";

// In-memory storage (replace with database in production)
export const users: Record<
  string,
  {
    id: string;
    email: string;
    name: string;
    provider: string;
    providerId: string;
    isAdmin: boolean;
    createdAt: Date;
    lastLogin: Date;
  }
> = {};

export const apiUsage: Record<
  string,
  {
    id: string;
    userId: string;
    repoOwner: string;
    repoName: string;
    prNumber: number;
    slidesGenerated: number;
    tokensUsed: number;
    generatedAt: Date;
  }[]
> = {};

export const auditLogs: {
  id: string;
  userId: string | null;
  action: string;
  details: string;
  timestamp: Date;
}[] = [];

export interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

// Generate JWT token
export function generateToken(user: (typeof users)[string]): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

// Verify OAuth token with provider
async function verifyOAuthToken(
  provider: string,
  idToken: string
): Promise<{ email: string; name: string; id: string } | null> {
  try {
    if (provider === "github") {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${idToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      const data = (await res.json()) as any;
      return {
        email: data.email || `${data.login}@github.com`,
        name: data.name || data.login,
        id: data.id.toString(),
      };
    } else if (provider === "google") {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/tokeninfo", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `access_token=${idToken}`,
      });
      const data = (await res.json()) as any;
      return {
        email: data.email,
        name: data.email.split("@")[0],
        id: data.user_id,
      };
    } else if (provider === "microsoft") {
      const res = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = (await res.json()) as any;
      return {
        email: data.mail || data.userPrincipalName,
        name: data.displayName,
        id: data.id,
      };
    }
  } catch (err) {
    console.error(`OAuth verification failed for ${provider}:`, err);
  }
  return null;
}

// Sign up endpoint
router.post("/signup", async (req, res) => {
  const {
    email,
    name,
    provider,
    providerIdToken,
  } = req.body as {
    email?: string;
    name?: string;
    provider: string;
    providerIdToken: string;
  };

  try {
    // Verify OAuth token
    const oauthUser = await verifyOAuthToken(provider, providerIdToken);
    if (!oauthUser) {
      return res.status(401).json({ error: "Invalid OAuth token" });
    }

    const userEmail = email || oauthUser.email;
    const userName = name || oauthUser.name;

    // Check if user already exists
    const existingUser = Object.values(users).find(
      (u) => u.email === userEmail
    );
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    const userId = `user_${crypto.randomUUID()}`;
    const newUser = {
      id: userId,
      email: userEmail,
      name: userName,
      provider,
      providerId: oauthUser.id,
      isAdmin: userEmail === process.env.ADMIN_EMAIL,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    users[userId] = newUser;
    apiUsage[userId] = [];

    // Log signup
    auditLogs.push({
      id: crypto.randomUUID(),
      userId,
      action: "signup",
      details: `Signed up via ${provider}`,
      timestamp: new Date(),
    });

    const token = generateToken(newUser);
    res.json({ token, user: newUser });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  const { email, provider, providerIdToken } = req.body as {
    email?: string;
    provider: string;
    providerIdToken: string;
  };

  try {
    // Verify OAuth token
    const oauthUser = await verifyOAuthToken(provider, providerIdToken);
    if (!oauthUser) {
      return res.status(401).json({ error: "Invalid OAuth token" });
    }

    const userEmail = email || oauthUser.email;

    // Find user
    const user = Object.values(users).find((u) => u.email === userEmail);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update last login
    user.lastLogin = new Date();

    // Log login
    auditLogs.push({
      id: crypto.randomUUID(),
      userId: user.id,
      action: "login",
      details: `Logged in via ${provider}`,
      timestamp: new Date(),
    });

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user
router.get("/me", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = users[decoded.userId];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  // JWT is stateless, just return success
  res.json({ success: true });
});

// Get usage stats
router.get("/usage", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const userUsage = apiUsage[decoded.userId] || [];
    const slideCount = userUsage.length;
    const remaining = Math.max(0, 5 - slideCount);

    res.json({
      userId: decoded.userId,
      slidesUsed: slideCount,
      slidesRemaining: remaining,
      totalSlides: 5,
      usage: userUsage,
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
