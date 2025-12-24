const STORAGE_CURRENT = 'zhongba_match_current'
const STORAGE_HISTORY = 'zhongba_match_history'

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
  },
  onLoad() {
    this.restoreCurrent()
  },
  handleRecord() {
    wx.navigateTo({ url: '/pages/history/history' })
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
    this.setData({ players, rounds, history, lastOpText })
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
  persistCurrent() {
    const players = this.data.players
    const payload = {
      names: this.data.names,
      players: {
        A: players.A,
        B: players.B,
      },
      rounds: this.data.rounds,
      history: this.data.history.map(h => ({ codePlayer: h.codePlayer, type: h.type })),
    }
    try {
      wx.setStorageSync(STORAGE_CURRENT, payload)
    } catch (e) {}
  },
  restoreCurrent() {
    let saved = null
    try {
      saved = wx.getStorageSync(STORAGE_CURRENT)
    } catch (e) {}
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
      this.setData({ names, players, rounds: saved.rounds, history, lastOpText })
    } else {
      this.setData({ names: { A: 'A玩家', B: 'B玩家' }, players: initPlayers(), rounds: 0, history: [], lastOpText: '' })
      this.persistCurrent()
    }
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
    wx.showModal({
      title: '结束比赛',
      content: '结束后比分将清零并写入本地存储',
      confirmText: '结束',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.finishMatch()
        }
      }
    })
  },
  onRestart() {
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
    const resetPlayers = initPlayers()
    this.setData({ players: resetPlayers, rounds: 0, history: [], lastOpText: '' })
    this.persistCurrent()
    wx.showToast({ title: '已重新开始', icon: 'none' })
  },
  finishMatch() {
    const players = this.data.players
    const rounds = this.data.rounds
    const names = this.data.names
    const record = {
      players: {
        [names.A]: players.A,
        [names.B]: players.B,
      },
      rounds,
      finishedAt: Date.now(),
      finishedAtISO: new Date().toISOString(),
      names,
    }
    let historyList = []
    try {
      const h = wx.getStorageSync(STORAGE_HISTORY)
      if (Array.isArray(h)) historyList = h
    } catch (e) {}
    historyList.push(record)
    try {
      wx.setStorageSync(STORAGE_HISTORY, historyList)
    } catch (e) {}
    const resetPlayers = initPlayers()
    this.setData({ players: resetPlayers, rounds: 0, history: [], lastOpText: '' })
    this.persistCurrent()
    wx.showToast({ title: '本场数据已保存', icon: 'none' })
  }
})
