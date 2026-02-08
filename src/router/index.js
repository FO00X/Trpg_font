import { createRouter, createWebHistory } from 'vue-router'
import { APP_TITLE } from '../constants/app'
import { useAuthStore, hasStoredAuth } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('../views/ChatView.vue'),
    meta: { title: '聊天', requiresAuth: true },
  },
  {
    path: '/friends',
    name: 'friends',
    component: () => import('../views/FriendsView.vue'),
    meta: { title: '好友', requiresAuth: true },
  },
  {
    path: '/characters',
    name: 'characters',
    component: () => import('../views/CharactersView.vue'),
    meta: { title: '角色卡', requiresAuth: true },
  },
  {
    path: '/characters/new',
    name: 'character-new',
    component: () => import('../views/CharacterSheetView.vue'),
    meta: { title: '创建角色', requiresAuth: true },
  },
  {
    path: '/characters/:id',
    name: 'character-edit',
    component: () => import('../views/CharacterSheetView.vue'),
    meta: { title: '角色卡', requiresAuth: true },
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('../views/NotificationsView.vue'),
    meta: { title: '系统通知', requiresAuth: true },
  },
  {
    path: '/notes',
    name: 'notes',
    component: () => import('../views/NotesView.vue'),
    meta: { title: '笔记', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '页面不存在', requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const requiresAuth = to.meta.requiresAuth !== false
  // 用 localStorage 直接判断，避免 logout 后跳转登录页时守卫仍读到旧状态
  const loggedIn = hasStoredAuth()
  if (requiresAuth && !loggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && loggedIn) {
    return { path: '/chat' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - ${APP_TITLE}` : APP_TITLE
})

export default router
