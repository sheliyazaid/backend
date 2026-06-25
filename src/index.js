import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import flatRoutes from './routes/flatRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import importExportRoutes from './routes/importExportRoutes.js';
import parkingRoutes from './routes/parkingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (
        process.env.NODE_ENV !== 'production' &&
        /^https?:\/\/localhost(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Society Management API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/visitors', visitorRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
