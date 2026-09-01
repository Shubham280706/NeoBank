// Vercel serverless entry point — the file path api/index.ts maps to the
// /api route, and vercel.json rewrites every incoming request path here so
// Express's own router (which already expects paths like /health,
// /api/accounts, etc.) sees the original, unmodified URL.
import app from "../src/app.js";

export default app;
