import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuthStore } from './store/auth';

import B01Login from './pages/B01Login';
import B02Register from './pages/B02Register';
import B03SelectBodegas from './pages/B03SelectBodegas';
import B04Dashboard from './pages/B04Dashboard';
import B05MisBodegas from './pages/B05MisBodegas';
import B06BodegaDetalle from './pages/B06BodegaDetalle';
import B07Inventario from './pages/B07Inventario';
import B08Semaforo from './pages/B08Semaforo';
import B09PrecioCompra from './pages/B09PrecioCompra';
import B10Requerimiento from './pages/B10Requerimiento';
import B11OfertaTabla from './pages/B11OfertaTabla';
import B13Transaccion from './pages/B13Transaccion';
import B14HistorialTransacciones from './pages/B14HistorialTransacciones';
import B15Tarifario from './pages/B15Tarifario';
import B16ProponerConcepto from './pages/B16ProponerConcepto';
import B17MisVentanillas from './pages/B17MisVentanillas';
import B18AltaVentanilla from './pages/B18AltaVentanilla';
import B20Solicitudes from './pages/B20Solicitudes';
import B21DetalleSolicitud from './pages/B21DetalleSolicitud';
import MasPage from './pages/MasPage';
import B22PreciosMercado from './pages/B22PreciosMercado';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth><Layout>{children}</Layout></RequireAuth>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <GuestOnly><B01Login /></GuestOnly> },
  { path: '/registro', element: <GuestOnly><B02Register /></GuestOnly> },
  { path: '/bodegas/seleccionar', element: <RequireAuth><B03SelectBodegas /></RequireAuth> },
  {
    path: '/dashboard',
    element: <ProtectedLayout><B04Dashboard /></ProtectedLayout>,
  },
  {
    path: '/mis-bodegas',
    element: <ProtectedLayout><B05MisBodegas /></ProtectedLayout>,
  },
  {
    path: '/bodegas/:id',
    element: <ProtectedLayout><B06BodegaDetalle /></ProtectedLayout>,
  },
  {
    path: '/bodegas/:id/semaforo',
    element: <ProtectedLayout><B08Semaforo /></ProtectedLayout>,
  },
  {
    path: '/inventario',
    element: <ProtectedLayout><B07Inventario /></ProtectedLayout>,
  },
  {
    path: '/precio-diario',
    element: <ProtectedLayout><B09PrecioCompra /></ProtectedLayout>,
  },
  {
    path: '/senales/nueva',
    element: <ProtectedLayout><B10Requerimiento /></ProtectedLayout>,
  },
  {
    path: '/requerimientos',
    element: <ProtectedLayout><B10Requerimiento /></ProtectedLayout>,
  },
  {
    path: '/oferta',
    element: <ProtectedLayout><B11OfertaTabla /></ProtectedLayout>,
  },
  {
    path: '/transacciones',
    element: <ProtectedLayout><B14HistorialTransacciones /></ProtectedLayout>,
  },
  {
    path: '/transacciones/nueva',
    element: <ProtectedLayout><B13Transaccion /></ProtectedLayout>,
  },
  {
    path: '/tarifario',
    element: <ProtectedLayout><B15Tarifario /></ProtectedLayout>,
  },
  {
    path: '/tarifario/proponer',
    element: <ProtectedLayout><B16ProponerConcepto /></ProtectedLayout>,
  },
  {
    path: '/ventanillas',
    element: <ProtectedLayout><B17MisVentanillas /></ProtectedLayout>,
  },
  {
    path: '/ventanillas/nueva',
    element: <ProtectedLayout><B18AltaVentanilla /></ProtectedLayout>,
  },
  {
    path: '/ventanillas/:id/solicitudes',
    element: <ProtectedLayout><B20Solicitudes /></ProtectedLayout>,
  },
  {
    path: '/ventanillas/:id/solicitudes/:sid',
    element: <ProtectedLayout><B21DetalleSolicitud /></ProtectedLayout>,
  },
  {
    path: '/mas',
    element: <ProtectedLayout><MasPage /></ProtectedLayout>,
  },
  {
    path: '/precios-mercado',
    element: <ProtectedLayout><B22PreciosMercado /></ProtectedLayout>,
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
