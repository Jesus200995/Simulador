import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/registro',
    name: 'Registro',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    name: 'Mapa',
    component: () => import('@/views/MapView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/bodega/:id',
    name: 'BodegaDetalle',
    component: () => import('@/views/BodegaDetalleView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/productor',
    name: 'ProductorUP',
    component: () => import('@/views/ProductorUPView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/productor/paso1',
    name: 'ProductorRegistro',
    component: () => import('@/views/ProductorRegistroView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/nueva-bodega',
    name: 'NuevaBodega',
    component: () => import('@/views/NuevaBodegaView.vue'),
    meta: { requiresAuth: true, roles: ['responsable', 'admin'] }
  },
  {
    path: '/mis-bodegas',
    name: 'MisBodegas',
    component: () => import('@/views/MisBodegasView.vue'),
    meta: { requiresAuth: true, roles: ['responsable', 'admin'] }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.meta.guest && auth.isAuthenticated) {
    next({ name: 'Mapa' })
  } else if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const allowedRoles = to.meta.roles as string[]
    if (!allowedRoles.includes(auth.rol)) {
      next({ name: 'Mapa' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
