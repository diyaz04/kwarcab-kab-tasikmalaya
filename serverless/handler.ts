// Entry point serverless (Vercel). Di-bundle esbuild -> server-dist/handler.cjs
// supaya tidak ada masalah resolusi import ESM (tanpa ekstensi) di runtime Vercel.
import { app, db } from '../server';

export default async function handler(req: any, res: any) {
  try {
    await db.ready;
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Handler] Unhandled error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal server error', detail: err?.message || String(err) }));
    }
  }
}
