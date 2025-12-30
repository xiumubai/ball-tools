const storage = require('../../utils/storage')

Page({
  data: {
    type: '',
    date: '',
    time: '',
    totalRounds: 0,
    players: [],
    maxScore: 0,
    seg: 'stats',
    statsRows: []
  },
  onLoad(options) {
    console.log(options);
    
    const type = options && options.type ? decodeURIComponent(options.type) : ''
    const ts = options && options.ts ? Number(options.ts) : 0
    this.loadRecord(type, ts)
  },
  loadRecord(type, ts) {
    let record = null
    if (type === '8球') {
      const list = storage.eight.getHistory()
      console.log(list);
      record = (Array.isArray(list) ? list : []).find(r => {
        const t = r && (r.finishedAt || (r.finishedAtISO ? Date.parse(r.finishedAtISO) : 0))
        return t === ts
      }) || null
      if (record) {
        const names = record.names || { A: 'A玩家', B: 'B玩家' }
        const a = (record.players && (record.players[names.A] || record.players.A)) || { score: 0, foul: 0, normal: 0, jieqing: 0, zhaqing: 0 }
        const b = (record.players && (record.players[names.B] || record.players.B)) || { score: 0, foul: 0, normal: 0, jieqing: 0, zhaqing: 0 }
        const d = new Date(record.finishedAt || (record.finishedAtISO ? Date.parse(record.finishedAtISO) : Date.now()))
        const date = d.toISOString().split('T')[0]
        const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
        const players = [
          { name: names.A, score: a.score, counts: { normal: a.normal, jieqing: a.jieqing, zhaqing: a.zhaqing, foul: a.foul } },
          { name: names.B, score: b.score, counts: { normal: b.normal, jieqing: b.jieqing, zhaqing: b.zhaqing, foul: b.foul } }
        ]
        const maxScore = Math.max.apply(null, players.map(p => p.score))
        const statsRows = [
          { label: '普胜', values: players.map(p => p.counts.normal || 0) },
          { label: '接清', values: players.map(p => p.counts.jieqing || 0) },
          { label: '炸清', values: players.map(p => p.counts.zhaqing || 0) },
          { label: '犯规', values: players.map(p => p.counts.foul || 0) }
        ]
        this.setData({ type, date, time, totalRounds: record.rounds || 0, players, maxScore, statsRows })
      }
    } else {
      const list = storage.nine.getHistory()
      record = (Array.isArray(list) ? list : []).find(r => {
        const t = r && (r.finishedAt || (r.finishedAtISO ? Date.parse(r.finishedAtISO) : 0))
        return t === ts
      }) || null
      if (record) {
        const d = new Date(record.finishedAt || (record.finishedAtISO ? Date.parse(record.finishedAtISO) : Date.now()))
        const date = d.toISOString().split('T')[0]
        const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
        const players = Array.isArray(record.players) ? record.players.map(p => ({
          name: p.name,
          score: p.score,
          counts: {
            normal: p.counts && p.counts.normal,
            xiaojin: p.counts && p.counts.xiaojin,
            dajin: p.counts && p.counts.dajin,
            huangjin9: p.counts && p.counts.huangjin9,
            foul: p.counts && p.counts.foul
          }
        })) : []
        const maxScore = players.length ? Math.max.apply(null, players.map(p => p.score)) : 0
        const statsRows = [
          { label: '普胜', values: players.map(p => p.counts.normal || 0) },
          { label: '小金', values: players.map(p => p.counts.xiaojin || 0) },
          { label: '大金', values: players.map(p => p.counts.dajin || 0) },
          { label: '黄金9', values: players.map(p => p.counts.huangjin9 || 0) },
          { label: '犯规', values: players.map(p => p.counts.foul || 0) }
        ]
        this.setData({ type: '9球', date, time, totalRounds: record.rounds || 0, players, maxScore, statsRows })
      }
    }
  },
  switchSeg(e) {
    const val = e.currentTarget.dataset.val || 'stats'
    this.setData({ seg: val })
  }
})
