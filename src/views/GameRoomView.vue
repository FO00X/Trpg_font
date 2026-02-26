<template>
  <div class="flex flex-col h-full">
    <PageHeader
      :title="room?.title || '加载中…'"
      icon="mdi:dice-multiple"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <!-- 查看房间用户 / 角色列表 -->
          <!-- 玩家：没有角色卡时，显示“暂无角色卡，去创建” -->
          <button
            v-if="room && !isOwner && !characters.length"
            type="button"
            class="flex items-center gap-1 px-3 py-2 rounded-lg bg-sidebar-active text-sm text-accent-muted hover:text-white hover:bg-sidebar-hover transition-colors"
            @click="router.push('/characters')"
          >
            <Icon icon="mdi:card-account-details-outline" class="text-lg shrink-0" />
            <span>暂无角色卡，去创建</span>
          </button>

          <!-- 切换角色卡（房主 + 有角色卡的玩家） -->
          <Menu v-else-if="room" as="div" class="relative">
            <MenuButton
              type="button"
              class="flex items-center gap-1 p-2 rounded-lg bg-sidebar-active text-white hover:bg-sidebar-hover transition-colors text-sm"
            >
              <Icon icon="mdi:card-account-details-outline" class="text-lg shrink-0" />
              <span class="max-w-[160px] truncate">{{ characterMenuLabel }}</span>
              <Icon icon="mdi:chevron-down" class="text-lg shrink-0 opacity-70" />
            </MenuButton>
            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <MenuItems
                class="absolute right-0 top-full mt-2 w-56 rounded-lg bg-sidebar border border-chat-border shadow-xl py-1 z-50 focus:outline-none max-h-64 overflow-y-auto"
              >
                <MenuItem v-slot="{ active }">
                  <button
                    type="button"
                    :class="[
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      active ? 'bg-sidebar-hover text-white' : 'text-[#a6adc8]',
                    ]"
                    @click="selectCharacter(null)"
                  >
                    <Icon icon="mdi:account-off-outline" class="text-lg shrink-0" />
                    不使用角色卡
                  </button>
                </MenuItem>

                <!-- 可选择的角色卡（房主：全部；玩家：仅已审核通过） -->
                <MenuItem
                  v-for="c in selectableCharacters"
                  :key="c.id"
                  v-slot="{ active }"
                >
                  <button
                    type="button"
                    :class="[
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      active ? 'bg-sidebar-hover text-white' : 'text-[#a6adc8]',
                      selectedCharacterId === c.id ? 'bg-accent/20 text-accent' : '',
                    ]"
                    @click="selectCharacter(c.id)"
                  >
                    <Icon icon="mdi:card-account-details" class="text-lg shrink-0" />
                    <span class="truncate">{{ c.name || '未命名' }}</span>
                  </button>
                </MenuItem>

                <!-- 玩家已有角色卡但尚未通过 KP 审核时的提示 -->
                <div
                  v-if="!isOwner && characters.length && !selectableCharacters.length"
                  class="px-3 py-2 text-xs text-accent-muted border-t border-chat-border/40"
                >
                  你已有角色卡，请在角色卡详情中交给 KP 审核。
                  审核通过后，可以在此处选择角色卡使用（审核通过后该角色卡将锁定，不能再修改）。
                </div>

                <!-- 去角色卡列表页 -->
                <div class="border-t border-chat-border/50 mt-1 pt-1">
                  <MenuItem v-slot="{ active }">
                    <button
                      type="button"
                      :class="[
                        'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                        active ? 'bg-sidebar-hover text-white' : 'text-accent-muted hover:text-white',
                      ]"
                      @click="router.push('/characters')"
                    >
                      <Icon icon="mdi:plus" class="text-lg shrink-0" />
                      去管理角色卡
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
          <button
            v-if="room"
            type="button"
            class="p-2 rounded-lg bg-sidebar-active text-white hover:bg-sidebar-hover transition-colors"
            title="查看房间用户与角色"
            @click="membersOpen = true"
          >
            <Icon icon="mdi:account-group-outline" class="text-lg" />
          </button>
        </div>
      </template>
    </PageHeader>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <LoadingSpinner message="加载中…" />
    </div>
    <div v-else-if="!room" class="flex-1 flex items-center justify-center text-accent-muted">
      <div class="text-center">
        <p class="mb-2">房间不存在或无权访问</p>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30"
          @click="goBack"
        >
          返回大厅
        </button>
      </div>
    </div>
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div class="flex-1 min-h-0">
        <!-- 日志视图 -->
        <RoomLogView
          v-if="activeTab === 'log'"
          :room-id="roomId"
          class="h-full"
        />

        <!-- 房间信息视图 -->
        <div
          v-else-if="activeTab === 'info'"
          class="h-full overflow-y-auto scroll-thin p-4"
        >
          <div class="max-w-2xl mx-auto space-y-4">
            <div class="rounded-xl bg-chat-panel border border-chat-border p-4">
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="getStatusColor(room.status)"
                >
                  {{ getStatusLabel(room.status) }}
                </span>
                <span class="text-sm text-accent-muted">{{ room.module }}</span>
              </div>
              <p v-if="room.description" class="text-sm text-[#a6adc8] whitespace-pre-wrap">
                {{ room.description }}
              </p>
              <div v-if="room.tags?.length" class="flex flex-wrap gap-1.5 mt-2">
                <span
                  v-for="tag in room.tags"
                  :key="tag"
                  class="px-2 py-0.5 rounded text-xs bg-sidebar-active text-accent-muted"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- 当前使用的角色卡 -->
            <div v-if="selectedCharacterId" class="rounded-xl bg-chat-panel border border-chat-border p-4">
              <h3 class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-2">
                当前角色
              </h3>
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
                  <Icon icon="mdi:card-account-details" class="text-xl text-accent" />
                </div>
                <div>
                  <p class="font-medium text-white">
                    {{ currentCharacter?.name || '未命名' }}
                  </p>
                  <p class="text-xs text-accent-muted">
                    {{ currentCharacter?.occupation || '—' }}
                  </p>
                </div>
                <button
                  type="button"
                  class="ml-auto px-3 py-1.5 rounded-lg text-sm text-accent hover:bg-accent/20"
                  @click="showCharacterCard"
                >
                  查看角色卡
                </button>
              </div>
            </div>

            <!-- 功能按钮区域（线索 / 管理） -->
            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-chat-panel border border-chat-border text-white hover:border-accent/50 hover:bg-accent/10 transition-colors"
                @click="router.push({ name: 'clues', params: { roomId: roomId } })"
              >
                <Icon icon="mdi:lightbulb-on-outline" class="text-lg shrink-0" />
                <span>查看线索</span>
              </button>
          <!-- 角色卡审核：所有人可见，只有房主可操作 -->
              <button
                type="button"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-chat-panel border border-chat-border text-white hover:border-accent/50 hover:bg-accent/10 transition-colors"
                @click="characterReviewOpen = true; loadRoomCharacterApplications()"
              >
                <Icon icon="mdi:clipboard-list-outline" class="text-lg shrink-0" />
                <span>角色卡审核</span>
              </button>
              <!-- 仅房主可见：修改 / 删除房间 -->
              <button
                v-if="isOwner"
                type="button"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-chat-panel border border-chat-border text-white hover:border-accent/50 hover:bg-accent/10 transition-colors"
                @click="openEditModal"
              >
                <Icon icon="mdi:pencil-outline" class="text-lg shrink-0" />
                <span>修改信息</span>
              </button>
              <button
                v-if="isOwner"
                type="button"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-colors"
                @click="onDeleteRoom"
              >
                <Icon icon="mdi:delete-outline" class="text-lg shrink-0" />
                <span>删除房间</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 房间聊天视图 -->
        <RoomChat
          v-else-if="activeTab === 'chat'"
          :room-id="roomId"
          class="h-full min-h-0"
        />
      </div>

      <!-- 底部 Tab 栏 -->
      <div class="border-t border-chat-border bg-sidebar flex">
        <button
          type="button"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors"
          :class="activeTab === 'info' ? 'text-accent bg-chat-panel/60' : 'text-accent-muted hover:text-accent'"
          @click="activeTab = 'info'"
        >
          <Icon icon="mdi:information-outline" class="text-lg" />
          <span>房间信息</span>
        </button>
        <button
          type="button"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors"
          :class="activeTab === 'chat' ? 'text-accent bg-chat-panel/60' : 'text-accent-muted hover:text-accent'"
          @click="activeTab = 'chat'"
        >
          <Icon icon="mdi:forum-outline" class="text-lg" />
          <span>房间聊天</span>
        </button>
        <button
          type="button"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors"
          :class="activeTab === 'log' ? 'text-accent bg-chat-panel/60' : 'text-accent-muted hover:text-accent'"
          @click="activeTab = 'log'"
        >
          <Icon icon="mdi:note-text-outline" class="text-lg" />
          <span>房间日志</span>
        </button>
      </div>
    </div>

    <!-- 房间用户 / 角色列表弹窗 -->
    <Teleport to="body">
      <Dialog :open="membersOpen" class="relative z-50" @close="membersOpen = false">
        <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div class="fixed inset-0 flex items-center justify-center p-4" @click.self="membersOpen = false">
          <DialogPanel class="mx-auto w-full max-w-md rounded-xl bg-sidebar border border-chat-border shadow-xl">
            <DialogTitle class="sr-only">房间用户与角色</DialogTitle>
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-white flex items-center gap-2">
                  <Icon icon="mdi:account-group-outline" class="text-xl text-accent" />
                  房间用户与角色
                </h2>
                <button
                  type="button"
                  class="p-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5"
                  @click="membersOpen = false"
                >
                  <Icon icon="mdi:close" class="text-xl" />
                </button>
              </div>

              <div v-if="!displayMembers.length" class="py-6 text-center text-sm text-accent-muted">
                暂无角色信息
              </div>
              <ul v-else class="space-y-2 max-h-64 overflow-y-auto scroll-thin">
                <li
                  v-for="m in displayMembers"
                  :key="`${m.kind}-${m.display}-${m.user}`"
                >
                  <button
                    v-if="m.kind !== 'kp' && m.characterId"
                    type="button"
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-chat-panel border border-chat-border hover:border-accent/60 hover:bg-accent/10 text-left"
                    @click="openCharacterCardModal(m.characterId, true)"
                  >
                    <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-green-500/20 text-green-400">
                      {{ m.label }}
                    </span>
                    <span class="flex-1 min-w-0 text-sm text-white truncate">
                      {{ m.display }}
                    </span>
                    <span class="text-xs text-accent-muted shrink-0">
                      {{ m.user }}
                    </span>
                    <Icon icon="mdi:chevron-right" class="text-base text-accent-muted" />
                  </button>
                  <div
                    v-else
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-chat-panel border border-chat-border"
                  >
                    <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/20 text-blue-400">
                      KP
                    </span>
                    <span class="flex-1 min-w-0 text-sm text-white truncate">
                      {{ m.user || '房主' }}
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Teleport>

    <!-- 角色卡审核弹窗：KP 可同意/拒绝，其他人仅查看 -->
    <Teleport to="body">
      <Dialog :open="characterReviewOpen" class="relative z-50" @close="characterReviewOpen = false">
        <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div class="fixed inset-0 flex items-center justify-center p-4" @click.self="characterReviewOpen = false">
          <DialogPanel class="mx-auto w-full max-w-md rounded-xl bg-sidebar border border-chat-border shadow-xl">
            <DialogTitle class="sr-only">角色卡审核</DialogTitle>
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-white flex items-center gap-2">
                  <Icon icon="mdi:clipboard-list-outline" class="text-xl text-accent" />
                  角色卡审核
                </h2>
                <button
                  type="button"
                  class="p-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5"
                  @click="characterReviewOpen = false"
                >
                  <Icon icon="mdi:close" class="text-xl" />
                </button>
              </div>

              <div v-if="characterReviewLoading" class="py-6 text-center text-sm text-accent-muted">
                加载角色卡审核列表中…
              </div>
              <div v-else-if="characterReviewError" class="py-6 text-center text-sm text-red-400">
                {{ characterReviewError }}
              </div>
              <div v-else-if="!roomCharacterApplications.length" class="py-6 text-center text-sm text-accent-muted">
                暂无角色卡审核记录。
              </div>
              <ul v-else class="space-y-2 max-h-72 overflow-y-auto scroll-thin">
                <li
                  v-for="item in roomCharacterApplications"
                  :key="item.id"
                  class="px-3 py-2 rounded-lg bg-chat-panel border border-chat-border flex items-center gap-3"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span
                        class="px-2 py-0.5 rounded text-[11px] font-medium"
                        :class="roomCharacterStatusClass(item.status)"
                      >
                        {{ roomCharacterStatusLabel(item.status) }}
                      </span>
                      <span class="text-sm text-white truncate">
                        角色卡 ID：{{ item.characterId }}
                      </span>
                    </div>
                    <div class="text-[11px] text-accent-muted mt-0.5">
                      提交时间：{{ formatDateTime(item.createdAt) }}
                    </div>
                  </div>
                  <button
                    type="button"
                    class="px-2 py-1 rounded-lg text-xs text-accent hover:bg-accent/20"
                    @click="openCharacterCardModal(item.characterId, true)"
                  >
                    查看
                  </button>
                  <div class="flex flex-col gap-1 ml-1">
                    <button
                      type="button"
                      class="px-2 py-0.5 rounded text-[11px] text-green-300 border border-green-500/40 hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      :disabled="!isOwner || item.status === 'accepted'"
                      @click="onApproveRoomCharacter(item)"
                    >
                      同意
                    </button>
                    <button
                      type="button"
                      class="px-2 py-0.5 rounded text-[11px] text-red-300 border border-red-500/40 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      :disabled="!isOwner || item.status === 'rejected'"
                      @click="onRejectRoomCharacter(item)"
                    >
                      拒绝
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Teleport>

    <!-- 模组信息弹窗（仅房主会打开） -->
    <Teleport to="body">
      <Dialog :open="moduleInfoOpen" class="relative z-50" @close="moduleInfoOpen = false">
        <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div class="fixed inset-0 flex items-center justify-center p-4" @click.self="moduleInfoOpen = false">
          <DialogPanel class="mx-auto w-full max-w-lg rounded-xl bg-sidebar border border-chat-border shadow-xl">
            <DialogTitle class="sr-only">模组信息</DialogTitle>
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-white flex items-center gap-2">
                  <Icon icon="mdi:file-document-multiple-outline" class="text-xl text-accent" />
                  模组信息
                </h2>
                <button
                  type="button"
                  class="p-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5"
                  @click="moduleInfoOpen = false"
                >
                  <Icon icon="mdi:close" class="text-xl" />
                </button>
              </div>
              <p class="text-sm text-accent-muted mb-4">管理模组文件（文档、图片等），仅房主可见。</p>

              <!-- 文件列表 -->
              <ul class="space-y-2 mb-4 max-h-48 overflow-y-auto scroll-thin">
                <li
                  v-for="f in (room?.moduleFiles || [])"
                  :key="f.id"
                  class="flex items-center gap-3 p-2 rounded-lg bg-chat-bg border border-chat-border"
                >
                  <Icon :icon="iconForFileType(f.type)" class="text-lg text-accent shrink-0" />
                  <a
                    :href="f.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-1 min-w-0 text-sm text-white truncate hover:text-accent"
                  >
                    {{ f.name || '未命名' }}
                  </a>
                  <button
                    type="button"
                    class="p-1.5 rounded text-accent-muted hover:text-red-400 hover:bg-red-500/10"
                    title="删除"
                    @click="removeModuleFile(f.id)"
                  >
                    <Icon icon="mdi:delete-outline" class="text-lg" />
                  </button>
                </li>
                <li v-if="!(room?.moduleFiles?.length)" class="py-4 text-center text-sm text-accent-muted">
                  暂无文件，可下方添加链接
                </li>
              </ul>

              <!-- 添加文件（链接） -->
              <form class="space-y-2" @submit.prevent="addModuleFile">
                <input
                  v-model="newFile.name"
                  type="text"
                  placeholder="名称（如：规则说明.docx）"
                  class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted text-sm outline-none focus:border-accent"
                />
                <input
                  v-model="newFile.url"
                  type="url"
                  placeholder="文件链接（http(s) 或上传后得到的地址）"
                  class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted text-sm outline-none focus:border-accent"
                />
                <div class="flex gap-2">
                  <select
                    v-model="newFile.type"
                    class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white text-sm outline-none focus:border-accent"
                  >
                    <option value="docx">Word 文档</option>
                    <option value="pdf">PDF</option>
                    <option value="image">图片</option>
                    <option value="other">其他</option>
                  </select>
                  <button
                    type="submit"
                    class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90"
                  >
                    添加
                  </button>
                </div>
                <p v-if="moduleFileMessage" class="text-sm" :class="moduleFileError ? 'text-red-400' : 'text-green-400'">
                  {{ moduleFileMessage }}
                </p>
              </form>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Teleport>
    <!-- 修改房间信息弹窗（仅房主） -->
    <Teleport to="body">
      <Dialog :open="editRoomOpen" class="relative z-50" @close="closeEditModal">
        <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div class="fixed inset-0 flex items-center justify-center p-4" @click.self="closeEditModal">
          <DialogPanel class="mx-auto w-full max-w-lg rounded-xl bg-sidebar border border-chat-border shadow-xl">
            <DialogTitle class="sr-only">修改房间</DialogTitle>
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-white flex items-center gap-2">
                  <Icon icon="mdi:pencil-outline" class="text-xl text-accent" />
                  修改房间信息
                </h2>
                <button
                  type="button"
                  class="p-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5"
                  @click="closeEditModal"
                >
                  <Icon icon="mdi:close" class="text-xl" />
                </button>
              </div>

              <div v-if="editRoomLoading" class="py-6 text-center text-sm text-accent-muted">
                加载中…
              </div>
              <div v-else>
                <GameRoomForm
                  v-model="editRoomForm"
                  :available-tags="availableTags"
                  :tag-groups="availableTagGroups"
                  :show-module="false"
                  :show-max-players="false"
                />

                <div class="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg text-accent-muted hover:text-white border border-chat-border"
                    @click="closeEditModal"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg bg-accent text-chat-bg hover:opacity-90 font-medium disabled:opacity-50"
                    :disabled="!canSubmitEdit || editRoomSaving"
                    @click="submitEditRoom"
                  >
                    {{ editRoomSaving ? '保存中…' : '保存' }}
                  </button>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Menu, MenuButton, MenuItems, MenuItem, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import RoomLogView from '../components/RoomLogView.vue'
