import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { router as apiRouter } from "./routes/index.js";
import { webhookRouter } from "./routes/webhooks.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Cast through `any`: helmet's dual CJS/ESM export shape resolves
// differently under some build environments' TS default-import interop
// (observed on Vercel's builder vs local), even though it's the same plain
// callable function at runtime either way.
app.use((helmet as any)());
// Dev frontends land on whatever port Vite finds free (5173, 5174, ...), and
// production frontends may be a Vercel preview URL, so reflect any localhost
// origin or *.vercel.app origin rather than hardcoding a single FRONTEND_URL.
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) ||
        origin === env.frontendUrl
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use((rateLimit as any)({ windowMs: 60_000, max: 300 }));

// Stripe webhook needs the raw body for signature verification, so it's
// mounted before the JSON body parser.
app.use("/api/webhooks", webhookRouter);

app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, demoMode: env.demoMode }));

app.use("/api", apiRouter);

app.use(errorHandler);

export default app;
