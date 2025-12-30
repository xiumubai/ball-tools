const storage = require('../../utils/storage')

Page({
  data: {
    avatars: {
      A: '/images/zhongba_active.png',
      B: '/images/zhongba_active.png',
    },
    zhuifenAvatars: ['/images/zhuifen_active.png','/images/zhuifen_active.png','/images/zhuifen_active.png'],
    filterTab: 'all',
    matches: [],
    displayMatches: [],
    stats: { total: 0, wins: 0, losses: 0, winRate: '0%' },
  },
  onLoad() {
    this.loadData()
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected(2)
    }
    this.loadData()
  },
  switchFilter(e) {
    const val = e.currentTarget.dataset.val || 'all'
    const list = this.filterMatches(val)
    const stats = this.computeStats(list)
    this.setData({ filterTab: val, displayMatches: list, stats })
  },
  onTabChange(e) {
    const val = (e.detail && (e.detail.value || e.detail.name)) || 'all'
    const list = this.filterMatches(val)
    const stats = this.computeStats(list)
    this.setData({ filterTab: val, displayMatches: list, stats })
  },
  filterMatches(val) {
    const list = this.data.matches || []
    if (val === '8ball' || val === 'eight') return list.filter(v => v.type === '8球')
    if (val === '9ball' || val === 'nine') return list.filter(v => v.type === '9球')
    return list
  },
  loadData() {
    const eight = storage.eight.getHistory()
    const nine = storage.nine.getHistory()

    console.log(eight, nine);
    
    const formatted = []

    eight.forEach((r, idx) => {
      const names = (r.names) || { A: 'A玩家', B: 'B玩家' }
      const a = (r.players && (r.players[names.A] || r.players.A)) || { score: 0, foul: 0, normal: 0, jieqing: 0, zhaqing: 0 }
      const b = (r.players && (r.players[names.B] || r.players.B)) || { score: 0, foul: 0, normal: 0, jieqing: 0, zhaqing: 0 }
      const ts = r.finishedAt || (r.finishedAtISO ? Date.parse(r.finishedAtISO) : Date.now())
      const d = new Date(ts)
      const date = d.toISOString().split('T')[0]
      const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
      formatted.push({
        id: ts + idx + 10000,
        ts,
        type: '8球',
        date,
        time,
        totalRounds: r.rounds || 0,
        players: [
          { name: names.A, score: a.score, stats: { normalWin: a.normal, clearWin: a.jieqing, breakClear: a.zhaqing, fouls: a.foul } },
          { name: names.B, score: b.score, stats: { normalWin: b.normal, clearWin: b.jieqing, breakClear: b.zhaqing, fouls: b.foul } },
        ],
      })
    })

    nine.forEach((r, idx) => {
      const ts = r.finishedAt || (r.finishedAtISO ? Date.parse(r.finishedAtISO) : Date.now())
      const d = new Date(ts)
      const date = d.toISOString().split('T')[0]
      const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
      const players = Array.isArray(r.players) ? r.players.map(p => ({
        name: p.name,
        score: p.score,
        stats: { normalWin: p.counts && p.counts.normal, smallGold: p.counts && p.counts.xiaojin, bigGold: p.counts && p.counts.dajin, golden9: p.counts && p.counts.huangjin9, fouls: p.counts && p.counts.foul }
      })) : []
      formatted.push({ id: ts + idx, ts, type: '9球', date, time, totalRounds: r.rounds || 0, players })
    })

    formatted.sort((a,b) => b.ts - a.ts)

    const stats = this.computeStats(formatted)
    const display = (this.data.filterTab === 'all') ? formatted : formatted.filter(v => (
      this.data.filterTab === '8ball' || this.data.filterTab === 'eight') ? v.type === '8球' : v.type === '9球'
    )
    this.setData({ matches: formatted, displayMatches: display, stats })
  },
  computeStats(list) {
    const validList = Array.isArray(list) ? list : []
    const total = validList.length
    let wins = 0
    let losses = 0
    validList.forEach(m => {
      const players = Array.isArray(m.players) ? m.players : []
      const p0 = players[0]
      const p1 = players[1]
      if (p0 && p1 && typeof p0.score === 'number' && typeof p1.score === 'number') {
        if (p0.score > p1.score) wins++
        else if (p0.score < p1.score) losses++
      }
    })
    const winRate = total ? `${Math.round((wins / total) * 100)}%` : '0%'
    return { total, wins, losses, winRate }
  },
  onPullDownRefresh() {
    this.loadData()
    wx.stopPullDownRefresh()
  },
  onSwipeDelete(e) {
    const id = e.currentTarget.dataset.id
    const ts = Number(e.currentTarget.dataset.ts)
    const type = e.currentTarget.dataset.type
    if (!ts || !type) return
    wx.showModal({
      title: '删除记录',
      content: '确认删除该比赛记录？',
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return
        if (type === '8球') storage.eight.removeHistoryByTs(ts)
        else storage.nine.removeHistoryByTs(ts)
        this.loadData()
        wx.showToast({ title: '已删除', icon: 'none' })
      }
    })
  }
})
