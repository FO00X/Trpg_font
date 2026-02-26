import { createRouter, createWebHistory } from 'vue-router'
import { APP_TITLE } from '../constants/app'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

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
    path: '/notes/new',
    name: 'note-new',
    component: () => import('../views/NoteEditView.vue'),
    meta: { title: '新建笔记', requiresAuth: true },
  },
  {
    path: '/notes/:id',
    name: 'note-edit',
    component: () => import('../views/NoteEditView.vue'),
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
    path: '/game-rooms/:id/edit',
    name: 'game-room-edit',
    component: () => import('../views/GameRoomEditView.vue'),
    meta: { title: '修改房间', requiresAuth: true },
  },
  {
    path: '/game-rooms/:id/chat',
    name: 'room-chat',
    component: () => import('../views/RoomChatView.vue'),
    meta: { title: '房间聊天', requiresAuth: true },
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
    component: () => import('../views/ClueEditView.vue'),
    meta: { title: '新建线索', requiresAuth: true },
  },
  {
    path: '/game-rooms/:roomId/clues/:clueId',
    name: 'clue-edit',
    component: () => import('../views/ClueEditView.vue'),
    meta: { title: '编辑线索', requiresAuth: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('../views/AdminUsersView.vue'),
    meta: { title: '用户列表（管理员）', requiresAuth: true },
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

router.beforeEach(async (to) => {
  const requiresAuth = to.meta.requiresAuth !== false
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const authStore = useAuthStore()
    if (!authStore.user) await authStore.setSession(session)
  }
  const loggedIn = !!session
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