import RoomChat from '../components/RoomChat.vue'
import { APP_TITLE } from '../constants/app'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useProfileCache } from '../stores/profileCache'
import { useCharactersStore } from '../stores/characters'
import { useAuthStore } from '../stores/auth'
import { useCharacterCardModal } from '../composables/useCharacterCardModal'
import GameRoomForm from '../components/GameRoomForm.vue'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.id)
const auth = useAuthStore()

const {
  fetchRoom,
  setRoomCharacter,
  getRoomCharacter,
  updateModuleFiles,
  deleteRoom,
  fetchMyApprovedCharacters,
  fetchRoomCharacterApplications,
  updateRoomCharacterStatus,
  updateRoom,
  availableTags,
  fetchTags,
} = useGameRoomsStore()
const { characters, fetchList, getById } = useCharactersStore()
const { openCharacterCard: openCharacterCardModal } = useCharacterCardModal()
const profileCache = useProfileCache()

const room = ref(null)
const loading = ref(true)
const activeTab = ref('info') // 'info' | 'chat' | 'log'
const moduleInfoOpen = ref(false)
const newFile = ref({ name: '', url: '', type: 'docx' })
const moduleFileMessage = ref('')
const moduleFileError = ref(false)

const membersOpen = ref(false)
const ownerName = ref('')

