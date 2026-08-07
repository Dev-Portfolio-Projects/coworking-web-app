import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { ROLE_ADMIN } from '@/utils/roles'

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
      path: '/reservas',
      name: 'bookings',
      component: () => import('@/views/BookingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      redirect: '/admin/dashboard',
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
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
      path: '/admin/reservas',
      name: 'admin-bookings',
      component: () => import('@/views/admin/BookingView.vue'),
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

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) {
      return '/login'
    }
    if (auth.role === ROLE_ADMIN && to.path.startsWith('/reservas')) {
      return '/admin/reservas'
    }
  }
  if (to.meta.requiresAdmin) {
    if (!auth.isAuthenticated) {
      return '/login'
    }
    if (auth.role !== ROLE_ADMIN) {
      return '/'
    }
  }
})

export default router
