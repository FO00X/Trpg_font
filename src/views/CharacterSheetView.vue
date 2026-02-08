<template>
  <div class="flex flex-col h-full">
    <header class="h-14 shrink-0 flex items-center gap-2 px-4 border-b border-chat-border bg-chat-panel">
      <button type="button" class="p-2 -ml-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5" :title="sidebarOpen ? '收起侧边栏' : '展开侧边栏'" @click="toggleSidebar">
        <Icon :icon="sidebarOpen ? 'mdi:backburger' : 'mdi:menu'" class="text-xl" />
      </button>
      <button type="button" class="p-1 rounded text-accent-muted hover:text-white" title="返回列表" @click="goBack">
        <Icon icon="mdi:arrow-left" class="text-xl" />
      </button>
      <Icon icon="mdi:card-account-details" class="text-xl text-accent" />
      <h1 class="font-semibold text-white">{{ isNew ? '创建角色' : (form.name || '未命名') }}</h1>
      <button type="button" class="ml-auto px-4 py-2 rounded-lg bg-accent text-chat-bg font-medium hover:opacity-90" @click="save">保存</button>
    </header>

    <div class="flex-1 overflow-y-auto scroll-thin p-4 pb-8">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- 一、基础信息 -->
        <section :class="sectionCls">
          <h2 :class="sectionTitleCls">基础信息（Basic Information）</h2>
          <div class="grid grid-cols-2 gap-2">
            <div><label :class="labelCls">姓名</label><input v-model="form.name" type="text" :class="inputCls" placeholder="姓名" /></div>
            <ComboboxSelect v-model="form.occupation" label="职业" :options="occupationOptions" placeholder="输入或选择职业" />
            <div><label :class="labelCls">年龄</label><input v-model.number="form.age" type="number" min="15" max="99" :class="inputCls" /></div>
            <ListboxSelect v-model="form.gender" label="性别" :options="genderOptions" placeholder="选择性别" />
            <div><label :class="labelCls">现居地</label><input v-model="form.currentResidence" type="text" :class="inputCls" placeholder="现居地" /></div>
            <div><label :class="labelCls">出生地</label><input v-model="form.birthplace" type="text" :class="inputCls" placeholder="出生地" /></div>
          </div>
        </section>

        <!-- 二、核心属性 -->
        <section :class="sectionCls">
          <div class="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 :class="sectionTitleCls">核心属性（Characteristics）</h2>
            </div>
            <button
              type="button"
              class="p-2.5 rounded-xl bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 shrink-0"
              title="一键随机全部属性"
              @click="rollAllChars"
            >
              <Icon icon="mdi:dice-multiple" class="text-2xl" />
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <template v-for="item in [{k:'str',l:'力量STR'},{k:'dex',l:'敏捷DEX'},{k:'siz',l:'体型SIZ'},{k:'app',l:'外貌APP'},{k:'con',l:'体质CON'},{k:'int',l:'智力INT'},{k:'pow',l:'意志POW'},{k:'edu',l:'教育EDU'},{k:'luc',l:'幸运LUC'}]" :key="item.k">
              <div><label class="block text-xs text-accent-muted truncate mb-1">{{ item.l }}</label><input v-model.number="form[item.k]" type="number" min="0" max="99" class="w-full px-2 py-1.5 rounded bg-chat-bg border border-chat-border text-white text-sm focus:border-accent outline-none" /></div>
            </template>
          </div>
        </section>

        <!-- 三、核心数值面板 -->
        <section :class="sectionCls">
          <h2 :class="sectionTitleCls">三、核心数值面板</h2>
          <p class="text-xs text-accent-muted mb-2">最大/初始由属性自动计算。可点击下方按钮将当前值设为最大/初始。</p>
          <button type="button" class="mb-3 px-3 py-1.5 rounded-lg bg-chat-bg border border-chat-border text-accent-muted hover:text-accent text-sm" @click="form.hpCurrent = syncDerived.hpMax; form.mpCurrent = syncDerived.mpMax; form.sanCurrent = syncDerived.sanInitial">应用衍生到当前值</button>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label :class="labelCls">生命（HP）现有</label><input v-model.number="form.hpCurrent" type="number" :class="inputCls" /></div>
            <div><label :class="labelCls">生命（HP）最大</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ syncDerived.hpMax }}</div></div>
            <div class="sm:col-span-1" />
            <div><label :class="labelCls">魔法（MP）现有</label><input v-model.number="form.mpCurrent" type="number" :class="inputCls" /></div>
            <div><label :class="labelCls">魔法（MP）最大</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ syncDerived.mpMax }}</div></div>
            <div class="sm:col-span-1" />
            <div><label :class="labelCls">理智（SAN）现有</label><input v-model.number="form.sanCurrent" type="number" :class="inputCls" /></div>
            <div><label :class="labelCls">理智（SAN）初始</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ syncDerived.sanInitial }}</div></div>
            <div><label :class="labelCls">理智（SAN）最大</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">99</div></div>
          </div>
        </section>

        <!-- 四、人物状态 -->
        <section :class="sectionCls">
          <h2 :class="sectionTitleCls">四、人物状态（Character Status）</h2>
          <div class="flex flex-wrap gap-4">
            <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.seriousWound" type="checkbox" class="rounded border-chat-border bg-chat-bg text-accent" />重伤</label>
            <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.unconscious" type="checkbox" class="rounded border-chat-border bg-chat-bg text-accent" />昏迷</label>
            <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.dead" type="checkbox" class="rounded border-chat-border bg-chat-bg text-accent" />死亡</label>
            <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.temporaryInsanity" type="checkbox" class="rounded border-chat-border bg-chat-bg text-accent" />临时疯狂</label>
            <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.permanentInsanity" type="checkbox" class="rounded border-chat-border bg-chat-bg text-accent" />永久疯狂</label>
            <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.indefiniteInsanity" type="checkbox" class="rounded border-chat-border bg-chat-bg text-accent" />不定期疯狂</label>
          </div>
        </section>

        <!-- 五、技能 -->
        <section :class="sectionCls">
          <h2 :class="sectionTitleCls">五、技能（Skill）</h2>
          <div class="rounded-lg bg-accent/10 border border-accent/20 p-3 text-sm text-accent-muted mb-3">
            本职技能成功率上限 75%、其它 50%。除信用评级外，其它技能上限为所选技能上限。兴趣点不可减少已被技能点增加的数值；建议结合剧本加一些战斗或逃跑技能。
          </div>
          <p class="text-xs text-accent-muted mb-2">职业点数与兴趣点数：填写已用值与剩余值。</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div><label :class="labelCls">职业点数已用</label><input v-model.number="form.skillRule.careerPointsUsed" type="number" min="0" :class="inputCls" /></div>
            <div><label :class="labelCls">职业点数剩余</label><input v-model.number="form.skillRule.careerPointsRemain" type="number" min="0" :class="inputCls" /></div>
            <div><label :class="labelCls">兴趣点数已用</label><input v-model.number="form.skillRule.interestPointsUsed" type="number" min="0" :class="inputCls" /></div>
            <div><label :class="labelCls">兴趣点数剩余</label><input v-model.number="form.skillRule.interestPointsRemain" type="number" min="0" :class="inputCls" /></div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead><tr class="text-left text-accent-muted border-b border-chat-border"><th class="py-2 pr-2">技能</th><th class="py-2 px-1 w-14">基础%</th><th class="py-2 px-1 w-14">职业%</th><th class="py-2 px-1 w-14">兴趣%</th><th class="py-2 px-1 w-14">成长%</th><th class="py-2 px-1 w-14">成功率%</th></tr></thead>
              <tbody>
                <tr v-for="(s, idx) in form.skills" :key="s.id" class="border-b border-chat-border/50">
                  <td class="py-1 pr-2 min-w-[120px]">
                    <template v-if="s.custom"><input v-model="s.name" type="text" :class="inputCls" class="!py-1 !text-sm" placeholder="自定义" /></template>
                    <template v-else>
                      <span v-if="!s.typeOption">{{ s.name }}</span>
                      <span v-else class="flex items-center gap-1">{{ s.name.replace(/\d$/, '') }}<select v-model="s.typeValue" :class="inputCls" class="!py-0.5 !text-xs w-20 inline-block"><option value="">-</option><option v-for="opt in (SKILL_TYPE_OPTIONS[s.typeOption] || [])" :key="opt" :value="opt">{{ opt }}</option></select></span>
                    </template>
                  </td>
                  <td class="py-1 px-1"><div class="px-1 py-0.5 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-right">{{ s.base ?? 0 }}</div></td>
                  <td class="py-1 px-1"><input v-model.number="s.career" type="number" min="0" class="w-full px-1 py-0.5 rounded bg-chat-bg border border-chat-border text-white text-sm" /></td>
                  <td class="py-1 px-1"><input v-model.number="s.interest" type="number" min="0" class="w-full px-1 py-0.5 rounded bg-chat-bg border border-chat-border text-white text-sm" /></td>
                  <td class="py-1 px-1"><input v-model.number="s.growth" type="number" min="0" class="w-full px-1 py-0.5 rounded bg-chat-bg border border-chat-border text-white text-sm" /></td>
                  <td class="py-1 px-1 font-mono">{{ skillSuccess(s) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 六、武器 -->
        <section :class="sectionCls">
          <h2 :class="sectionTitleCls">六、武器（Weapons）</h2>
          <p class="text-xs text-accent-muted mb-3">默认徒手格斗。点击「添加」在弹窗中选择武器；可删除除第一行外的武器。</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse min-w-[800px]">
              <thead class="sticky top-0 bg-chat-bg/95 z-[1]">
                <tr class="text-left text-accent-muted border-b border-chat-border">
                  <th class="p-1.5 border border-chat-border w-28">武器名称</th>
                  <th class="p-1.5 border border-chat-border w-24">使用技能</th>
                  <th class="p-1.5 border border-chat-border w-14">成功率</th>
                  <th class="p-1.5 border border-chat-border w-20">伤害</th>
                  <th class="p-1.5 border border-chat-border w-14">射程</th>
                  <th class="p-1.5 border border-chat-border w-14">贯穿</th>
                  <th class="p-1.5 border border-chat-border w-14">次数</th>
                  <th class="p-1.5 border border-chat-border w-14">装弹量</th>
                  <th class="p-1.5 border border-chat-border w-14">故障</th>
                  <th class="p-1.5 border border-chat-border w-10"> </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(w, idx) in form.weapons" :key="idx" class="border-b border-chat-border/50 last:border-none">
                  <td class="p-1 border border-chat-border">
                    <div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.name || '-' }}</div>
                  </td>
                  <td class="p-1 border border-chat-border">
                    <div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.skill || '-' }}</div>
                  </td>
                  <td class="p-1 border border-chat-border">
                    <div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.success ?? '-' }}</div>
                  </td>
                  <td class="p-1 border border-chat-border">
                    <div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.damage || '-' }}</div>
                  </td>
                  <td class="p-1 border border-chat-border">
                    <div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.range || '-' }}</div>
                  </td>
                  <td class="p-1 border border-chat-border text-center">
                    <div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ penetrateLabel(w.penetrate) }}</div>
                  </td>
                  <td class="p-1 border border-chat-border">
                    <div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.attacks ?? '-' }}</div>
                  </td>
                  <td class="p-1 border border-chat-border">
                    <div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.ammo ?? '-' }}</div>
                  </td>
                  <td class="p-1 border border-chat-border">
                    <div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.malfunction ?? '-' }}</div>
                  </td>
                  <td class="p-1 border border-chat-border">
                    <button
                      v-if="idx > 0"
                      type="button"
                      class="p-1 rounded text-accent-muted hover:text-red-400 hover:bg-white/5"
                      title="删除"
                      @click="removeWeapon(idx)"
                    >
                      <Icon icon="mdi:close" class="text-lg" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-3">
            <button
              type="button"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-chat-border text-accent-muted hover:text-accent hover:border-accent/50 text-sm"
              @click="addWeaponDialogOpen = true"
            >
              <Icon icon="mdi:plus" class="text-lg" />
              添加
            </button>
          </div>

          <!-- 添加武器弹窗：从预设中选择 -->
          <Dialog :open="addWeaponDialogOpen" @close="addWeaponDialogOpen = false" class="relative z-[10000]">
            <DialogOverlay class="fixed inset-0 bg-black/50" />
            <div class="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel class="w-full max-w-md rounded-xl bg-chat-panel border border-chat-border shadow-xl p-4 max-h-[80vh] overflow-hidden flex flex-col focus:outline-none">
                <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3 shrink-0">选择武器</DialogTitle>
                <div class="overflow-y-auto flex-1 min-h-0 space-y-1">
                  <button
                    v-for="p in PRESET_WEAPONS"
                    :key="p.id"
                    type="button"
                    class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm text-[#a6adc8] hover:bg-sidebar-hover hover:text-white transition-colors"
                    @click="addWeaponFromPreset(p)"
                  >
                    <span>{{ p.name }}</span>
                    <span class="text-xs text-accent-muted">{{ p.skill }} · {{ p.damage }}</span>
                  </button>
                </div>
                <div class="shrink-0 pt-3 border-t border-chat-border">
                  <button
                    type="button"
                    class="w-full px-3 py-2 rounded-lg text-accent-muted hover:text-white text-sm"
                    @click="addWeaponDialogOpen = false"
                  >
                    取消
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        </section>

        <!-- 七、战斗 -->
        <section :class="sectionCls">
          <h2 :class="sectionTitleCls">七、战斗（Combat）</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><label :class="labelCls">伤害加值（DB）</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ syncDerived.damageBonus >= 0 ? '+' : '' }}{{ syncDerived.damageBonus }}</div></div>
            <div><label :class="labelCls">体格</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ syncDerived.build >= 0 ? '+' : '' }}{{ syncDerived.build }}</div></div>
            <div><label :class="labelCls">护甲</label><input v-model="form.combat.armor" type="text" :class="inputCls" placeholder="护甲" /></div>
            <div><label :class="labelCls">移动力</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ syncDerived.move }}</div></div>
          </div>
        </section>

        <!-- 八、物品与装备 -->
        <section :class="sectionCls">
          <h2 :class="sectionTitleCls">八、物品与装备（Possessions）</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label :class="labelCls">信用评级</label><input v-model="form.possessions.creditRating" type="text" :class="inputCls" /></div>
            <div><label :class="labelCls">现金</label><input v-model="form.possessions.cash" type="text" :class="inputCls" /></div>
            <div><label :class="labelCls">消费水平</label><input v-model="form.possessions.spendingLevel" type="text" :class="inputCls" /></div>
            <div><label :class="labelCls">资产</label><input v-model="form.possessions.assets" type="text" :class="inputCls" /></div>
            <div class="sm:col-span-2"><label :class="labelCls">其余物品/装备</label><textarea v-model="form.possessions.other" rows="2" :class="inputCls" placeholder="补充描述" /></div>
          </div>
        </section>

        <!-- 九、克苏鲁神话 -->
        <section :class="sectionCls">
          <h2 :class="sectionTitleCls">九、克苏鲁神话（Cthulhu Mythos）</h2>
          <div class="space-y-4">
            <div><label :class="labelCls">魔法物品与典籍</label><textarea v-model="form.mythos.magicItems" rows="2" :class="inputCls" /></div>
            <div><label :class="labelCls">法术</label><textarea v-model="form.mythos.spells" rows="2" :class="inputCls" /></div>
            <div><label :class="labelCls">第三类接触（经历/能力描述）</label><textarea v-model="form.mythos.thirdContact" rows="2" :class="inputCls" /></div>
          </div>
        </section>

        <!-- 十、背景故事 -->
        <section :class="sectionCls">
          <h2 :class="sectionTitleCls">十、背景故事（Story）</h2>
          <div class="space-y-3">
            <div v-for="key in ['intro','appearance','belief','importantPerson','significantPlace','preciousThing','traits','woundsScars','mentalDisorder']" :key="key">
              <label :class="labelCls">{{ { intro:'个人介绍', appearance:'形象描述', belief:'思想与信念', importantPerson:'重要之人', significantPlace:'意义非凡之地', preciousThing:'宝贵之物', traits:'特质', woundsScars:'伤口与疤痕', mentalDisorder:'精神症状' }[key] }}</label>
              <textarea v-model="form.story[key]" :class="inputCls" rows="2" class="resize-y" />
            </div>
          </div>
        </section>

        <!-- 十一、人际关系 -->
        <section :class="sectionCls">
          <h2 :class="sectionTitleCls">十一、人际关系（Companions）</h2>
          <p class="text-xs text-accent-muted mb-3">点击「添加」在弹窗中填写后加入列表；可删除已有项。</p>
          <div class="space-y-2">
            <div v-for="(comp, idx) in form.companions" :key="idx" class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <input v-model="comp.name" type="text" :class="inputCls" class="!py-1.5" placeholder="角色名称" />
              <input v-model="comp.relation" type="text" :class="inputCls" class="!py-1.5" placeholder="关系" />
              <div class="flex items-center gap-2">
                <input v-model="comp.player" type="text" :class="inputCls" class="!py-1.5 flex-1" placeholder="所属玩家" />
                <button type="button" class="p-1.5 rounded text-accent-muted hover:text-red-400 hover:bg-white/5" title="删除" @click="removeCompanion(idx)">
                  <Icon icon="mdi:close" class="text-lg" />
                </button>
              </div>
            </div>
            <p v-if="!form.companions.length" class="text-sm text-accent-muted py-2">暂无，点击下方按钮添加。</p>
            <button type="button" class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-chat-border text-accent-muted hover:text-accent hover:border-accent/50 text-sm" @click="openCompanionDialog()">
              <Icon icon="mdi:plus" class="text-lg" />
              添加
            </button>
          </div>
          <Dialog :open="companionDialogOpen" @close="companionDialogOpen = false" class="relative z-[10000]">
            <DialogOverlay class="fixed inset-0 bg-black/50" />
            <div class="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel class="w-full max-w-md rounded-xl bg-chat-panel border border-chat-border shadow-xl p-4 focus:outline-none">
                <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3">添加人际关系</DialogTitle>
                <div class="space-y-3">
                  <input v-model="companionDraft.name" type="text" :class="inputCls" placeholder="角色名称" />
                  <input v-model="companionDraft.relation" type="text" :class="inputCls" placeholder="关系" />
                  <input v-model="companionDraft.player" type="text" :class="inputCls" placeholder="所属玩家" />
                </div>
                <div class="flex gap-2 mt-4">
                  <button type="button" :class="inputCls" class="flex-1 py-2" @click="confirmCompanion()">确认</button>
                  <button type="button" :class="inputCls" class="flex-1 py-2" @click="companionDialogOpen = false">取消</button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        </section>

        <!-- 十二、经历过的模组 -->
        <section :class="sectionCls">
          <h2 :class="sectionTitleCls">十二、经历过的模组（Experienced Scenarios）</h2>
          <p class="text-xs text-accent-muted mb-3">点击「添加」在弹窗中填写后加入列表；可删除已有项。</p>
          <div class="space-y-2">
            <div v-for="(sc, idx) in form.scenarios" :key="idx" class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <input v-model="sc.name" type="text" :class="inputCls" class="!py-1.5 sm:col-span-1" placeholder="模组名称" />
              <div class="flex items-center gap-2 sm:col-span-2">
                <input v-model="sc.experience" type="text" :class="inputCls" class="!py-1.5 flex-1" placeholder="游玩经历（剧情/体验）" />
                <button type="button" class="p-1.5 rounded text-accent-muted hover:text-red-400 hover:bg-white/5 shrink-0" title="删除" @click="removeScenario(idx)">
                  <Icon icon="mdi:close" class="text-lg" />
                </button>
              </div>
            </div>
            <p v-if="!form.scenarios.length" class="text-sm text-accent-muted py-2">暂无，点击下方按钮添加。</p>
            <button type="button" class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-chat-border text-accent-muted hover:text-accent hover:border-accent/50 text-sm" @click="openScenarioDialog()">
              <Icon icon="mdi:plus" class="text-lg" />
              添加
            </button>
          </div>
          <Dialog :open="scenarioDialogOpen" @close="scenarioDialogOpen = false" class="relative z-[10000]">
            <DialogOverlay class="fixed inset-0 bg-black/50" />
            <div class="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel class="w-full max-w-md rounded-xl bg-chat-panel border border-chat-border shadow-xl p-4 focus:outline-none">
                <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3">添加经历模组</DialogTitle>
                <div class="space-y-3">
                  <input v-model="scenarioDraft.name" type="text" :class="inputCls" placeholder="模组名称" />
                  <input v-model="scenarioDraft.experience" type="text" :class="inputCls" placeholder="游玩经历（剧情/体验）" />
                </div>
                <div class="flex gap-2 mt-4">
                  <button type="button" :class="inputCls" class="flex-1 py-2" @click="confirmScenario()">确认</button>
                  <button type="button" :class="inputCls" class="flex-1 py-2" @click="scenarioDialogOpen = false">取消</button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import { useCharactersStore } from '../stores/characters'