const isOwner = computed(() => {
  const u = auth.user?.value
  const r = room.value
  return u?.id && r?.ownerId && u.id === r.ownerId
})

// 编辑房间弹窗状态
const editRoomOpen = ref(false)
const editRoomLoading = ref(false)
const editRoomSaving = ref(false)
const editRoomForm = ref({
  name: '',
  description: '',
  module: '',
  icon: '',
  maxPlayers: 6,
  tags: [],
})

const canSubmitEdit = computed(() => {
  const v = editRoomForm.value || {}
  const nameOk = typeof v.name === 'string' && v.name.trim().length > 0
  return nameOk
})

const approvedCharacterIds = ref([])

const selectedCharacterId = computed(() => getRoomCharacter(roomId.value))

const currentCharacter = computed(() => {
  const id = selectedCharacterId.value
  return id ? getById(id) : null
})

const currentCharacterName = computed(() => {
  const c = currentCharacter.value
  return c?.name || ''
})

// 顶部“角色卡”按钮上的文案（区分房主 / 玩家、是否有卡、是否审核）
const characterMenuLabel = computed(() => {
  const name = currentCharacterName.value
  if (name) return name
  if (isOwner.value) return 'KP'
  if (!characters.value.length) return '暂无角色卡'
  if (!selectableCharacters.value.length) return '等待审核'
  return '角色卡'
})

