import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import bodegasRoutes from './routes/bodegas';
import misBodegasRoutes from './routes/mis-bodegas';
import misInventariosRoutes from './routes/mis-inventarios';
import preciosMaizRoutes from './routes/precios-maiz';
import producersRoutes from './routes/producers';
import upsRoutes from './routes/ups';
import cyclesRoutes from './routes/cycles';
import catalogosProductorRoutes from './routes/catalogos-productor';
import seguimientoRoutes from './routes/seguimiento';
import alertasRoutes from './routes/alertas';
import infraestructuraRoutes from './routes/infraestructura';
import preciosRoutes from './routes/precios';
import preciosSistemaRoutes from './routes/precios-sistema';
import adminRoutes from './routes/admin';
import adminMercadoRoutes from './routes/admin-mercado';
import misUpsRoutes from './routes/mis-ups';
import misProductoresRoutes from './routes/mis-productores';
import homeRoutes from './routes/home';
import dashboardAdminRoutes from './routes/dashboard-admin';
import bodegueroRoutes from './routes/bodeguero';
import senalesCompraRoutes from './routes/senales-compra';
import transaccionesRoutes from './routes/transacciones';
import tarifarioRoutes from './routes/tarifario';
import catConceptosRoutes from './routes/cat-conceptos-servicio';
import ventanillasRoutes from './routes/ventanillas';
import ofertaRoutes from './routes/oferta';
import productoresRoutes from './routes/productores';
import disponibilidadRoutes from './routes/disponibilidad';
import productorRoutes from './routes/productor';
import { scheduleBodegaDailyJobs } from './jobs/bodegaDailyJobs';
import { schedulePreciosCron } from './jobs/preciosCron';
import pool from './config/database';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Middleware
const ORIGENES_PERMITIDOS = [
  // Dominio oficial — Secretaría de Agricultura
  'https://maiz.agricultura.gob.mx', 'https://apimaiz.agricultura.gob.mx',
  // Dominio anterior (en transición — redirige a agricultura.gob.mx)
  'https://maiz.geodatos.com.mx', 'https://bodega.geodatos.com.mx',
];
// Desarrollo: permitir el frontend corrido localmente desde CUALQUIER dispositivo
// y puerto — localhost/127.0.0.1 y direcciones de red local (LAN): 10.x, 172.16-31.x,
// 192.168.x. Así un celular u otra laptop pueden abrir el frontend local (http://IP:5174)
// apuntando a esta API sin levantar el backend localmente.
const ES_RED_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|10(\.\d{1,3}){3}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}|192\.168(\.\d{1,3}){2})(:\d+)?$/;

app.use(cors({
  origin: (origin, cb) => {
    // Sin origin (curl, health checks, apps móviles) → permitir
    if (!origin) return cb(null, true);
    if (ORIGENES_PERMITIDOS.includes(origin) || ES_RED_LOCAL.test(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

// Archivos estáticos — verificaciones biométricas (avisos de privacidad)
const UPLOADS_DIR = process.env.NODE_ENV === 'production'
  ? '/var/www/Simulador/uploads'
  : path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/bodegas', bodegasRoutes);
app.use('/api/mis-bodegas', misBodegasRoutes);
app.use('/api/mis-inventarios', misInventariosRoutes);
app.use('/api/precios-maiz', preciosMaizRoutes);
app.use('/api/producers', producersRoutes);
app.use('/api/ups', upsRoutes);
app.use('/api', cyclesRoutes);
app.use('/api/catalogos-productor', catalogosProductorRoutes);
app.use('/api/seguimiento', seguimientoRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/infraestructura', infraestructuraRoutes);
app.use('/api/precios', preciosRoutes);
app.use('/api/precios', preciosSistemaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminMercadoRoutes);
app.use('/api/mis-ups', misUpsRoutes);
app.use('/api/mis-productores', misProductoresRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/dashboard/admin', dashboardAdminRoutes);
app.use('/api/bodeguero', bodegueroRoutes);
app.use('/api/senales-compra', senalesCompraRoutes);
app.use('/api/transacciones', transaccionesRoutes);
app.use('/api/tarifario', tarifarioRoutes);
app.use('/api/cat-conceptos-servicio', catConceptosRoutes);
app.use('/api/ventanillas', ventanillasRoutes);
app.use('/api/oferta', ofertaRoutes);
app.use('/api/productores', productoresRoutes);
app.use('/api/productor/disponibilidad', disponibilidadRoutes);
app.use('/api/productor', productorRoutes);

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
  scheduleBodegaDailyJobs();
  schedulePreciosCron();
});

export default app;
