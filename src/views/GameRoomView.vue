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
            class="flex items-center gap-1 px-3 py-2 rounded-lg bg-base-100-active text-sm text-base-content hover:text-base-content hover:bg-base-200 transition-colors"
            @click="router.push('/characters')"
          >
            <Icon icon="mdi:card-account-details-outline" class="text-lg shrink-0" />
            <span>暂无角色卡，去创建</span>
          </button>

          <!-- 切换角色卡（房主 + 有角色卡的玩家） -->
          <Menu v-else-if="room" as="div" class="relative">
            <MenuButton
              type="button"
              class="flex items-center gap-1 p-2 rounded-lg bg-base-100-active text-base-content hover:bg-base-200 transition-colors text-sm"
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
                class="absolute right-0 top-full mt-2 w-56 rounded-lg bg-base-100 border border-base-300 shadow-xl py-1 z-50 focus:outline-none max-h-64 overflow-y-auto"
              >
                <MenuItem v-slot="{ active }">
                  <button
                    type="button"
                    :class="[
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      active ? 'bg-base-200 text-base-content' : 'text-base-content/60',
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
                      active ? 'bg-base-200 text-base-content' : 'text-base-content/60',
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
                  role="alert"
                  class="alert alert-info border-t border-base-300/40 rounded-none gap-2 py-2 text-xs"
                >
                  <Icon icon="mdi:information-outline" class="text-lg shrink-0" />
                  <span class="text-base-content/90">
                    你已有角色卡，请在角色卡详情中交给 KP 审核。
                    审核通过后，可以在此处选择角色卡使用（审核通过后该角色卡将锁定，不能再修改）。
                  </span>
                </div>

                <!-- 去角色卡列表页 -->
                <div class="border-t border-base-300/50 mt-1 pt-1">
                  <MenuItem v-slot="{ active }">
                    <button
                      type="button"
                      :class="[
                        'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                        active ? 'bg-base-200 text-base-content' : 'text-base-content hover:text-base-content',
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
            class="p-2 rounded-lg bg-base-100-active text-base-content hover:bg-base-200 transition-colors"
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
    <div v-else-if="!room" class="flex-1 flex items-center justify-center text-base-content">
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
          :is-owner="isOwner"
          class="h-full"
        />

        <!-- 房间信息视图 -->
        <div
          v-else-if="activeTab === 'info'"
          class="h-full overflow-y-auto scroll-thin p-4"
        >
          <div class="max-w-2xl mx-auto space-y-4">
            <div class="rounded-xl bg-base-100 border border-base-200 p-4">
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="getStatusColor(room.status)"
                >
                  {{ getStatusLabel(room.status) }}
                </span>
                <span class="text-sm text-base-content">{{ room.module }}</span>
              </div>
              <p v-if="room.description" class="text-sm text-base-content/60 whitespace-pre-wrap">
                {{ room.description }}
              </p>
              <div v-if="room.tags?.length" class="flex flex-wrap gap-1.5 mt-2">
                <span
                  v-for="tag in room.tags"
                  :key="tag"
                  class="px-2 py-0.5 rounded text-xs bg-base-100-active text-base-content"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- 当前使用的角色卡 -->
            <div v-if="selectedCharacterId" class="rounded-xl bg-base-100 border border-base-200 p-4">
              <h3 class="text-sm font-medium text-base-content uppercase tracking-wider mb-2">
                当前角色
              </h3>
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg bg-base-100-active flex items-center justify-center shrink-0">
                  <Icon icon="mdi:card-account-details" class="text-xl text-accent" />
                </div>
                <div>
                  <p class="font-medium text-base-content">
                    {{ currentCharacter?.name || '未命名' }}
                  </p>
                  <p class="text-xs text-base-content">
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
            <div class="space-y-3">
              <!-- 主操作：查看线索（强调） -->
              <button
                type="button"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary text-primary-content font-medium shadow-sm shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all"
                @click="router.push({ name: 'clues', params: { roomId: roomId } })"
              >
                <Icon icon="mdi:lightbulb-on-outline" class="text-xl shrink-0" />
                <span>查看线索</span>
              </button>

              <!-- 角色卡审核 -->
              <button
                type="button"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-primary/40 bg-primary/5 text-primary font-medium hover:bg-primary/15 hover:border-primary/60 transition-colors active:scale-[0.98]"
                @click="characterReviewOpen = true; loadRoomCharacterApplications()"
              >
                <Icon icon="mdi:clipboard-list-outline" class="text-lg shrink-0" />
                <span>角色审核</span>
              </button>

              <!-- 仅房主：管理操作区 -->
              <template v-if="isOwner">
                <div class="flex flex-wrap gap-2 pt-1 border-t border-base-200">
                  <button
                    type="button"
                    class="flex items-center gap-2 px-3 py-2 rounded-xl bg-base-200 text-base-content/80 text-sm hover:bg-base-300 hover:text-base-content transition-colors active:scale-[0.98]"
                    @click="openModuleInfo"
                  >
                    <Icon icon="mdi:file-document-multiple-outline" class="text-base shrink-0" />
                    <span>模组信息</span>
                  </button>
                  <button
                    type="button"
                    class="flex items-center gap-2 px-3 py-2 rounded-xl bg-base-200 text-base-content/80 text-sm hover:bg-base-300 hover:text-base-content transition-colors active:scale-[0.98]"
                    @click="openEditModal"
                  >
                    <Icon icon="mdi:pencil-outline" class="text-base shrink-0" />
                    <span>修改信息</span>
                  </button>
                  <button
                    type="button"
                    class="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-red-400/50 text-red-500 text-sm hover:bg-red-500/10 hover:border-red-400 transition-colors active:scale-[0.98]"
                    @click="onDeleteRoom"
                  >
                    <Icon icon="mdi:delete-outline" class="text-base shrink-0" />
                    <span>删除房间</span>
                  </button>
                </div>
              </template>
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
      <div class="border-t border-base-300 bg-base-100 flex">
        <button
          type="button"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors"
          :class="activeTab === 'info' ? 'text-primary bg-base-200/60' : 'text-base-content hover:text-primary'"
          @click="activeTab = 'info'"
        >
          <Icon icon="mdi:information-outline" class="text-lg" />
          <span>房间信息</span>
        </button>
        <button
          type="button"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors"
          :class="activeTab === 'chat' ? 'text-primary bg-base-200/60' : 'text-base-content hover:text-primary'"
          @click="activeTab = 'chat'"
        >
          <Icon icon="mdi:forum-outline" class="text-lg" />
          <span>房间聊天</span>
        </button>
        <button
          type="button"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors"
          :class="activeTab === 'log' ? 'text-primary bg-base-200/60' : 'text-base-content hover:text-primary'"
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
          <DialogPanel class="mx-auto w-full max-w-md rounded-xl bg-base-100 border border-base-300 shadow-xl">
            <DialogTitle class="sr-only">房间用户与角色</DialogTitle>
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-base-content flex items-center gap-2">
                  <Icon icon="mdi:account-group-outline" class="text-xl text-accent" />
                  房间用户与角色
                </h2>
                <button
                  type="button"
                  class="p-2 rounded-lg text-base-content hover:text-base-content hover:bg-base-content/10"
                  @click="membersOpen = false"
                >
                  <Icon icon="mdi:close" class="text-xl" />
                </button>
              </div>

              <div v-if="!displayMembers.length" class="py-6 text-center text-sm text-base-content">
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
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-base-200 border border-base-300 hover:border-accent/60 hover:bg-accent/10 text-left"
                    @click="openCharacterCardModal(m.characterId, true)"
                  >
                    <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-green-500/20 text-green-400">
                      {{ m.label }}
                    </span>
                    <span class="flex-1 min-w-0 text-sm text-base-content truncate">
                      {{ m.display }}
                    </span>
                    <span class="text-xs text-base-content shrink-0">
                      {{ m.user }}
                    </span>
                    <Icon icon="mdi:chevron-right" class="text-base text-base-content" />
                  </button>
                  <div
                    v-else
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-base-200 border border-base-300"
                  >
                    <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/20 text-blue-400">
                      KP
                    </span>
                    <span class="flex-1 min-w-0 text-sm text-base-content truncate">
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
          <DialogPanel class="mx-auto w-full max-w-md rounded-xl bg-base-100 border border-base-300 shadow-xl">
            <DialogTitle class="sr-only">角色卡审核</DialogTitle>
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-base-content flex items-center gap-2">
                  <Icon icon="mdi:clipboard-list-outline" class="text-xl text-accent" />
                  角色审核
                </h2>
                <button
                  type="button"
                  class="p-2 rounded-lg text-base-content hover:text-base-content hover:bg-base-content/10"
                  @click="characterReviewOpen = false"
                >
                  <Icon icon="mdi:close" class="text-xl" />
                </button>
              </div>

              <div v-if="characterReviewLoading" class="py-6 text-center text-sm text-base-content">
                加载角色卡审核列表中…
              </div>
              <div v-else-if="characterReviewError" class="py-6 text-center text-sm text-red-400">
                {{ characterReviewError }}
              </div>
              <div v-else-if="!roomCharacterApplications.length" class="py-6 text-center text-sm text-base-content">
                暂无角色卡审核记录。
              </div>
              <ul v-else class="space-y-2 max-h-72 overflow-y-auto scroll-thin">
                <li
                  v-for="item in roomCharacterApplications"
                  :key="item.id"
                  class="px-3 py-2 rounded-lg bg-base-200 border border-base-300 flex flex-col items-start gap-3"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span
                        class="px-2 py-0.5 rounded text-[11px] font-medium"
                        :class="roomCharacterStatusClass(item.status)"
                      >
                        {{ roomCharacterStatusLabel(item.status) }}
                      </span>
                      <span class="text-sm text-base-content truncate">
                        {{ getCharacterName(item.characterId) }}
                      </span>
                    </div>
                    <div class="text-[11px] text-base-content mt-0.5">
                      提交时间：{{ formatDateTime(item.createdAt) }}
                    </div>
                  </div>
                  <div class="flex gap-2 ml-1">
                  <button
                    type="button"
                    class="px-2 py-1 rounded-lg text-xs text-accent hover:bg-accent/20"
                    @click="openCharacterCardModal(item.characterId, true)"
                  >
                    查看
                  </button>
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

    <!-- 模组信息弹窗（仅房主会打开）：左侧词条，右侧正文；移动端为列表/正文切换 -->
    <Teleport to="body">
      <Dialog :open="moduleInfoOpen" class="relative z-50" @close="closeModuleInfo">
        <div class="fixed inset-0 bg-black/60 max-md:bg-black/80" aria-hidden="true" />
        <div class="fixed inset-0 flex items-center justify-center p-4 max-md:p-0 max-md:items-stretch" @click.self="closeModuleInfo">
          <DialogPanel
            class="mx-auto w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-base-100 border border-base-300 shadow-xl max-md:max-w-none max-md:max-h-none max-md:rounded-none max-md:m-0 max-md:border-0"
          >
            <DialogTitle class="sr-only">模组信息</DialogTitle>
            <!-- 顶部栏：标题 + 关闭；移动端正文视图时显示返回 -->
            <div class="flex items-center justify-between shrink-0 p-4 border-b border-base-300 max-md:py-3">
              <div class="flex items-center gap-2 min-w-0">
                <button
                  v-if="isMobile && moduleInfoMobileView === 'content'"
                  type="button"
                  class="p-2 -ml-2 rounded-lg text-base-content hover:text-base-content hover:bg-base-content/10 shrink-0"
                  aria-label="返回词条列表"
                  @click="moduleInfoMobileView = 'list'"
                >
                  <Icon icon="mdi:arrow-left" class="text-xl" />
                </button>
                <h2 class="text-lg font-semibold text-base-content flex items-center gap-2 truncate">
                  <Icon icon="mdi:file-document-multiple-outline" class="text-xl text-accent shrink-0" />
                  <span class="truncate">{{ isMobile && moduleInfoMobileView === 'content' && selectedEntry ? (selectedEntry.title || '正文') : '模组信息' }}</span>
                </h2>
              </div>
              <button
                type="button"
                class="p-2 rounded-lg text-base-content hover:text-base-content hover:bg-base-content/10 shrink-0"
                @click="closeModuleInfo"
              >
                <Icon icon="mdi:close" class="text-xl" />
              </button>
            </div>
            <p class="shrink-0 px-4 pb-2 text-sm text-base-content max-md:hidden">供 KP 查阅：左侧选择词条，右侧查看/编辑正文。</p>
            <div class="flex-1 min-h-0 flex overflow-hidden flex-col md:flex-row">
              <!-- 左侧：词条列表（移动端在「列表」视图时全宽显示，正文视图时隐藏） -->
              <div
                class="w-full md:w-56 shrink-0 border-r border-base-300 flex flex-col bg-base-200/50 max-md:border-r-0 max-md:min-h-0"
                :class="{ 'max-md:hidden': isMobile && moduleInfoMobileView === 'content' }"
              >
                <div class="p-2 border-b border-base-300 space-y-1 flex-shrink-0">
                  <button
                    type="button"
                    class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-accent hover:bg-accent/20"
                    @click="addModuleEntry"
                  >
                    <Icon icon="mdi:plus" class="text-lg" />
                    添加词条
                  </button>
                  <button
                    type="button"
                    class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-base-content hover:bg-base-content/10 hover:text-base-content"
                    @click="moduleImportOpen = true"
                  >
                    <Icon icon="mdi:file-import-outline" class="text-lg" />
                    导入
                  </button>
                </div>
                <ul class="flex-1 overflow-y-auto scroll-thin p-2 space-y-1 min-h-0">
                  <li
                    v-for="entry in moduleEntriesEdit"
                    :key="entry.id"
                    class="flex items-center gap-1 group"
                  >
                    <button
                      type="button"
                      :class="[
                        'flex-1 min-w-0 text-left px-3 py-2.5 md:py-2 rounded-lg text-sm truncate transition-colors touch-manipulation',
                        selectedEntryId === entry.id
                          ? 'bg-accent/30 text-accent'
                          : 'text-base-content/60 hover:bg-base-content/10 hover:text-base-content active:bg-white/10',
                      ]"
                      @click="selectModuleEntry(entry.id)"
                    >
                      {{ entry.title || '未命名' }}
                    </button>
                    <button
                      type="button"
                      class="p-1.5 rounded text-base-content md:opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 touch-manipulation"
                      title="删除词条"
                      @click.stop="removeModuleEntry(entry.id)"
                    >
                      <Icon icon="mdi:delete-outline" class="text-base" />
                    </button>
                  </li>
                  <li v-if="!moduleEntriesEdit.length" class="py-6 text-center text-sm text-base-content">
                    暂无词条，点击上方「添加词条」
                  </li>
                </ul>
              </div>
              <!-- 右侧：当前词条标题 + 正文（移动端在「正文」视图时全宽显示） -->
              <div
                class="flex-1 min-w-0 flex flex-col overflow-hidden min-h-0"
                :class="{ 'max-md:hidden': isMobile && moduleInfoMobileView === 'list' }"
              >
                <template v-if="selectedEntry">
                  <div class="shrink-0 p-3 border-b border-base-300">
                    <input
                      v-model="selectedEntry.title"
                      type="text"
                      placeholder="词条标题（如：【背景信息】）"
                      class="w-full px-3 py-2 rounded-lg bg-base-100 border border-base-300 text-base-content placeholder-accent-muted text-sm outline-none focus:border-accent"
                      @blur="saveModuleEntries"
                    />
                  </div>
                  <div class="flex-1 min-h-0 p-3 overflow-hidden">
                    <textarea
                      v-model="selectedEntry.content"
                      placeholder="在此填写正文内容…"
                      class="w-full h-full min-h-[200px] md:min-h-[180px] px-3 py-2 rounded-lg bg-base-100 border border-base-300 text-base-content placeholder-accent-muted text-sm outline-none focus:border-accent resize-none whitespace-pre-wrap"
                      @blur="saveModuleEntries"
                    />
                  </div>
                </template>
                <div v-else class="flex-1 flex items-center justify-center text-sm text-base-content px-4">
                  <span class="max-md:hidden">请从左侧选择或添加词条</span>
                  <span class="md:hidden">点击上方词条查看正文</span>
                </div>
              </div>
            </div>

            <!-- 导入浮层：粘贴全文，按【标题】自动拆成词条 -->
            <div
              v-if="moduleImportOpen"
              class="absolute inset-0 z-10 flex flex-col rounded-xl bg-base-100 border border-base-300"
            >
              <div class="flex items-center justify-between shrink-0 p-3 border-b border-base-300">
                <span class="text-sm font-medium text-base-content">导入：粘贴全文，将按【词条标题】自动拆分</span>
                <button
                  type="button"
                  class="p-2 rounded-lg text-base-content hover:text-base-content hover:bg-base-content/10"
                  @click="moduleImportOpen = false"
                >
                  <Icon icon="mdi:close" class="text-lg" />
                </button>
              </div>
              <div class="flex-1 min-h-0 flex flex-col p-3 gap-3">
                <textarea
                  v-model="moduleImportText"
                  placeholder="将整份模组内容粘贴到此处。以【标题】开头的行会识别为新词条，例如：&#10;【背景信息】&#10;这里是背景正文……&#10;【PC 信息】&#10;这里是 PC 信息……"
                  class="flex-1 min-h-[120px] w-full px-3 py-2 rounded-lg bg-base-100 border border-base-300 text-base-content placeholder-accent-muted text-sm outline-none focus:border-accent resize-none whitespace-pre-wrap"
                />
                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg text-base-content hover:text-base-content border border-base-300"
                    @click="moduleImportOpen = false"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg bg-accent text-base-100 font-medium hover:opacity-90"
                    @click="applyModuleImport"
                  >
                    解析并导入
                  </button>
                </div>
              </div>
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
          <DialogPanel class="mx-auto w-full max-w-lg rounded-xl bg-base-100 border border-base-300 shadow-xl">
            <DialogTitle class="sr-only">修改房间</DialogTitle>
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-base-content flex items-center gap-2">
                  <Icon icon="mdi:pencil-outline" class="text-xl text-accent" />
                  修改房间信息
                </h2>
                <button
                  type="button"
                  class="p-2 rounded-lg text-base-content hover:text-base-content hover:bg-base-content/10"
                  @click="closeEditModal"
                >
                  <Icon icon="mdi:close" class="text-xl" />
                </button>
              </div>

              <div v-if="editRoomLoading" class="py-6 text-center text-sm text-base-content">
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
                    class="px-4 py-2 rounded-lg text-base-content hover:text-base-content border border-base-300"
                    @click="closeEditModal"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg bg-accent text-base-100 hover:opacity-90 font-medium disabled:opacity-50"
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

  <!-- Toast 提示 -->
  <Toast ref="toastRef" />
  
  <!-- 确认对话框 -->
  <ConfirmDialog
    v-model:visible="confirmDialogVisible"
    :title="confirmDialogTitle"
    :message="confirmDialogMessage"
    @confirm="confirmDialogResolve"
    @cancel="confirmDialogReject"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Menu, MenuButton, MenuItems, MenuItem, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import RoomLogView from '../components/RoomLogView.vue'