const selectableCharacters = computed(() => {
  // 房主：可以自由选择任意角色卡作为 NPC
  if (isOwner.value) return characters.value
  // 其他玩家：只能选择被房主审核通过的角色卡
  if (!approvedCharacterIds.value.length) return []
  return characters.value.filter((c) => approvedCharacterIds.value.includes(c.id))
})

// 房间内角色卡审核列表
const characterReviewOpen = ref(false)
const roomCharacterApplications = ref([])
const characterReviewLoading = ref(false)
const characterReviewError = ref('')

async function loadRoomCharacterApplications() {
  if (!roomId.value) return
  characterReviewLoading.value = true
  characterReviewError.value = ''
  const res = await fetchRoomCharacterApplications(roomId.value)
  characterReviewLoading.value = false
  if (!res.ok) {
    characterReviewError.value = res.message || '加载角色卡审核列表失败'
    roomCharacterApplications.value = []
    return
  }
  roomCharacterApplications.value = res.list || []
}

function roomCharacterStatusLabel(status) {
  if (status === 'pending') return '审核中'
  if (status === 'accepted') return '已通过'
  if (status === 'rejected') return '被拒绝'
  return status || ''
}

function roomCharacterStatusClass(status) {
  if (status === 'pending') return 'bg-amber-500/20 text-amber-300'
  if (status === 'accepted') return 'bg-green-500/20 text-green-300'
  if (status === 'rejected') return 'bg-red-500/20 text-red-300'
  return 'bg-accent-muted/20 text-accent-muted'
}

