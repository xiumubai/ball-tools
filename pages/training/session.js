const storage = require('../../utils/storage')
Page({
  data: {
    modeId: null,
    modeName: '',
    hits: 0,
    misses: 0,
    hasStarted: false,
    isRunning: false,
    elapsedTime: 0,
    runningSince: 0,
    timerText: '00:00:00',
    accuracyText: '0%'
  },
  onLoad(options) {
    const modeId = options && options.modeId ? Number(options.modeId) : null
    const modeName = options && options.modeName ? decodeURIComponent(options.modeName) : ''
    this.setData({ modeId, modeName })
    this.restoreCurrent()
    this.updateTimerText()
    this.updateAccuracy()
  },
  updateTimerText() {
    const s = Number(this.data.elapsedTime || 0)
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    this.setData({ timerText: `${h}:${m}:${sec}` })
  },
  updateAccuracy() {
    const hits = Number(this.data.hits || 0)
    const misses = Number(this.data.misses || 0)
    const total = hits + misses
    const acc = total ? Math.round((hits / total) * 100) : 0
    this.setData({ accuracyText: `${acc}%` })
  },
  toggleTimer() {
    if (this.data.isRunning) this.stopTimer()
    else this.startTimer()
  },
  startTimer() {
    if (this._timer) return
    const now = Date.now()
    this.setData({ isRunning: true, hasStarted: true, runningSince: now })
    this.startInterval()
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
  startInterval() {
    if (this._timer) return
    this._timer = setInterval(() => {
      const t = Number(this.data.elapsedTime || 0) + 1
      this.setData({ elapsedTime: t })
      this.updateTimerText()
    }, 1000)
  },
  clearIntervalTick() {
    if (this._timer) { clearInterval(this._timer); this._timer = null }
  },
  addHit() {
    if (!this.data.hasStarted) { wx.showToast({ title: '请先点击开始', icon: 'none' }); return }
    const n = Number(this.data.hits || 0) + 1
    this.setData({ hits: n })
    this.updateAccuracy()
    this.persistCurrent()
  },
  addMiss() {
    if (!this.data.hasStarted) { wx.showToast({ title: '请先点击开始', icon: 'none' }); return }
    const n = Number(this.data.misses || 0) + 1
    this.setData({ misses: n })
    this.updateAccuracy()
    this.persistCurrent()
  },
  endSession() {
    const hits = Number(this.data.hits || 0)
    const misses = Number(this.data.misses || 0)
    const total = hits + misses
    const acc = total ? Math.round((hits / total) * 100) : 0
    const elapsed = Number(this.data.elapsedTime || 0)
    const finishedAt = Date.now()
    const startedAt = finishedAt - (elapsed * 1000)
    const record = { modeId: this.data.modeId, modeName: this.data.modeName, hits, misses, accuracy: acc, elapsedSeconds: elapsed, startedAt, finishedAt }
    const hist = storage.training.addHistory(record)
    this.clearIntervalTick()
    this.setData({ hasStarted: false, isRunning: false, runningSince: 0, elapsedTime: 0, hits: 0, misses: 0 })
    this.updateTimerText()
    this.updateAccuracy()
    storage.training.setCurrentById(this.data.modeId, null)
    wx.showToast({ title: '已保存训练记录', icon: 'none' })
  },
  restart() {
    this.clearIntervalTick()
    this.setData({ hasStarted: false, isRunning: false, runningSince: 0, elapsedTime: 0, hits: 0, misses: 0 })
    this.updateTimerText()
    this.updateAccuracy()
    storage.training.setCurrentById(this.data.modeId, null)
    wx.showToast({ title: '已重置', icon: 'none' })
  },
  persistCurrent() {
    if (this.data.isRunning) {
      this.setData({ runningSince: Date.now() })
    }
    const payload = {
      modeId: this.data.modeId,
      modeName: this.data.modeName,
      hits: this.data.hits,
      misses: this.data.misses,
      hasStarted: this.data.hasStarted,
      isRunning: this.data.isRunning,
      runningSince: this.data.runningSince,
      elapsedTime: this.data.elapsedTime
    }
    storage.training.setCurrentById(this.data.modeId, payload)
  },
  restoreCurrent() {
    const saved = storage.training.getCurrentById(this.data.modeId)
    if (saved && saved.modeId === this.data.modeId) {
      let { hits, misses, hasStarted, isRunning, runningSince, elapsedTime } = saved
      if (isRunning && runningSince) {
        const now = Date.now()
        const delta = Math.floor((now - Number(runningSince)) / 1000)
        if (delta > 0) elapsedTime = Number(elapsedTime || 0) + delta
        this.setData({ runningSince: now })
        this.startInterval()
      }
      this.setData({ hits: Number(hits || 0), misses: Number(misses || 0), hasStarted: !!hasStarted, isRunning: !!isRunning, elapsedTime: Number(elapsedTime || 0) })
    }
  },
  onShow() {
    this.restoreCurrent()
  },
  onHide() { 
    this.persistCurrent()
    this.clearIntervalTick() 
  },
  onUnload() { 
    this.persistCurrent()
    this.clearIntervalTick() 
  }
})
