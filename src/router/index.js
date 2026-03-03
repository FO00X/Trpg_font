import { createRouter, createWebHashHistory } from 'vue-router'
import { APP_TITLE } from '../constants/app'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/chat',
    redirect: () => ({ path: '/friends' }),
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
    path: '/achievements',
    name: 'achievements',
    component: () => import('../views/AchievementsView.vue'),
    meta: { title: '成就', requiresAuth: true },
  },
  {
    path: '/notes/new',
    name: 'note-new',
    component: () => import('../views/DocEditView.vue'),
    meta: { title: '新建笔记', requiresAuth: true },
  },
  {
    path: '/notes/:id',
    name: 'note-edit',
    component: () => import('../views/DocEditView.vue'),
    meta: { title: '编辑笔记', requiresAuth: true },
  },
  {
    path: '/game-rooms',
    name: 'game-rooms',
    component: () => import('../views/GameRoomsView.vue'),
    meta: { title: '跑团', requiresAuth: true },
  },
  {
    path: '/game-rooms/new',
    name: 'game-room-new',
    component: () => import('../views/GameRoomCreateView.vue'),
    meta: { title: '创建房间', requiresAuth: true },
  },
  {
    path: '/game-rooms/:id',
    name: 'game-room',
    component: () => import('../views/GameRoomView.vue'),
    meta: { title: '房间', requiresAuth: true },
  },
  {
    path: '/game-rooms/:roomId/clues',
    name: 'clues',
    component: () => import('../views/CluesView.vue'),
    meta: { title: '线索', requiresAuth: true },
  },
  {
    path: '/game-rooms/:roomId/clues/new',
    name: 'clue-new',
    component: () => import('../views/DocEditView.vue'),
    meta: { title: '新建线索', requiresAuth: true },
  },
  {
    path: '/game-rooms/:roomId/clues/:clueId',
    name: 'clue-edit',
    component: () => import('../views/DocEditView.vue'),
    meta: { title: '编辑线索', requiresAuth: true },
  },
  {
    path: '/game-rooms/:roomId/module',
    name: 'room-module',
    component: () => import('../views/RoomModuleView.vue'),
    meta: { title: '模组信息', requiresAuth: true },
  },
  {
    path: '/game-rooms/:roomId/module/entries/new',
    name: 'module-entry-new',
    component: () => import('../views/DocEditView.vue'),
    meta: { title: '新建词条', requiresAuth: true },
  },
  {
    path: '/game-rooms/:roomId/module/entries/:entryId',
    name: 'module-entry-edit',
    component: () => import('../views/DocEditView.vue'),
    meta: { title: '编辑词条', requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'admin',
    redirect: { path: '/admin/users' },
    meta: { title: '管理后台（管理员）', requiresAuth: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('../views/AdminUsersView.vue'),
    props: { standalone: true },
    meta: { title: '人员信息', requiresAuth: true },
  },
  {
    path: '/admin/ai',
    name: 'admin-ai',
    component: () => import('../views/AdminAIView.vue'),
    props: { standalone: true },
    meta: { title: 'AI 配置', requiresAuth: true },
  },
  {
    path: '/admin/dice',
    name: 'admin-dice',
    component: () => import('../views/AdminDiceView.vue'),
    props: { standalone: true },
    meta: { title: '骰子设置', requiresAuth: true },
  },
  {
    path: '/admin/achievements',
    name: 'admin-achievements',
    component: () => import('../views/AdminAchievementsView.vue'),
    props: { standalone: true },
    meta: { title: '成就管理', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '页面不存在', requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.ensureInitialized()
  const requiresAuth = to.meta.requiresAuth !== false
  const loggedIn = !!authStore.user?.value
  if (requiresAuth && !loggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && loggedIn) {
    return { path: '/game-rooms' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - ${APP_TITLE}` : APP_TITLE
})

export default router
