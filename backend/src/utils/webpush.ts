import webpush from 'web-push';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:simac@agricultura.gob.mx',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  endpoint: string;
  p256dh:   string;
  auth:     string;
}

export interface PushPayload {
  titulo:  string;
  mensaje: string;
  tipo:    string;
  nivel:   string;
}

export const enviarPushNativa = async (
  suscripcion: PushSubscription,
  payload: PushPayload
): Promise<void> => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  await webpush.sendNotification(
    {
      endpoint: suscripcion.endpoint,
      keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth }
    },
    JSON.stringify({
      title: payload.titulo,
      body:  payload.mensaje,
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: { tipo: payload.tipo, nivel: payload.nivel, url: '/productor/alertas' }
    })
  );
};