import RoomChat from '../components/RoomChat.vue'
import Toast from '../components/Toast.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
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
  updateModuleEntries,
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
const moduleEntriesEdit = ref([])
const selectedEntryId = ref(null)
const moduleImportOpen = ref(false)
const moduleImportText = ref('')
const isMobile = ref(false)
const moduleInfoMobileView = ref('list') // 'list' | 'content'，仅移动端使用

const membersOpen = ref(false)
const ownerName = ref('')

// Toast 和确认对话框
const toastRef = ref(null)
const confirmDialogVisible = ref(false)
const confirmDialogTitle = ref('确认')
const confirmDialogMessage = ref('')
let confirmDialogResolve = null
let confirmDialogReject = null

function showToast(message, duration = 3000) {
  if (toastRef.value) {
    toastRef.value.show(message, duration)
  }
}

function showConfirm(title, message) {
  return new Promise((resolve) => {
    confirmDialogTitle.value = title
    confirmDialogMessage.value = message
    confirmDialogVisible.value = true
    confirmDialogResolve = () => {
      resolve(true)
      confirmDialogVisible.value = false
    }
    confirmDialogReject = () => {
      resolve(false)
      confirmDialogVisible.value = false
    }
  })
}

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

const selectedEntry = computed(() => {
  const id = selectedEntryId.value
  if (!id) return null
  return moduleEntriesEdit.value.find((e) => e.id === id) || null
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

function getCharacterName(characterId) {
  if (!characterId) return ''
  const character = getById(characterId)
  return character?.name || ''
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
  return 'bg-accent-muted/20 text-base-content'
}

async function onApproveRoomCharacter(item) {
  if (!isOwner.value) return
  const res = await updateRoomCharacterStatus(item.id, 'accepted')
  if (!res.ok) {
    showToast(res.message || '操作失败')
    return
  }
  item.status = 'accepted'
}

async function onRejectRoomCharacter(item) {
  if (!isOwner.value) return
  const res = await updateRoomCharacterStatus(item.id, 'rejected')
  if (!res.ok) {
    showToast(res.message || '操作失败')
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
    full: 'bg-accent-muted/20 text-base-content',
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

function openModuleInfo() {
  if (!room.value || !isOwner.value) return
  moduleEntriesEdit.value = (room.value.moduleEntries || []).map((e) => ({
    id: e.id || crypto.randomUUID?.() || `e-${Date.now()}`,
    title: e.title ?? '',
    content: e.content ?? '',
  }))
  selectedEntryId.value = moduleEntriesEdit.value[0]?.id ?? null
  moduleInfoMobileView.value = 'list'
  moduleInfoOpen.value = true
}

function closeModuleInfo() {
  moduleInfoOpen.value = false
  moduleImportOpen.value = false
  moduleImportText.value = ''
  moduleInfoMobileView.value = 'list'
  selectedEntryId.value = null
}

function selectModuleEntry(entryId) {
  selectedEntryId.value = entryId
  if (isMobile.value) moduleInfoMobileView.value = 'content'
}

/** 按【标题】拆分全文为词条列表 */
function parseModuleImportText(text) {
  const raw = (text || '').trim()
  if (!raw) return []
  const regex = /【[^】]*】/g
  const matches = [...raw.matchAll(regex)]
  if (matches.length === 0) {
    return [{ id: crypto.randomUUID?.() || `e-${Date.now()}`, title: '导入内容', content: raw }]
  }
  const entries = []
  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][0]
    const contentStart = matches[i].index + matches[i][0].length
    const contentEnd = i + 1 < matches.length ? matches[i + 1].index : raw.length
    let content = raw.slice(contentStart, contentEnd)
    content = content.replace(/^\s*\n+/, '').trim()
    entries.push({
      id: crypto.randomUUID?.() || `e-${Date.now()}-${i}`,
      title,
      content,
    })
  }
  return entries
}

function applyModuleImport() {
  const entries = parseModuleImportText(moduleImportText.value)
  if (!entries.length) {
    showToast('未解析到词条，请粘贴包含【标题】的文本')
    return
  }
  moduleEntriesEdit.value = [...moduleEntriesEdit.value, ...entries]
  selectedEntryId.value = entries[0].id
  if (isMobile.value) moduleInfoMobileView.value = 'content'
  moduleImportOpen.value = false
  moduleImportText.value = ''
  saveModuleEntries()
  showToast(`已追加 ${entries.length} 个词条`)
}

function addModuleEntry() {
  const id = crypto.randomUUID?.() || `e-${Date.now()}-${Math.random().toString(36).slice(2)}`
  moduleEntriesEdit.value.push({ id, title: '新词条', content: '' })
  selectedEntryId.value = id
  if (isMobile.value) moduleInfoMobileView.value = 'content'
  saveModuleEntries()
}

function removeModuleEntry(entryId) {
  const idx = moduleEntriesEdit.value.findIndex((e) => e.id === entryId)
  if (idx === -1) return
  moduleEntriesEdit.value.splice(idx, 1)
  if (selectedEntryId.value === entryId) {
    selectedEntryId.value = moduleEntriesEdit.value[idx]?.id ?? moduleEntriesEdit.value[0]?.id ?? null
  }
  saveModuleEntries()
}

async function saveModuleEntries() {
  if (!roomId.value || !isOwner.value) return
  const list = moduleEntriesEdit.value.map((e) => ({ id: e.id, title: e.title || '', content: e.content || '' }))
  const res = await updateModuleEntries(roomId.value, list)
  if (res?.ok && room.value) room.value.moduleEntries = list
  else if (!res?.ok) showToast(res?.message || '保存失败')
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
    showToast(res?.message || '保存失败')
  }
}

async function onDeleteRoom() {
  if (!room.value) return
  const confirmed = await showConfirm('确认删除', `确定要删除房间「${room.value.title}」吗？此操作不可恢复。`)
  if (!confirmed) return
  const res = await deleteRoom(roomId.value)
  if (res?.ok) router.push({ name: 'game-rooms' })
  else showToast(res?.message || '删除失败')
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

function updateIsMobile() {
  isMobile.value = typeof window !== 'undefined' && window.innerWidth < 768
}

onMounted(async () => {
  updateIsMobile()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateIsMobile)
  }
  fetchList()
  await load()
  // 非房主加载自己在本房间已被审核通过的角色卡
  if (!isOwner.value && roomId.value) {
    approvedCharacterIds.value = await fetchMyApprovedCharacters(roomId.value)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateIsMobile)
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
