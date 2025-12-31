const storage = require('../../utils/storage')
Page({
  data: {
    days: [],
    summary: { totalTimeText: '00:00:00', totalSessions: 0 }
  },
  onLoad() { this.loadData() },
  onShow() { this.loadData() },
  formatTime(sec) {
    const s = Number(sec || 0)
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${h}:${m}:${ss}`
  },
  formatHM(ts) {
    const d = new Date(Number(ts || 0))
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  },
  formatDate(ts) {
    const d = new Date(Number(ts || 0))
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },
  loadData() {
    const hist = storage.play.getHistory()
    const map = {}
    let totalSec = 0
    let totalCount = 0
    ;(Array.isArray(hist) ? hist : []).forEach(r => {
      const date = this.formatDate(r.startedAt)
      const dur = Number(r.elapsedSeconds || 0)
      if (!map[date]) map[date] = { date, totalSec: 0, count: 0, sessions: [] }
      map[date].sessions.push({ id: r.startedAt, start: this.formatHM(r.startedAt), end: this.formatHM(r.finishedAt), duration: this.formatTime(dur) })
      map[date].totalSec += dur
      map[date].count += 1
      totalSec += dur
      totalCount += 1
    })
    const days = Object.values(map).sort((a,b) => (new Date(b.date)).getTime() - (new Date(a.date)).getTime()).map(d => ({
      date: d.date,
      count: d.count,
      totalText: this.formatTime(d.totalSec),
      sessions: d.sessions.sort((a,b) => b.id - a.id)
    }))
    const summary = { totalTimeText: this.formatTime(totalSec), totalSessions: totalCount }
    this.setData({ days, summary })
  }
})