async function onApproveRoomCharacter(item) {
  if (!isOwner.value) return
  const res = await updateRoomCharacterStatus(item.id, 'accepted')
  if (!res.ok) {
    alert(res.message || '操作失败')
    return
  }
  item.status = 'accepted'
}

async function onRejectRoomCharacter(item) {
  if (!isOwner.value) return
  const res = await updateRoomCharacterStatus(item.id, 'rejected')
  if (!res.ok) {
    alert(res.message || '操作失败')
    return
  }
  item.status = 'rejected'
}

function selectCharacter(characterId) {
  setRoomCharacter(roomId.value, characterId)
}

function showCharacterCard() {
  if (!selectedCharacterId.value) return
  openCharacterCardModal(selectedCharacterId.value, true)
}

function getStatusLabel(status) {
  const map = { recruiting: '招募中', full: '已满员', started: '进行中' }
  return map[status] || status
}

function getStatusColor(status) {
  const map = {
    recruiting: 'bg-green-500/20 text-green-400',
    full: 'bg-accent-muted/20 text-accent-muted',
    started: 'bg-blue-500/20 text-blue-400',
  }
  return map[status] || ''
}

function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const displayMembers = computed(() => {
  const list = []
  const r = room.value
  const me = auth.user?.value

  if (r) {
    list.push({
      kind: 'kp',
      label: 'KP',
      display: ownerName.value || '房主',
      user: ownerName.value || '房主',
      characterId: null,
    })
  }

  const c = currentCharacter.value
  if (c && me) {
    const userDisplay = me.username || me.email?.split?.('@')[0] || '我'
    list.push({
      kind: 'pc',
      label: c.name || '未命名',
      display: c.name || '未命名',
      user: userDisplay,
      characterId: c.id,
    })
  }

  return list
})