import ListboxSelect from '../components/ui/ListboxSelect.vue'
import ComboboxSelect from '../components/ui/ComboboxSelect.vue'

const route = useRoute()
const router = useRouter()
const sidebarOpen = inject('sidebarOpen')
const toggleSidebar = inject('toggleSidebar')

const { getById, getDefaultSheet, getDerived, create, update, PRESET_SKILLS, SKILL_TYPE_OPTIONS, PRESET_WEAPONS, WEAPON_PENETRATE_OPTIONS, normalizeWeapons } = useCharactersStore()

const isNew = computed(() => route.name === 'character-new')
const id = computed(() => route.params.id)

const form = ref({ ...getDefaultSheet() })
const derived = computed(() => getDerived(form.value))

// 同步衍生到战斗与核心面板（用于显示/初始值）
const syncDerived = computed(() => ({
  hpMax: derived.value.hpMax,
  mpMax: derived.value.mpMax,
  sanInitial: derived.value.sanInitial,
  move: derived.value.move,
  damageBonus: derived.value.damageBonus,
  build: derived.value.build,
}))

onMounted(() => {
  if (!isNew.value && id.value) {
    const c = getById(id.value)
    if (c) {
      const def = getDefaultSheet()
      form.value = { ...def, ...c }
      form.value.skillRule = { ...def.skillRule, ...(c.skillRule || {}) }
      form.value.combat = { ...def.combat, ...(c.combat || {}) }
      form.value.possessions = { ...def.possessions, ...(c.possessions || {}) }
      form.value.mythos = { ...def.mythos, ...(c.mythos || {}) }
      form.value.story = { ...def.story, ...(c.story || {}) }
      form.value.weapons = normalizeWeapons(c.weapons)
      form.value.companions = Array.isArray(c.companions) ? c.companions : def.companions
      form.value.scenarios = Array.isArray(c.scenarios) ? c.scenarios : def.scenarios
      if (!form.value.skills || form.value.skills.length !== PRESET_SKILLS.length) {
        form.value.skills = getDefaultSheet().skills
      }
    } else {
      router.replace('/characters')
    }
  }
})

