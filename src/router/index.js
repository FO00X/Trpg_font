import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'chat',
    component: () => import('../views/ChatView.vue'),
    meta: { title: '聊天' },
  },
  {
    path: '/friends',
    name: 'friends',
    component: () => import('../views/FriendsView.vue'),
    meta: { title: '好友' },
  },
  {
    path: '/characters',
    name: 'characters',
    component: () => import('../views/CharactersView.vue'),
    meta: { title: '角色卡' },
  },
  {
    path: '/characters/new',
    name: 'character-new',
    component: () => import('../views/CharacterSheetView.vue'),
    meta: { title: '创建角色' },
  },
  {
    path: '/characters/:id',
    name: 'character-edit',
    component: () => import('../views/CharacterSheetView.vue'),
    meta: { title: '角色卡' },
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('../views/NotificationsView.vue'),
    meta: { title: '系统通知' },
  },
  {
    path: '/notes',
    name: 'notes',
    component: () => import('../views/NotesView.vue'),
    meta: { title: '笔记' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - FOXTrpg` : 'FOXTrpg'
})

export default router
