import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import registerHandler from './api/register';
import adminBookingsHandler from './api/admin/bookings';
import adminBookingDetailHandler from './api/admin/booking-detail';
import adminOccupancyHandler from './api/admin/occupancy';
import adminBlockKundHandler from './api/admin/block-kund';
import adminAttendanceHandler from './api/admin/attendance';

dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Mount Vercel-compatible /api routes for full-stack local dev and self-hosting
  app.all('/api/register', async (req, res) => {
    try {
      await registerHandler(req, res);
    } catch (err: any) {
      console.error('API register error in server:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  app.all('/api/admin/bookings', async (req, res) => {
    try {
      await adminBookingsHandler(req, res);
    } catch (err: any) {
      console.error('API admin bookings error in server:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  app.all('/api/admin/booking-detail', async (req, res) => {
    try {
      await adminBookingDetailHandler(req, res);
    } catch (err: any) {
      console.error('API admin booking-detail error in server:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  app.all('/api/admin/occupancy', async (req, res) => {
    try {
      await adminOccupancyHandler(req, res);
    } catch (err: any) {
      console.error('API admin occupancy error in server:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  app.all('/api/admin/block-kund', async (req, res) => {
    try {
      await adminBlockKundHandler(req, res);
    } catch (err: any) {
      console.error('API admin block-kund error in server:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  app.all('/api/admin/attendance', async (req, res) => {
    try {
      await adminAttendanceHandler(req, res);
    } catch (err: any) {
      console.error('API admin attendance error in server:', err);
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