function save() {
  const name = form.value.name?.trim() || '未命名'
  if (isNew.value) {
    const newId = create({ ...form.value, name })
    router.replace(`/characters/${newId}`)
  } else {
    update(id.value, { ...form.value, name })
  }
}

function goBack() {
  router.push('/characters')
}

const addWeaponDialogOpen = ref(false)

function addWeaponFromPreset(preset) {
  form.value.weapons.push({
    name: preset.name,
    skill: preset.skill ?? '',
    success: preset.success ?? '',
    damage: preset.damage ?? '',
    range: preset.range ?? '',
    penetrate: preset.penetrate ?? '',
    attacks: String(preset.attacks ?? ''),
    ammo: String(preset.ammo ?? ''),
    malfunction: String(preset.malfunction ?? ''),
  })
  addWeaponDialogOpen.value = false
}

function removeWeapon(idx) {
  if (idx <= 0) return
  form.value.weapons.splice(idx, 1)
}

// 人际关系：添加弹窗
const companionDialogOpen = ref(false)
const companionDraft = ref({ name: '', relation: '', player: '' })
function openCompanionDialog() {
  companionDraft.value = { name: '', relation: '', player: '' }
  companionDialogOpen.value = true
}
function confirmCompanion() {
  form.value.companions.push({
    name: companionDraft.value.name ?? '',
    relation: companionDraft.value.relation ?? '',
    player: companionDraft.value.player ?? '',
  })
  companionDialogOpen.value = false
}
function removeCompanion(idx) {
  form.value.companions.splice(idx, 1)
}

