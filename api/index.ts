import { app, db } from '../server';

// Wait for database to be ready before handling requests
let dbReady = false;
db.ready.then(() => { dbReady = true; }).catch(() => { dbReady = true; });

export default async function handler(req: any, res: any) {
  try {
    // Ensure DB initialization is awaited
    await db.ready;
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Handler] Unhandled error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', detail: err?.message });
    }
  }
}
