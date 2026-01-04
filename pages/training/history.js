const storage = require('../../utils/storage')
Page({
  data: {
    modes: [],
    selectedModeId: null,
    selectedModeName: '',
    sessions: [],
    summary: { totalSessions: 0, totalTimeText: '00:00:00', totalHits: 0, totalMisses: 0, accuracyText: '0%' },
    modesSummary: []
  },
  onLoad(options) {
    if (options && options.modeId) {
      this.setData({ selectedModeId: Number(options.modeId) })
    }
    this.loadModes(); 
    this.loadData() 
  },
  onShow() { this.loadModes(); this.loadData() },
  formatTime(sec) {
    const s = Number(sec || 0)
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${h}:${m}:${ss}`
  },
  loadModes() {
    let modes = storage.training.getModes()
    if (!Array.isArray(modes) || modes.length === 0) {
      const histAll = storage.training.getHistory()
      const map = {}
      ;(Array.isArray(histAll) ? histAll : []).forEach(r => {
        const id = r.modeId
        if (id && !map[id]) map[id] = { id, name: r.modeName || '未命名' }
      })
      modes = Object.values(map)
    }
    let selectedModeId = this.data.selectedModeId
    const modeList = Array.isArray(modes) ? modes : []
    let sel = modeList.find(m => m.id === selectedModeId)
    if (!sel && modeList.length) {
      selectedModeId = modeList[0].id
      sel = modeList[0]
    }
    this.setData({ modes: modeList, selectedModeId, selectedModeName: sel ? sel.name : '' })
  },
  loadData() {
    const histAll = storage.training.getHistory()
    const filterId = this.data.selectedModeId
    const hist = (Array.isArray(histAll) ? histAll : []).filter(r => !filterId || r.modeId === filterId)
    const sessions = []
    let totalHits = 0
    let totalMisses = 0
    let totalTime = 0
    const map = {}
    ;(Array.isArray(hist) ? hist : []).forEach(r => {
      const ts = r.finishedAt || Date.now()
      const d = new Date(ts)
      const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
      const item = {
        id: ts,
        modeId: r.modeId,
        modeName: r.modeName,
        date,
        time,
        hits: Number(r.hits || 0),
        misses: Number(r.misses || 0),
        elapsedText: this.formatTime(Number(r.elapsedSeconds || 0)),
        accuracyText: `${Math.round(((Number(r.hits||0)) / ((Number(r.hits||0)) + (Number(r.misses||0)) || 1)) * 100)}%`
      }
      sessions.push(item)
      totalHits += item.hits
      totalMisses += item.misses
      totalTime += Number(r.elapsedSeconds || 0)
    })
    sessions.sort((a,b) => b.id - a.id)
    const totalSessions = sessions.length
    const accuracy = (totalHits + totalMisses) ? Math.round((totalHits / (totalHits + totalMisses)) * 100) : 0
    const modesSummary = (() => {
      const mapAll = {}
      ;(Array.isArray(hist) ? hist : []).forEach(r => {
        const key = r.modeId || 'unknown'
        if (!mapAll[key]) mapAll[key] = { modeId: key, modeName: r.modeName || '未命名', sessionsCount: 0, hits: 0, misses: 0, totalTimeSec: 0 }
        mapAll[key].sessionsCount += 1
        mapAll[key].hits += Number(r.hits || 0)
        mapAll[key].misses += Number(r.misses || 0)
        mapAll[key].totalTimeSec += Number(r.elapsedSeconds || 0)
      })
      return Object.values(mapAll).map(m => ({
        modeId: m.modeId,
        modeName: m.modeName,
        sessionsCount: m.sessionsCount,
        hits: m.hits,
        misses: m.misses,
        totalTimeText: this.formatTime(m.totalTimeSec),
        accuracyText: (m.hits + m.misses) ? `${Math.round((m.hits / (m.hits + m.misses)) * 100)}%` : '0%'
      }))
    })()
    const summary = { totalSessions, totalTimeText: this.formatTime(totalTime), totalHits, totalMisses, accuracyText: `${accuracy}%` }
    this.setData({ sessions, summary, modesSummary })
  },
  switchMode(e) {
    const id = Number(e.currentTarget.dataset.id)
    const sel = (this.data.modes || []).find(m => m.id === id)
    this.setData({ selectedModeId: id, selectedModeName: sel ? sel.name : '' })
    this.loadData()
  },
  deleteItem(e) {
    const id = Number(e.currentTarget.dataset.id)
    if (!id) return
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条训练记录吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          storage.training.removeHistoryByTs(id)
          this.loadData()
          wx.showToast({ title: '已删除', icon: 'none' })
        }
      }
    })
  }
})