// 经历模组：添加弹窗
const scenarioDialogOpen = ref(false)
const scenarioDraft = ref({ name: '', experience: '' })
function openScenarioDialog() {
  scenarioDraft.value = { name: '', experience: '' }
  scenarioDialogOpen.value = true
}
function confirmScenario() {
  form.value.scenarios.push({
    name: scenarioDraft.value.name ?? '',
    experience: scenarioDraft.value.experience ?? '',
  })
  scenarioDialogOpen.value = false
}
function removeScenario(idx) {
  form.value.scenarios.splice(idx, 1)
}

function penetrateLabel(value) {
  const opt = WEAPON_PENETRATE_OPTIONS.find((o) => o.value === value)
  return opt ? opt.label : '-'
}

// 骰子：3d6×5
function roll3d6x5() {
  let sum = 0
  for (let i = 0; i < 3; i++) sum += Math.floor(Math.random() * 6) + 1
  return sum * 5
}
// 骰子：(2d6+6)×5
function roll2d6p6x5() {
  let sum = 6
  for (let i = 0; i < 2; i++) sum += Math.floor(Math.random() * 6) + 1
  return sum * 5
}

const charRolls = {
  str: () => roll3d6x5(), dex: () => roll3d6x5(), siz: () => roll2d6p6x5(), app: () => roll3d6x5(),
  con: () => roll3d6x5(), int: () => roll2d6p6x5(), pow: () => roll3d6x5(), edu: () => roll2d6p6x5(), luc: () => roll3d6x5(),
}

