/**
 * 主题注册与切换（与 daisyUI 一致使用 data-theme）
 *
 * 添加新主题：
 * 1. 在 themes 目录下新建 xxx.css，选择器为 [data-theme="xxx"]
 * 2. 在 main.js 中 import './themes/xxx.css'
 * 3. 在本文件的 THEMES 数组中添加 { id: 'xxx', name: '显示名称' }
 * 4. 在 style.css 的映射块中加上 [data-theme="xxx"]（如有需要）
 */

export const THEMES = [
  { id: 'light', name: '亮色' },
  { id: 'dark', name: '暗色' },
]

/**
 * 应用主题：在 html 上设置 data-theme（daisyUI 与项目主题均依赖此属性）
 * @param {string} themeId - 'light' | 'dark'
 */
export function applyTheme(themeId) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  const id = THEMES.some((t) => t.id === themeId) ? themeId : 'light'
  html.setAttribute('data-theme', id)
}

export function getThemeClass(themeId) {
  return ''
}
