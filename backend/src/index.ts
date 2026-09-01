// Local dev / traditional server entry point. On Vercel, api/index.ts
// imports the app from ./app.js directly instead — Vercel's Node.js runtime
// invokes it as a serverless function rather than calling app.listen().
import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`[neo-bank-api] listening on :${env.port} (demoMode=${env.demoMode})`);
});