/** 一键随机全部 9 项核心属性 */
function rollAllChars() {
  form.value.str = charRolls.str()
  form.value.dex = charRolls.dex()
  form.value.siz = charRolls.siz()
  form.value.app = charRolls.app()
  form.value.con = charRolls.con()
  form.value.int = charRolls.int()
  form.value.pow = charRolls.pow()
  form.value.edu = charRolls.edu()
  form.value.luc = charRolls.luc()
}

// 技能行：成功率（仅展示合计）
function skillSuccess(s) {
  const total = (s.base || 0) + (s.career || 0) + (s.interest || 0) + (s.growth || 0)
  return total
}

const genderOptions = [{ value: '男', label: '男' }, { value: '女', label: '女' }]
const occupationOptions = [
  '医生', '律师', '侦探', '记者', '教授', '学生', '作家', '艺术家', '古董商', '工程师',
  '军人', '警察', '司机', '佣人', '农民', '猎人', '流浪汉', '罪犯', '图书馆管理员',
  '神职人员', '神秘学家', '探险家', '飞行员', '水手', '演员', '舞蹈家', '音乐家', '摄影师',
]
const inputCls = 'w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none'
const labelCls = 'block text-sm text-[#a6adc8] mb-1'
const sectionCls = 'rounded-xl bg-chat-panel border border-chat-border p-4'
const sectionTitleCls = 'text-sm font-medium text-accent-muted uppercase tracking-wider mb-3'
</script>

