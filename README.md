<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/97decc90-4356-4dfa-ae50-5a1dda7dbfe5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase integration

1. Create a Supabase project.
2. Open Supabase SQL Editor and run [`schema.sql`](schema.sql).
3. Copy `.env.example` to `.env.local`, then fill:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Start the app with `npm run dev`.

When Supabase env values are present, the server loads data from Supabase on startup and syncs every CRUD change back to Supabase. If the env values are missing, it falls back to `data/db_store.json` for local development.

## Cloudinary image uploads

All uploaded images are compressed in the browser first, then sent to Cloudinary. Fill these values in `.env.local`:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

You can also use `CLOUDINARY_UPLOAD_PRESET` for unsigned uploads. If Cloudinary env values are missing during local development, `/api/upload` falls back to `data/uploads`; it does not use Supabase Storage. The upload endpoint rejects image payloads that are not marked as compressed.
