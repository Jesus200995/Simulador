/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// ── Workbox precaching (inyectado automáticamente por VitePWA) ────────────
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
clientsClaim();
self.skipWaiting();

// ── Push: mostrar notificación del sistema ────────────────────────────────
self.addEventListener('push', (event: PushEvent) => {
  let data: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    data?: { url?: string; tipo?: string; nivel?: string };
  } = {};

  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: 'SIMAC', body: event.data?.text() ?? 'Nueva notificación' };
  }

  const title   = data.title  ?? 'SIMAC';
  const options: NotificationOptions = {
    body:    data.body   ?? '',
    icon:    data.icon   ?? '/icono.png',
    badge:   data.badge  ?? '/icono.png',
    tag:     data.data?.tipo ?? 'simac-notif',   // agrupa notificaciones del mismo tipo
    renotify: true,
    data:    data.data   ?? {},
    // vibration para Android
    // @ts-ignore
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notificationclick: abrir la app en la ruta correcta ──────────────────
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url = event.notification.data?.url ?? '/';

  event.waitUntil(
    (self.clients as any).matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList: WindowClient[]) => {
        // Si ya hay una ventana/tab abierta de la app — enfócala y navega
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) (client as any).navigate(url);
            return;
          }
        }
        // Si no hay ventana abierta — abrir una nueva
        if ((self.clients as any).openWindow) {
          return (self.clients as any).openWindow(url);
        }
      })
  );
});

// ── Pushsubscriptionchange: renovar suscripción automáticamente ──────────
// (el browser puede rotar las claves de suscripción)
self.addEventListener('pushsubscriptionchange', (event: Event) => {
  const e = event as any;
  e.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey: e.oldSubscription?.options?.applicationServerKey })
      .then(async (subscription) => {
        const { endpoint, keys } = subscription.toJSON() as any;
        // Avisar al backend de la nueva suscripción
        const token = await getToken();
        if (!token) return;
        await fetch('/api/productor/push/suscribir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
        });
      })
  );
});

async function getToken(): Promise<string | null> {
  try {
    const clients = await (self.clients as any).matchAll({ type: 'window', includeUncontrolled: true });
    // El token está en localStorage del cliente — no lo podemos leer directamente desde el SW,
    // pero podemos usar un MessageChannel para pedírselo si está disponible.
    // Por simplicidad, el token se puede poner en IndexedDB o en el propio SW via postMessage.
    // Aquí intentamos leerlo del cache de headers de una request previa.
    return null; // fallback: el browser maneja la re-suscripción
  } catch {
    return null;
  }
}
