const storage = require('../../utils/storage')
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
  return { players, rounds: 1, history: [] }
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
    rounds: 1,
    players: [],
    avatars: ['/images/zhuifen_active.png','/images/zhuifen_active.png','/images/zhuifen_active.png'],
    selectedIndex: 0,
    lastOpText: '',
    rules: defaultRules(),
    history: [],
    // settings
    settingsVisible: false,
    rulesForm: defaultRules(),
    // loser selection
    loserVisible: false,
    loserCandidates: [],
    selectedLoserIndex: -1,
    pendingOpType: '',
    pendingWinnerIndex: -1,
    // winner selection for foul (3-player)
    winnerVisible: false,
    winnerCandidates: [],
    selectedWinnerIndex: -1,
    pendingLoserIndex: -1,
    // rename
    renameVisible: false,
    renameValue: '',
    renameIdx: -1,
    // timer & match
    elapsedTime: 0,
    isRunning: false,
    runningSince: 0,
    hasStarted: false,
    timerText: '00:00:00',
    matchId: null,
    modeLabel: '9球两人追分'
  },
  onLoad(options) {
    const id = options && options.matchId ? Number(options.matchId) : null
    const isNew = options && (options.new === '1' || options.new === 1 || options.new === true)
    const players = options && options.players ? Number(options.players) : 2
    const mode = players === 3 ? 3 : 2
    const modeLabel = mode === 3 ? '9球三人追分' : '9球两人追分'
    this.setData({ matchId: id, mode, modeLabel })
    if (id) {
      const list = storage.ongoing.getList()
      const item = (Array.isArray(list) ? list : []).find(v => v && v.id === id)
      if (item && item.playersCount) this.setData({ mode: item.playersCount === 3 ? 3 : 2, modeLabel: item.playersCount === 3 ? '9球三人追分' : '9球两人追分' })
      this.restoreCurrent()
    } else if (isNew) {
      const s = initState(mode)
      this.setData({ players: s.players, rounds: s.rounds, history: s.history, lastOpText: '', elapsedTime: 0, hasStarted: false, isRunning: false, runningSince: 0 })
    } else {
      this.restoreCurrent()
    }
    this.updateTimerText()
  },
  initPlayers(mode) {
    if (mode === 2) {
      return [makePlayer('A','玩家A',100), makePlayer('B','玩家B',100)]
    }
    return [makePlayer('A','玩家A',100), makePlayer('B','玩家B',100), makePlayer('C','玩家C',100)]
  },
  
  onSelectWinner(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ selectedIndex: idx })
  },
  onOp(e) {
    if (!this.data.hasStarted) { wx.showToast({ title: '请先点击开始', icon: 'none' }); return }
    const type = e.currentTarget.dataset.type
    const winnerIndex = this.data.selectedIndex
    if (this.data.mode === 3 && (type === 'normal' || type === 'xiaojin')) {
      const loserCandidates = [0,1,2].filter(i => i !== winnerIndex)
      this.setData({ loserVisible: true, loserCandidates, selectedLoserIndex: -1, pendingOpType: type, pendingWinnerIndex: winnerIndex })
      return
    }
    if (this.data.mode === 3 && type === 'foul') {
      const loserIndex = this.data.selectedIndex
      const winnerCandidates = [0,1,2].filter(i => i !== loserIndex)
      this.setData({ winnerVisible: true, winnerCandidates, selectedWinnerIndex: -1, pendingOpType: type, pendingLoserIndex: loserIndex })
      return
    }
    this.applyOpImmediate(type, winnerIndex)
  },
  onToggleTimer() {
    if (this.data.isRunning) this.stopTimer()
    else this.startTimer()
  },
  pickLoser(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ selectedLoserIndex: idx })
    this.confirmPickLoser()
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
  pickWinner(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ selectedWinnerIndex: idx })
    this.confirmPickWinner()
  },
  cancelPickWinner() {
    this.setData({ winnerVisible: false, selectedWinnerIndex: -1, pendingOpType: '', pendingLoserIndex: -1 })
  },
  confirmPickWinner() {
    if (this.data.selectedWinnerIndex < 0) {
      wx.showToast({ title: '请选择赢家', icon: 'none' })
      return
    }
    const winnerIndex = this.data.selectedWinnerIndex
    const loserIndex = this.data.pendingLoserIndex
    this.setData({ winnerVisible: false })
    this.applyFoulWithWinner(loserIndex, winnerIndex)
  },
  applyFoulWithWinner(loserIndex, winnerIndex) {
    const rules = this.data.rules
    const players = JSON.parse(JSON.stringify(this.data.players))
    let rounds = this.data.rounds
    const history = this.data.history.slice()
    const delta = rules.foul || 1
    players[winnerIndex].score += delta
    players[loserIndex].score -= delta
    players[loserIndex].counts.foul += 1
    const lastOpText = `${players[loserIndex].name} ${this.labelOf('foul')}`
    history.push({ type: 'foul', winners: [winnerIndex], losers: [loserIndex], delta, winnerDelta: delta })
    this.setData({ players, rounds, history, lastOpText })
    this.persistCurrent()
    wx.showToast({ title: lastOpText, icon: 'none' })
  },
  applyOpImmediate(type, winnerIndex, loserList = null) {
    const rules = this.data.rules
    const players = JSON.parse(JSON.stringify(this.data.players))
    let rounds = this.data.rounds
    const history = this.data.history.slice()

    if (type === 'foul') {
      const delta = rules.foul || 1
      const loserIndex = this.data.selectedIndex
      let winners = []
      if (this.data.mode === 2) {
        winners = [loserIndex === 0 ? 1 : 0]
      } else {
        return
      }
      winners.forEach(wi => { players[wi].score += delta })
      players[loserIndex].score -= delta
      players[loserIndex].counts.foul += 1
      const lastOpText = `${players[loserIndex].name} ${this.labelOf('foul')}`
      history.push({ type: 'foul', winners, losers: [loserIndex], delta, winnerDelta: delta })
      this.setData({ players, rounds, history, lastOpText })
      this.persistCurrent()
      wx.showToast({ title: lastOpText, icon: 'none' })
      return
    }

    const delta = rules[type]
    const isTripleSpecial = (this.data.mode === 3) && (type === 'dajin' || type === 'huangjin9')
    const winnerDelta = isTripleSpecial ? delta * 2 : delta
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
    players[winnerIndex].counts[type] += 1
    losers.forEach(li => { players[li].score -= delta })
    rounds += 1
    const lastOpText = `${players[winnerIndex].name} ${this.labelOf(type)}`
    history.push({ type, winnerIndex, losers, delta, winnerDelta })
    this.setData({ players, rounds, history, lastOpText })
    this.persistCurrent()
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
    const { type, winnerIndex, winners, losers, delta, winnerDelta } = last
    if (type === 'foul') {
      if (Array.isArray(winners)) {
        winners.forEach(wi => { players[wi].score -= (winnerDelta || delta) })
      }
      if (Array.isArray(losers)) {
        losers.forEach(li => {
          players[li].score += delta
          if (players[li].counts.foul > 0) players[li].counts.foul -= 1
        })
      }
    } else {
      players[winnerIndex].score -= (winnerDelta || delta)
      if (players[winnerIndex].counts[type] > 0) players[winnerIndex].counts[type] -= 1
      if (Array.isArray(losers)) {
        losers.forEach(li => { players[li].score += delta })
      }
      if (rounds > 0) rounds -= 1
    }
    const lastOpText = lastOpTextFrom(history, players, this.labelOf.bind(this))
    this.setData({ players, rounds, history, lastOpText })
    this.persistCurrent()
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
    storage.rules.setNineRules(f)
    wx.showToast({ title: '规则已应用', icon: 'none' })
    this.persistCurrent()
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
    this.setData({ players, renameVisible: false, renameIdx: -1, renameValue: '', lastOpText })
    this.persistCurrent()
  },
  onEndMatch() {
    wx.showModal({
      title: '结束比赛',
      content: '结束后比分与局数将重置并写入本地',
      confirmText: '结束', cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const playersSnap = JSON.parse(JSON.stringify(this.data.players))
          const roundsSnap = this.data.rounds
          const finishedAt = Date.now()
          const finishedAtISO = new Date(finishedAt).toISOString()
          const record = {
            mode: this.data.mode,
            rules: this.data.rules,
            rounds: roundsSnap,
            finishedAt,
            finishedAtISO,
            players: playersSnap.map(p => ({ name: p.name, score: p.score, counts: p.counts }))
          }
          this.stopTimer()
          if (this.data.matchId) {
            const id = this.data.matchId
            storage.ongoing.removeById(id)
            storage.nine.setCurrentById(id, null)
            storage.nine.setCurrent(null)
          }
          storage.nine.addHistory(record)
          const init = initState(this.data.mode)
          this.setData({ matchId: null, players: init.players.map(p => ({ ...p, score: 100 })), rounds: 1, history: [], lastOpText: '', elapsedTime: 0, hasStarted: false, isRunning: false, runningSince: 0 })
          this.updateTimerText()
          wx.showToast({ title: '本场数据已保存', icon: 'none' })
        }
      }
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
    if (this.data.matchId) {
      storage.ongoing.removeById(this.data.matchId)
      storage.nine.setCurrentById(this.data.matchId, null)
      storage.nine.setCurrent(null)
    }
    const players = this.data.players.map(p => ({ ...p, score: 100, counts: { foul: 0, normal: 0, xiaojin: 0, dajin: 0, huangjin9: 0 } }))
    this.stopTimer()
    this.setData({ matchId: null, players, rounds: 1, history: [], lastOpText: '', elapsedTime: 0, hasStarted: false, isRunning: false, runningSince: 0 })
    this.updateTimerText()
    wx.showToast({ title: '已重新开始', icon: 'none' })
  },
  startTimer() {
    if (this._timer) return
    let id = this.data.matchId
    if (!id) {
      id = Date.now()
      const match = { id, mode: '九球追分', playersCount: this.data.mode, startTime: this.formatNow() }
      const list = storage.ongoing.add(match)
      this.setData({ matchId: id })
    }
    this.setData({ isRunning: true, hasStarted: true, runningSince: Date.now() })
    this.startIntervalTick()
    this.persistCurrent()
  },
  stopTimer() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
    this.setData({ isRunning: false, runningSince: 0 })
    this.persistCurrent()
  },
  startIntervalTick() {
    if (this._timer) return
    this._timer = setInterval(() => {
      const t = this.data.elapsedTime + 1
      this.setData({ elapsedTime: t })
      this.updateTimerText()
    }, 1000)
  },
  clearTimerInterval() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  },
  updateTimerText() {
    const s = this.data.elapsedTime
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    this.setData({ timerText: `${h}:${m}:${sec}` })
  },
  persistCurrent() {
    if (!this.data.matchId) return
    const payload = {
      mode: this.data.mode,
      rules: this.data.rules,
      players: this.data.players,
      rounds: this.data.rounds,
      history: this.data.history,
      elapsedTime: this.data.elapsedTime,
      hasStarted: this.data.hasStarted,
      isRunning: this.data.isRunning,
      runningSince: this.data.runningSince
    }
    storage.nine.setCurrentById(this.data.matchId, payload)
  },
  restoreCurrent() {
    const id = this.data.matchId
    const mode = this.data.mode
    let rules = storage.rules.getNineRules()
    let saved = id ? storage.nine.getCurrentById(id) : storage.nine.getCurrent()
    if (saved && saved.players && saved.rounds !== undefined) {
      const players = saved.players
      const rounds = saved.rounds
      const history = Array.isArray(saved.history) ? saved.history : []
      const lastOpText = lastOpTextFrom(history, players, this.labelOf.bind(this))
      let elapsedTime = Number(saved.elapsedTime || 0)
      const hasStarted = !!saved.hasStarted
      const isRunning = !!saved.isRunning
      const rsSaved = Number(saved.runningSince || 0)
      if (isRunning && rsSaved) {
        const now = Date.now()
        const delta = Math.floor((now - rsSaved) / 1000)
        if (delta > 0) elapsedTime += delta
        this.setData({ runningSince: now })
      }
      this.setData({ rules, players, rounds, history, lastOpText, elapsedTime, hasStarted, isRunning })
    } else {
      const s = initState(mode)
      this.setData({ rules, players: s.players, rounds: s.rounds, history: s.history, lastOpText: '', elapsedTime: 0, hasStarted: false, isRunning: false, runningSince: 0 })
    }
    this.updateTimerText()
    if (this.data.isRunning) {
      this.startIntervalTick()
      this.persistCurrent()
    }
  },
  onHide() { this.clearTimerInterval() },
  onShow() {
    if (this.data.isRunning && this.data.hasStarted) {
      const now = Date.now()
      const rs = Number(this.data.runningSince || 0)
      if (rs) {
        const delta = Math.floor((now - rs) / 1000)
        if (delta > 0) {
          const t = this.data.elapsedTime + delta
          this.setData({ elapsedTime: t, runningSince: now })
          this.updateTimerText()
        } else {
          this.setData({ runningSince: now })
        }
      } else {
        this.setData({ runningSince: now })
      }
      this.startIntervalTick()
      this.persistCurrent()
    }
  },
  onUnload() { this.clearTimerInterval() },
  formatNow() {
    const d = new Date()
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
})
