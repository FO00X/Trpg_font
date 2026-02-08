/**
 * 实时通讯 Socket 服务
 * 可连接后端 TRPG Server（设置 VITE_SOCKET_URL）或使用内置 Mock 模式
 */

import { io } from 'socket.io-client'

const defaultUrl = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:23256'
const useMock = !import.meta.env.VITE_SOCKET_URL

/** Mock 事件发射器，模拟 socket（无服务端时演示用） */
function createMockSocket() {
  const listeners = new Map()
  return {
    connected: true,
    on(ev, fn) {
      if (!listeners.has(ev)) listeners.set(ev, [])
      listeners.get(ev).push(fn)
      return this
    },
    off(ev, fn) {
      const list = listeners.get(ev)
      if (!list) return this
      if (fn) {
        const i = list.indexOf(fn)
        if (i !== -1) list.splice(i, 1)
      } else listeners.set(ev, [])
      return this
    },
    emit(ev, ...args) {
      const list = listeners.get(ev) || []
      list.forEach((fn) => fn(...args))
      return this
    },
    _mockEmit(ev, ...args) {
      this.emit(ev, ...args)
    },
    disconnect() {},
  }
}

let socket = null
let mockSocket = null

export function useSocket() {
  if (socket) return socket
  if (useMock) {
    mockSocket = createMockSocket()
    return mockSocket
  }
  socket = io(defaultUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })
  return socket
}

/** 仅 Mock 模式下可用：模拟收到一条消息 */
export function mockReceiveMessage(payload) {
  if (mockSocket && typeof mockSocket._mockEmit === 'function') {
    mockSocket._mockEmit('message', payload)
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
