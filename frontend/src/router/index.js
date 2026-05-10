import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const routes = [
  {
    path: '/',
    redirect: () => {
      const auth = useAuthStore()
      if (!auth.isAuthenticated) return '/login'
      return auth.isEmployee ? '/employee' : '/employer'
    },
  },
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    component: () => import('../views/Register.vue'),
    meta: { guest: true },
  },
  {
    path: '/employee',
    component: () => import('../views/EmployeeDashboard.vue'),
    meta: { requiresAuth: true, role: 'employee' },
  },
  {
    path: '/employee/apply',
    component: () => import('../views/ApplyLeave.vue'),
    meta: { requiresAuth: true, role: 'employee' },
  },
  {
    path: '/employer',
    component: () => import('../views/EmployerDashboard.vue'),
    meta: { requiresAuth: true, role: 'employer' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/login')
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return next(auth.isEmployee ? '/employee' : '/employer')
  }

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return next(auth.isEmployee ? '/employee' : '/employer')
  }

  next()
})

export default router
