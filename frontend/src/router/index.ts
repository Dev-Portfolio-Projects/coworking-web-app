import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: () => import('@/views/CatalogView.vue'),
    },
    {
      path: '/spaces/:id',
      name: 'space-detail',
      component: () => import('@/views/SpaceDetailView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/AdminDashboard.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/usuarios',
      name: 'admin-users',
      component: () => import('@/views/admin/UserView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/espacios',
      name: 'admin-spaces',
      component: () => import('@/views/admin/SpaceView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/recursos',
      name: 'admin-amenities',
      component: () => import('@/views/admin/AmenityView.vue'),
      meta: { requiresAdmin: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.isAuthenticated && !auth.user) {
    try {
      await auth.fetchProfile()
    } catch {
      // Sesión inválida o error de red: el interceptor HTTP redirige a /login en caso de 401
    }
  }
  if (to.meta.requiresAdmin) {
    if (!auth.isAuthenticated) {
      return '/login'
    }
    if (auth.role !== 1) {
      return '/'
    }
  }
})

export default router
