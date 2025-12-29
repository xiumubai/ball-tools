const storage = require('../../utils/storage')

const typeLabelMap = {
  foul: '犯规',
  normal: '普胜',
  jieqing: '接清',
  zhaqing: '炸清',
}

function initPlayers() {
  return {
    A: { score: 0, foul: 0, normal: 0, jieqing: 0, zhaqing: 0 },
    B: { score: 0, foul: 0, normal: 0, jieqing: 0, zhaqing: 0 },
  }
}

function isScoring(type) {
  return type === 'normal' || type === 'jieqing' || type === 'zhaqing'
}

Page({
  data: {
    avatars: {
      A: '/images/zhongba_active.png',
      B: '/images/zhuifen_active.png',
    },
    names: { A: 'A玩家', B: 'B玩家' },
    players: initPlayers(),
    selectedPlayer: 'A',
    rounds: 0,
    history: [],
    lastOpText: '',
    renameVisible: false,
    renameTarget: '',
    renameValue: '',
    
    elapsedTime: 0,
    isRunning: false,
    runningSince: 0,
    hasStarted: false,
    timerText: '00:00:00',
    
    matchId: null,
    modeLabel: '中式黑八',
    scoreAnimA: '',
    scoreAnimB: ''
  },
  onLoad(options) {
    const id = options && options.matchId ? Number(options.matchId) : null
    const isNew = options && (options.new === '1' || options.new === 1 || options.new === true)
    this.setData({ matchId: id })
    if (id) {
      const list = storage.ongoing.getList()
      const item = (Array.isArray(list) ? list : []).find(v => v && v.id === id)
      if (item && item.mode) this.setData({ modeLabel: item.mode })
      this.restoreCurrent()
    } else if (isNew) {
      this.setData({ names: { A: 'A玩家', B: 'B玩家' }, players: initPlayers(), rounds: 0, history: [], lastOpText: '', elapsedTime: 0, hasStarted: false, isRunning: false, runningSince: 0 })
    } else {
      this.restoreCurrent()
    }
    this.updateTimerText()
  },
  selectA() {
    this.setData({ selectedPlayer: 'A' })
  },
  selectB() {
    this.setData({ selectedPlayer: 'B' })
  },
  onOp(e) {
    const type = e.currentTarget.dataset.type
    const player = this.data.selectedPlayer
    this.applyOp(player, type)
  },
  applyOp(player, type) {
    if (!this.data.hasStarted) {
      wx.showToast({ title: '请先点击开始', icon: 'none' })
      return
    }
    const players = JSON.parse(JSON.stringify(this.data.players))
    let rounds = this.data.rounds
    const history = this.data.history.slice()
    players[player][type] += 1
    if (isScoring(type)) {
      players[player].score += 1
      rounds += 1
    }
    history.push({ codePlayer: player, type })
    const labelPlayer = player === 'A' ? this.data.names.A : this.data.names.B
    const lastOpText = `${labelPlayer} ${typeLabelMap[type]}`
    const scoreAnimA = player === 'A' && isScoring(type) ? 'animate-score' : ''
    const scoreAnimB = player === 'B' && isScoring(type) ? 'animate-score' : ''
    this.setData({ players, rounds, history, lastOpText, scoreAnimA, scoreAnimB })
    this.persistCurrent()
    wx.showToast({ title: lastOpText, icon: 'none' })
    
  },
  onUndo() {
    if (!this.data.history.length) return
    const history = this.data.history.slice()
    const last = history.pop()
    const players = JSON.parse(JSON.stringify(this.data.players))
    let rounds = this.data.rounds
    const p = last.codePlayer
    const t = last.type
    if (players[p][t] > 0) players[p][t] -= 1
    if (isScoring(t) && players[p].score > 0) {
      players[p].score -= 1
      if (rounds > 0) rounds -= 1
    }
    const lastOpText = history.length
      ? `${history[history.length - 1].codePlayer === 'A' ? this.data.names.A : this.data.names.B} ${typeLabelMap[history[history.length - 1].type]}`
      : ''
    this.setData({ players, rounds, history, lastOpText })
    this.persistCurrent()
    wx.showToast({ title: `已撤销：${last.codePlayer === 'A' ? this.data.names.A : this.data.names.B} ${typeLabelMap[last.type]}`, icon: 'none' })
  },
  
  onToggleTimer() {
    if (this.data.isRunning) this.stopTimer()
    else this.startTimer()
  },
  startTimer() {
    if (this._timer) return
    let id = this.data.matchId
    if (!id) {
      id = Date.now()
      const match = { id, mode: '中式黑八', playersCount: 2, startTime: this.formatNow() }
      const list = storage.ongoing.add(match)
      this.setData({ matchId: id, modeLabel: match.mode })
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
    const players = this.data.players
    const payload = {
      names: this.data.names,
      players: {
        A: players.A,
        B: players.B,
      },
      rounds: this.data.rounds,
      history: this.data.history.map(h => ({ codePlayer: h.codePlayer, type: h.type })),
      elapsedTime: this.data.elapsedTime,
      hasStarted: this.data.hasStarted,
      isRunning: this.data.isRunning,
      runningSince: this.data.runningSince
    }
    storage.eight.setCurrentById(this.data.matchId, payload)
  },
  restoreCurrent() {
    const id = this.data.matchId
    let saved = id ? storage.eight.getCurrentById(id) : storage.eight.getCurrent()
    if (saved && saved.players && saved.rounds !== undefined) {
      const names = saved.names || { A: 'A玩家', B: 'B玩家' }
      const players = saved.players.A && saved.players.B
        ? saved.players
        : {
            A: (saved.players[names.A]) || { score: 0, foul: 0, normal: 0, jieqing: 0, zhaqing: 0 },
            B: (saved.players[names.B]) || { score: 0, foul: 0, normal: 0, jieqing: 0, zhaqing: 0 },
          }
      const history = Array.isArray(saved.history)
        ? saved.history.map(h => (
            h.codePlayer
              ? { codePlayer: h.codePlayer, type: h.type }
              : { codePlayer: h.player === names.A ? 'A' : 'B', type: h.type }
          ))
        : []
      const lastOpText = history.length
        ? `${history[history.length - 1].codePlayer === 'A' ? names.A : names.B} ${typeLabelMap[history[history.length - 1].type]}`
        : ''
      let elapsedTime = Number(saved.elapsedTime || 0)
      const hasStarted = !!saved.hasStarted
      const isRunning = !!saved.isRunning
      const runningSinceSaved = Number(saved.runningSince || 0)
      if (isRunning && runningSinceSaved) {
        const now = Date.now()
        const delta = Math.floor((now - runningSinceSaved) / 1000)
        if (delta > 0) elapsedTime += delta
        this.setData({ runningSince: now })
      }
      this.setData({ names, players, rounds: saved.rounds, history, lastOpText, elapsedTime, hasStarted, isRunning })
    } else {
      this.setData({ names: { A: 'A玩家', B: 'B玩家' }, players: initPlayers(), rounds: 0, history: [], lastOpText: '', elapsedTime: 0, hasStarted: false, isRunning: false, runningSince: 0 })
    }
    this.updateTimerText()
    if (this.data.isRunning) {
      this.startIntervalTick()
      this.persistCurrent()
    }
  },
  formatNow() {
    const d = new Date()
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  },
  onRenameStart(e) {
    const target = e.currentTarget.dataset.target
    const value = this.data.names[target]
    this.setData({ renameVisible: true, renameTarget: target, renameValue: value })
  },
  onRenameInput(e) {
    this.setData({ renameValue: e.detail.value })
  },
  onRenameCancel() {
    this.setData({ renameVisible: false, renameTarget: '', renameValue: '' })
  },
  onRenameSave() {
    const val = (this.data.renameValue || '').trim()
    const reg = /^[\u4e00-\u9fa5]{1,4}$/
    if (!reg.test(val)) {
      wx.showToast({ title: '仅支持中文，最多4字', icon: 'none' })
      return
    }
    const names = { ...this.data.names }
    names[this.data.renameTarget] = val
    let lastOpText = this.data.lastOpText
    if (this.data.history.length) {
      const last = this.data.history[this.data.history.length - 1]
      const label = last.codePlayer === 'A' ? names.A : names.B
      lastOpText = `${label} ${typeLabelMap[last.type]}`
    }
    this.setData({ names, renameVisible: false, renameTarget: '', renameValue: '', lastOpText })
    this.persistCurrent()
  },
  onEndMatch() {
    if (!this.data.hasStarted) {
      wx.showToast({ title: '请先点击开始', icon: 'none' })
      return
    }
    wx.showModal({
      title: '结束比赛',
      content: '确认结束并比赛吗？',
      confirmText: '结束',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const names = this.data.names
          const playersSnap = JSON.parse(JSON.stringify(this.data.players))
          const roundsSnap = this.data.rounds
          const elapsedSnap = this.data.elapsedTime
          const finishedAt = Date.now()
          const finishedAtISO = new Date(finishedAt).toISOString()

          this.stopTimer()

          if (this.data.matchId) {
            const id = this.data.matchId
            storage.ongoing.removeById(id)
            storage.eight.setCurrentById(id, null)
            storage.eight.setCurrent(null)
            const record = {
              players: {
                [names.A]: playersSnap.A,
                [names.B]: playersSnap.B,
              },
              rounds: roundsSnap,
              finishedAt,
              finishedAtISO,
              names,
              elapsedTime: elapsedSnap
            }
            storage.eight.addHistory(record)
          }

          const resetPlayers = initPlayers()
          this.setData({ matchId: null, players: resetPlayers, rounds: 0, history: [], lastOpText: '', elapsedTime: 0, hasStarted: false, isRunning: false, runningSince: 0 })
          this.updateTimerText()
          this.persistCurrent()
          wx.showToast({ title: '比赛已结束', icon: 'none' })
        }
      }
    })
  },
  onRestart() {
    const inProgress = this.data.hasStarted || this.data.rounds > 0 || this.data.history.length > 0
    if (!inProgress) {
      this.doRestart()
      return
    }
    wx.showModal({
      title: '重新开始',
      content: '本次比赛作废，比分与局数将重置且不保存',
      confirmText: '重新开始',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.doRestart()
        }
      }
    })
  },
  doRestart() {
    const id = this.data.matchId
    if (id) {
      storage.ongoing.removeById(id)
      storage.eight.setCurrentById(id, null)
      storage.eight.setCurrent(null)
    }
    const resetPlayers = initPlayers()
    this.stopTimer()
    this.setData({ matchId: null, players: resetPlayers, rounds: 0, history: [], lastOpText: '', elapsedTime: 0, hasStarted: false, isRunning: false, runningSince: 0, modeLabel: '中式黑八' })
    this.updateTimerText()
    wx.showToast({ title: '已重新开始', icon: 'none' })
  },
  onHide() {
    this.clearTimerInterval()
  },
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
  onUnload() {
    this.clearTimerInterval()
  }
})