function goBack() {
  router.push({ name: 'game-rooms' })
}

function openEditModal() {
  if (!room.value || !isOwner.value) return
  editRoomOpen.value = true
  editRoomLoading.value = true
  editRoomForm.value = {
    name: room.value.title || '',
    description: room.value.description || '',
    module: room.value.module || '',
    icon: '',
    maxPlayers: room.value.maxPlayers ?? 6,
    tags: [...(room.value.tags || [])],
  }
  editRoomLoading.value = false
}

function closeEditModal() {
  if (editRoomSaving.value) return
  editRoomOpen.value = false
}

async function submitEditRoom() {
  if (!room.value || !isOwner.value) return
  const v = editRoomForm.value || {}
  const name = (v.name || '').trim()
  if (!name) return
  const payload = {
    title: name,
    description: (v.description || '').trim(),
    tags: Array.isArray(v.tags) ? [...v.tags] : [],
  }

  editRoomSaving.value = true
  const res = await updateRoom(roomId.value, payload)
  editRoomSaving.value = false
  if (res?.ok) {
    // 更新当前 room 展示
    if (res.data) {
      room.value = { ...room.value, ...res.data }
    } else {
      await load()
    }
    editRoomOpen.value = false
  } else {
    alert(res?.message || '保存失败')
  }
}

