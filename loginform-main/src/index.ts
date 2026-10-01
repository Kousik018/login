import "dotenv/config";
import path from "path";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { initDb } from "./db";
import routes from "./routes";

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error("JWT_SECRET and DATABASE_URL must be set");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1); // needed behind Render/Railway/Fly proxies for rate limiting
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(
  "/api/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false }),
  routes
);

// Serves the login/signup page
app.use(express.static(path.join(__dirname, "..", "public")));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const port = Number(process.env.PORT) || 3000;
initDb()
  .then(() => app.listen(port, () => console.log(`Listening on :${port}`)))
  .catch((e) => {
    console.error("Database init failed", e);
    process.exit(1);
  });
