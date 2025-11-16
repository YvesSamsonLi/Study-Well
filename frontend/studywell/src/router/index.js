import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/views/LoginPage.vue'
import AboutPage from '@/views/AboutPage.vue'
import CalendarPage from '@/views/CalendarPage.vue'
import TimetablePage from '@/views/TimetablePage.vue'
import TestBed from '@/views/TestBed.vue'
// Import other pages as you create them

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

    {
      path: '/',
      redirect: '/login',
    },

    {
      path: '/login',
      name: 'Login',
      component: LoginPage,
      meta: { hideNavbar: true },
    },

    {
      path: '/about',
      name: 'About',
      component: AboutPage,
      meta: { hideNavbar: true },
    },

    {
      path: '/calendar',
      name: 'Calendar',
      component: CalendarPage,
      meta: { isAuthenticated: true },
      // no meta field means navbar shows
    },

    {
      path: '/timetable',
      name: 'Timetable',
      component: TimetablePage,
      meta: { isAuthenticated: true },
    },

    {
      path: '/timetable_p',
      name: 'Timetable_p',
      meta: { isAuthenticated: true },
      component: () => import('@/views/TimetablePagePreview.vue'),
    },

    {
      path: '/dashboard',
      name: 'Dashboard',
      meta: { isAuthenticated: true },
      component: () => import('@/views/DashboardPage.vue')
    },

    {
    path: '/testbed',
    name: 'TestBed',
    meta: { isAuthenticated: true },
    component: TestBed
  }
  ],
})


import { useToast } from "vue-toastification";

const toast = useToast();

router.beforeEach(async (to, from, next) => {
  if (to.matched.some(record => record.meta.isAuthenticated)) {
    const token = localStorage.getItem('userToken');
    if (!token || token === '[object Object]') {
      toast.error("Not authenticated. Redirected to login...");
      return next('/login');
    }
    try {
      const response = await fetch('http://localhost:3000/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        localStorage.removeItem('userToken');
        toast.error("Session expired or invalid. Redirected to login...");
        return next('/login');
      }
    } catch (err) {
      localStorage.removeItem('userToken');
      toast.error("Cannot contact server. Redirected to login.");
      return next('/login');
    }
  }
  next();
});

export default router
