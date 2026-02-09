import { ref } from 'vue'

// Mock 房间数据（在房间列表与创建页之间共享）
const rooms = ref([
  {
    id: 'room-1',
    name: '亡蝶葬仪',
    description: '测试新模组。',
    module: '亡蝶葬仪',
    moduleIcon: 'mdi:butterfly',
    owner: 'KP-熊猫',
    maxPlayers: 6,
    currentPlayers: 3,
    status: 'recruiting', // recruiting, full, started
    tags: ['恐怖', '调查', 'COC'],
    createdAt: '2026-02-05',
  },
  {
    id: 'room-2',
    name: '致我不灭的',
    description: '测试新模组。',
    module: '致我不灭的',
    moduleIcon: 'mdi:fire',
    owner: 'KP-田中',
    maxPlayers: 4,
    currentPlayers: 4,
    status: 'full',
    tags: ['奇幻', '冒险'],
    createdAt: '2026-02-03',
  },
  {
    id: 'room-3',
    name: '新模组测试',
    description: '测试新模组。',
    module: '测试模组',
    moduleIcon: 'mdi:test-tube',
    owner: 'KP-方糕',
    maxPlayers: 5,
    currentPlayers: 2,
    status: 'recruiting',
    tags: ['测试'],
    createdAt: '2026-02-08',
  },
])

const availableModules = [
  { id: 'wangdie', name: '亡蝶葬仪', icon: 'mdi:butterfly' },
  { id: 'zhivo', name: '致我不灭的', icon: 'mdi:fire' },
  { id: 'custom', name: '自定义模组', icon: 'mdi:file-document-edit' },
]

const availableTags = ['恐怖', '调查', 'COC', '奇幻', '冒险', '现代', '古代', '科幻', '测试']

export function useGameRoomsStore() {
  function addRoom(payload) {
    rooms.value.unshift(payload)
  }

  return {
    rooms,
    availableModules,
    availableTags,
    addRoom,
  }
}

