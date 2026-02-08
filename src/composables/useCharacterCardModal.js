import { ref } from 'vue'

const open = ref(false)
const characterId = ref('')
const isOwn = ref(true)

/**
 * 打开角色卡查看弹窗，跑团过程中查看他人角色卡时传 isOwn: false（将隐藏「能力体系」tab）
 * @param {string} id - 角色 id
 * @param {boolean} [own=true] - 是否为自己的角色卡
 */
export function openCharacterCard(id, own = true) {
  characterId.value = id || ''
  isOwn.value = !!own
  open.value = true
}

export function closeCharacterCard() {
  open.value = false
}

export function useCharacterCardModal() {
  return {
    open,
    characterId,
    isOwn,
    openCharacterCard,
    closeCharacterCard,
  }
}
