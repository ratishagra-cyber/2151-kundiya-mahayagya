import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import registerHandler from './api/register';

dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Mount Vercel-compatible /api/register serverless route for full-stack local dev and self-hosting
  app.all('/api/register', async (req, res) => {
    try {
      await registerHandler(req, res);
    } catch (err: any) {
      console.error('API register error in server:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
