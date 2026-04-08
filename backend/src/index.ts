import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import bodegasRoutes from './routes/bodegas';
import producersRoutes from './routes/producers';
import upsRoutes from './routes/ups';
import cyclesRoutes from './routes/cycles';
import catalogosProductorRoutes from './routes/catalogos-productor';
import pool from './config/database';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'https://maiz.geodatos.com.mx'],
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/bodegas', bodegasRoutes);
app.use('/api/producers', producersRoutes);
app.use('/api/ups', upsRoutes);
app.use('/api', cyclesRoutes);
app.use('/api/catalogos-productor', catalogosProductorRoutes);

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📦 API disponible en http://localhost:${PORT}/api`);
});

export default app;
