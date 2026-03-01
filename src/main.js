import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useProfileCache } from './stores/profileCache'
import './themes/light.css'
import './themes/dark.css'
import './style.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
// 恢复用户资料缓存（sessionStorage），减少重复请求
useProfileCache().init()
// 在后台恢复登录状态，不阻塞首屏；路由守卫会自行 getSession 并 setSession
useAuthStore().init().catch(() => {})
