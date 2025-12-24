const STORAGE_HISTORY = 'zhongba_match_history'
const STORAGE_ZHUIFEN_HISTORY = 'zhuifen_match_history'
const { formatTime } = require('../../utils/util.js')

function ensurePlayer(p) {
  return p || { score: 0, foul: 0, normal: 0, jieqing: 0, zhaqing: 0 }
}

Page({
  data: {
    avatars: {
      A: '/images/zhongba_active.png',
      B: '/images/zhuifen_active.png',
    },
    zhuifenAvatars: ['/images/zhuifen_active.png','/images/zhuifen_active.png','/images/zhuifen_active.png'],
    tab: 'zhongba',
    zhongbaRecords: [],
    zhuifenRecords: [],
  },
  onLoad() {
    this.loadHistory()
  },
  switchTab(e) {
    const kind = e.currentTarget.dataset.kind
    this.setData({ tab: kind })
  },
  loadHistory() {
    let listZ = []
    try {
      const h = wx.getStorageSync(STORAGE_HISTORY)
      if (Array.isArray(h)) listZ = h
    } catch (e) {}
    const zhongbaRecords = listZ.map((r) => {
      const names = r.names || { A: 'A玩家', B: 'B玩家' }
      const a = ensurePlayer(r.players && r.players[names.A])
      const b = ensurePlayer(r.players && r.players[names.B])
      let timeText = ''
      if (r.finishedAtISO) {
        timeText = r.finishedAtISO.replace('T', ' ').slice(0, 19)
      } else if (r.finishedAt) {
        timeText = formatTime(new Date(r.finishedAt))
      }
      return {
        playersA: a,
        playersB: b,
        rounds: r.rounds || 0,
        timeText,
        names,
      }
    }).reverse()

    let listF = []
    try {
      const hf = wx.getStorageSync(STORAGE_ZHUIFEN_HISTORY)
      if (Array.isArray(hf)) listF = hf
    } catch (e) {}
    const zhuifenRecords = listF.map((r) => {
      let timeText = ''
      if (r.finishedAtISO) {
        timeText = r.finishedAtISO.replace('T', ' ').slice(0, 19)
      } else if (r.finishedAt) {
        timeText = formatTime(new Date(r.finishedAt))
      }
      return {
        mode: r.mode === 3 ? 3 : 2,
        rounds: r.rounds || 0,
        timeText,
        players: Array.isArray(r.players) ? r.players : [],
      }
    }).reverse()
    this.setData({ zhongbaRecords, zhuifenRecords })
  }
})