async function onDeleteRoom() {
  if (!room.value || !window.confirm(`确定要删除房间「${room.value.title}」吗？此操作不可恢复。`)) return
  const res = await deleteRoom(roomId.value)
  if (res?.ok) router.push({ name: 'game-rooms' })
  else alert(res?.message || '删除失败')
}

function iconForFileType(type) {
  const map = { docx: 'mdi:file-document-outline', pdf: 'mdi:file-pdf-box', image: 'mdi:image-outline', other: 'mdi:file-outline' }
  return map[type] || 'mdi:file-outline'
}

async function addModuleFile() {
  const name = newFile.value.name?.trim()
  const url = newFile.value.url?.trim()
  if (!name || !url) {
    moduleFileMessage.value = '请填写名称和链接'
    moduleFileError.value = true
    return
  }
  const list = [...(room.value?.moduleFiles || [])]
  const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  list.push({ id, name, url, type: newFile.value.type })
  const res = await updateModuleFiles(roomId.value, list)
  moduleFileError.value = !res.ok
  moduleFileMessage.value = res.ok ? '已添加' : (res.message || '添加失败')
  if (res.ok) {
    room.value.moduleFiles = list
    newFile.value = { name: '', url: '', type: 'docx' }
    setTimeout(() => { moduleFileMessage.value = '' }, 2000)
  }
}

async function removeModuleFile(fileId) {
  const list = (room.value?.moduleFiles || []).filter((f) => f.id !== fileId)
  const res = await updateModuleFiles(roomId.value, list)
  if (res.ok) room.value.moduleFiles = list
  else {
    moduleFileMessage.value = res.message || '删除失败'
    moduleFileError.value = true
  }
}

async function load() {
  if (!roomId.value) return
  loading.value = true
  room.value = await fetchRoom(roomId.value)
  loading.value = false
  if (room.value) {
    document.title = `${room.value.title} - 跑团 - ${APP_TITLE}`
    if (room.value.ownerId) {
      const profile = await profileCache.getProfile(room.value.ownerId)
      ownerName.value = profile?.username ?? ''
    }
  }
}

onMounted(async () => {
  fetchList()
  await load()
  // 非房主加载自己在本房间已被审核通过的角色卡
  if (!isOwner.value && roomId.value) {
    approvedCharacterIds.value = await fetchMyApprovedCharacters(roomId.value)
  }
})

watch(roomId, async () => {
  await load()
  if (!isOwner.value && roomId.value) {
    approvedCharacterIds.value = await fetchMyApprovedCharacters(roomId.value)
  } else {
    approvedCharacterIds.value = []
  }
})
</script>
