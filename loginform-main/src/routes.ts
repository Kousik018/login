import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "./db";
import { AuthedRequest, requireAuth } from "./middleware";

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

function signToken(userId: number) {
  return jwt.sign({}, process.env.JWT_SECRET!, {
    subject: String(userId),
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"],
  });
}

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
  }
  const { name, email, password } = parsed.data;

  const existing = await pool.query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (existing.rowCount) return res.status(409).json({ error: "Email already registered" });

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
    [name, email, hash]
  );
  const user = rows[0];
  res.status(201).json({ user, token: signToken(user.id) });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const { email, password } = parsed.data;

  const { rows } = await pool.query(
    "SELECT id, name, email, password_hash FROM users WHERE email = $1",
    [email]
  );
  const user = rows[0];
  // Same error for unknown email and wrong password, so emails can't be probed
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) return res.status(401).json({ error: "Incorrect email or password" });

  res.json({ user: { id: user.id, name: user.name, email: user.email }, token: signToken(user.id) });
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = $1", [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: "User not found" });
  res.json({ user: rows[0] });
});

export default router;
