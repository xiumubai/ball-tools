const STORAGE_RULES = 'zhuifen_rules'
const STORAGE_CURRENT = 'zhuifen_match_current'
const STORAGE_HISTORY = 'zhuifen_match_history'
const { formatTime } = require('../../utils/util.js')

function defaultRules() {
  return { foul: 1, normal: 4, xiaojin: 7, dajin: 10, huangjin9: 4 }
}

function makePlayer(id, name, score) {
  return { id, name, score, counts: { foul: 0, normal: 0, xiaojin: 0, dajin: 0, huangjin9: 0 } }
}

function initState(mode) {
  const players = mode === 2
    ? [makePlayer('A','玩家A',100), makePlayer('B','玩家B',100)]
    : [makePlayer('A','玩家A',100), makePlayer('B','玩家B',100), makePlayer('C','玩家C',100)]
  return { players, rounds: 0, history: [] }
}

function lastOpTextFrom(history, players, labelOf) {
  if (!history || !history.length) return ''
  const h = history[history.length - 1]
  const name = (h.type === 'foul' && Array.isArray(h.losers) && h.losers.length)
    ? players[h.losers[0]].name
    : players[h.winnerIndex].name
  return `${name} ${labelOf(h.type)}`
}

Page({
  data: {
    mode: 2,
    rounds: 0,
    players: [],
    avatars: ['/images/zhuifen_active.png','/images/zhuifen_active.png','/images/zhuifen_active.png'],
    selectedIndex: 0,
    lastOpText: '',
    rules: defaultRules(),
    history: [],
    state2: { players: [], rounds: 0, history: [] },
    state3: { players: [], rounds: 0, history: [] },
    // settings
    settingsVisible: false,
    rulesForm: defaultRules(),
    // loser selection
    loserVisible: false,
    loserCandidates: [],
    selectedLoserIndex: -1,
    pendingOpType: '',
    pendingWinnerIndex: -1,
    // rename
    renameVisible: false,
    renameValue: '',
    renameIdx: -1,
  },
  onLoad() {
    this.restore()
  },
  initPlayers(mode) {
    if (mode === 2) {
      return [makePlayer('A','玩家A',100), makePlayer('B','玩家B',100)]
    }
    return [makePlayer('A','玩家A',100), makePlayer('B','玩家B',100), makePlayer('C','玩家C',100)]
  },
  setMode(e) {
    const mode = Number(e.currentTarget.dataset.mode)
    if (mode === this.data.mode) return
    const key = mode === 2 ? 'state2' : 'state3'
    let state = this.data[key]
    if (!state || !state.players || !state.players.length) {
      state = initState(mode)
      this.setData({ [key]: state })
    }
    const lastOpText = lastOpTextFrom(state.history, state.players, this.labelOf.bind(this))
    this.setData({ mode, players: state.players, rounds: state.rounds, history: state.history, selectedIndex: 0, lastOpText })
    this.persist()
  },
  onSelectWinner(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ selectedIndex: idx })
  },
  onOp(e) {
    const type = e.currentTarget.dataset.type
    const winnerIndex = this.data.selectedIndex
    if (this.data.mode === 3 && (type === 'normal' || type === 'xiaojin' || type === 'foul')) {
      const loserCandidates = [0,1,2].filter(i => i !== winnerIndex)
      this.setData({ loserVisible: true, loserCandidates, selectedLoserIndex: -1, pendingOpType: type, pendingWinnerIndex: winnerIndex })
      return
    }
    this.applyOpImmediate(type, winnerIndex)
  },
  pickLoser(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ selectedLoserIndex: idx })
  },
  cancelPickLoser() {
    this.setData({ loserVisible: false, selectedLoserIndex: -1, pendingOpType: '', pendingWinnerIndex: -1 })
  },
  confirmPickLoser() {
    if (this.data.selectedLoserIndex < 0) {
      wx.showToast({ title: '请选择输家', icon: 'none' })
      return
    }
    const { pendingOpType, pendingWinnerIndex, selectedLoserIndex } = this.data
    this.setData({ loserVisible: false })
    this.applyOpImmediate(pendingOpType, pendingWinnerIndex, [selectedLoserIndex])
  },
  applyOpImmediate(type, winnerIndex, loserList = null) {
    const rules = this.data.rules
    const delta = rules[type]
    const isTripleSpecial = (this.data.mode === 3) && (type === 'dajin' || type === 'huangjin9')
    const winnerDelta = isTripleSpecial ? delta * 2 : delta
    const players = JSON.parse(JSON.stringify(this.data.players))
    let rounds = this.data.rounds
    const history = this.data.history.slice()
    // Build losers
    let losers = []
    if (this.data.mode === 2) {
      losers = [winnerIndex === 0 ? 1 : 0]
    } else {
      if (type === 'dajin' || type === 'huangjin9') {
        losers = [0,1,2].filter(i => i !== winnerIndex)
      } else if (loserList && loserList.length) {
        losers = loserList
      } else {
        losers = []
      }
    }
    players[winnerIndex].score += winnerDelta
    if (type === 'foul') {
      losers.forEach(li => { players[li].counts.foul += 1 })
    } else {
      players[winnerIndex].counts[type] += 1
    }
    losers.forEach(li => { players[li].score -= delta })
    // Rounds: exclude foul
    if (type !== 'foul') rounds += 1
    let lastOpText = ''
    if (type === 'foul') {
      const foulName = (Array.isArray(losers) && losers.length)
        ? players[losers[0]].name
        : players[winnerIndex].name
      lastOpText = `${foulName} ${this.labelOf(type)}`
    } else {
      lastOpText = `${players[winnerIndex].name} ${this.labelOf(type)}`
    }
    history.push({ type, winnerIndex, losers, delta, winnerDelta })
    const key = this.data.mode === 2 ? 'state2' : 'state3'
    this.setData({ players, rounds, history, lastOpText, [`${key}.players`]: players, [`${key}.rounds`]: rounds, [`${key}.history`]: history })
    this.persist()
    wx.showToast({ title: lastOpText, icon: 'none' })
  },
  labelOf(type) {
    switch(type){
      case 'foul': return '犯规'
      case 'normal': return '普胜'
      case 'xiaojin': return '小金'
      case 'dajin': return '大金'
      case 'huangjin9': return '黄金9'
      default: return type
    }
  },
  onUndo() {
    if (!this.data.history.length) return
    const history = this.data.history.slice()
    const last = history.pop()
    const players = JSON.parse(JSON.stringify(this.data.players))
    let rounds = this.data.rounds
    const { type, winnerIndex, losers, delta, winnerDelta } = last
    players[winnerIndex].score -= (winnerDelta || delta)
    if (type === 'foul') {
      if (Array.isArray(losers)) {
        losers.forEach(li => { if (players[li].counts.foul > 0) players[li].counts.foul -= 1 })
      }
    } else {
      if (players[winnerIndex].counts[type] > 0) players[winnerIndex].counts[type] -= 1
    }
    if (Array.isArray(losers)) {
      losers.forEach(li => { players[li].score += delta })
    }
    if (type !== 'foul' && rounds > 0) rounds -= 1
    const lastOpText = lastOpTextFrom(history, players, this.labelOf.bind(this))
    const key = this.data.mode === 2 ? 'state2' : 'state3'
    this.setData({ players, rounds, history, lastOpText, [`${key}.players`]: players, [`${key}.rounds`]: rounds, [`${key}.history`]: history })
    this.persist()
    wx.showToast({ title: '已撤销', icon: 'none' })
  },
  openSettings() {
    this.setData({ settingsVisible: true, rulesForm: { ...this.data.rules } })
  },
  closeSettings() {
    this.setData({ settingsVisible: false })
  },
  onRuleInput(e) {
    const key = e.currentTarget.dataset.key
    let val = e.detail.value
    val = String(val).replace(/[^0-9]/g,'')
    const rulesForm = { ...this.data.rulesForm, [key]: val }
    this.setData({ rulesForm })
  },
  saveSettings() {
    const f = { ...this.data.rulesForm }
    const keys = ['foul','normal','xiaojin','dajin','huangjin9']
    for (const k of keys) {
      const n = Number(f[k])
      if (!n || n <= 0) {
        wx.showToast({ title: '分值需为正整数', icon: 'none' })
        return
      }
      f[k] = n
    }
    this.setData({ rules: f, settingsVisible: false })
    try { wx.setStorageSync(STORAGE_RULES, f) } catch(e) {}
    wx.showToast({ title: '规则已应用', icon: 'none' })
    this.persist()
  },
  onRenameStart(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const value = this.data.players[idx].name
    this.setData({ renameVisible: true, renameIdx: idx, renameValue: value })
  },
  onRenameInput(e) { this.setData({ renameValue: e.detail.value }) },
  onRenameCancel() { this.setData({ renameVisible: false, renameIdx: -1, renameValue: '' }) },
  onRenameSave() {
    const val = (this.data.renameValue || '').trim()
    const reg = /^[\u4e00-\u9fa5]{1,4}$/
    if (!reg.test(val)) { wx.showToast({ title: '仅支持中文，最多4字', icon: 'none' }); return }
    const players = this.data.players.slice()
    players[this.data.renameIdx].name = val
    // update lastOpText if applicable
    let lastOpText = this.data.lastOpText
    if (this.data.history.length) {
      const last = this.data.history[this.data.history.length-1]
      const name = (last.type === 'foul' && Array.isArray(last.losers) && last.losers.length)
        ? players[last.losers[0]].name
        : players[last.winnerIndex].name
      lastOpText = `${name} ${this.labelOf(last.type)}`
    }
    const key = this.data.mode === 2 ? 'state2' : 'state3'
    this.setData({ players, renameVisible: false, renameIdx: -1, renameValue: '', lastOpText, [`${key}.players`]: players })
    this.persist()
  },
  onEndMatch() {
    wx.showModal({
      title: '结束比赛',
      content: '结束后比分与局数将重置并写入本地',
      confirmText: '结束', cancelText: '取消',
      success: (res) => { if (res.confirm) this.finishMatch() }
    })
  },
  onRestart() {
    wx.showModal({
      title: '重新开始',
      content: '本次比赛作废，比分与局数将重置且不保存',
      confirmText: '重新开始', cancelText: '取消',
      success: (res) => { if (res.confirm) this.doRestart() }
    })
  },
  doRestart() {
    const players = this.data.players.map(p => ({ ...p, score: 100, counts: { foul: 0, normal: 0, xiaojin: 0, dajin: 0, huangjin9: 0 } }))
    const key = this.data.mode === 2 ? 'state2' : 'state3'
    this.setData({ players, rounds: 0, history: [], lastOpText: '', [`${key}.players`]: players, [`${key}.rounds`]: 0, [`${key}.history`]: [] })
    this.persist()
    wx.showToast({ title: '已重新开始', icon: 'none' })
  },
  finishMatch() {
    const record = {
      mode: this.data.mode,
      rules: this.data.rules,
      rounds: this.data.rounds,
      finishedAt: Date.now(),
      finishedAtISO: new Date().toISOString(),
      players: this.data.players.map(p => ({ name: p.name, score: p.score, counts: p.counts }))
    }
    let hist = []
    try { const h = wx.getStorageSync(STORAGE_HISTORY); if (Array.isArray(h)) hist = h } catch(e) {}
    hist.push(record)
    try { wx.setStorageSync(STORAGE_HISTORY, hist) } catch(e) {}
    const players = this.data.players.map(p => ({ ...p, score: 100, counts: { foul: 0, normal: 0, xiaojin: 0, dajin: 0, huangjin9: 0 } }))
    const key = this.data.mode === 2 ? 'state2' : 'state3'
    this.setData({ players, rounds: 0, history: [], lastOpText: '', [`${key}.players`]: players, [`${key}.rounds`]: 0, [`${key}.history`]: [] })
    this.persist()
    wx.showToast({ title: '本场数据已保存', icon: 'none' })
  },
  persist() {
    const payload = {
      mode: this.data.mode,
      rules: this.data.rules,
      states: {
        2: this.data.state2 && this.data.state2.players.length ? this.data.state2 : initState(2),
        3: this.data.state3 && this.data.state3.players.length ? this.data.state3 : initState(3),
      }
    }
    try { wx.setStorageSync(STORAGE_CURRENT, payload) } catch(e) {}
  },
  restore() {
    let rules = defaultRules()
    try { const r = wx.getStorageSync(STORAGE_RULES); if (r && r.foul) rules = r } catch(e) {}
    let saved = null
    try { saved = wx.getStorageSync(STORAGE_CURRENT) } catch(e) {}
    if (saved && saved.states) {
      const s2 = saved.states[2] && saved.states[2].players ? saved.states[2] : initState(2)
      const s3 = saved.states[3] && saved.states[3].players ? saved.states[3] : initState(3)
      const mode = saved.mode === 3 ? 3 : 2
      const current = mode === 2 ? s2 : s3
      const lastOpText = lastOpTextFrom(current.history, current.players, this.labelOf.bind(this))
      this.setData({ rules, state2: s2, state3: s3, mode, players: current.players, rounds: current.rounds, history: current.history, selectedIndex: 0, lastOpText })
    } else if (saved && saved.players && saved.mode) {
      const mode = saved.mode
      const current = { players: saved.players, rounds: saved.rounds||0, history: saved.history||[] }
      const other = initState(mode === 2 ? 3 : 2)
      const s2 = mode === 2 ? current : other
      const s3 = mode === 3 ? current : other
      const lastOpText = lastOpTextFrom(current.history, current.players, this.labelOf.bind(this))
      this.setData({ rules, state2: s2, state3: s3, mode, players: current.players, rounds: current.rounds, history: current.history, selectedIndex: 0, lastOpText })
      this.persist()
    } else {
      const s2 = initState(2)
      const s3 = initState(3)
      const lastOpText = ''
      this.setData({ rules, state2: s2, state3: s3, mode: 2, players: s2.players, rounds: s2.rounds, history: s2.history, selectedIndex: 0, lastOpText })
      this.persist()
    }
  }
})
