/**
 * Express app for Vercel serverless `/api/*`.
 * Static marketing UI is served from `dist/` via vercel.json rewrites.
 */

import express from 'express';
import { mountPlatformRoutes } from './platformRoutes';
import { createGeminiClient, mountMeridianApiRoutes } from './meridianApiRoutes';

const app = express();
app.use(express.json({ limit: '4mb' }));

const ai = createGeminiClient();
if (!ai) {
  console.warn(
    'GEMINI_API_KEY not set — plan generation and mood boards use offline fallbacks.',
  );
}

mountPlatformRoutes(app);
mountMeridianApiRoutes(app, { getAi: () => ai });

export default app;
