const storage = require('../../utils/storage')
Page({
  data: {
    ongoingMatches: []
  },
  onLoad() {
    this.refreshOngoing()
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected(1)
    }
    this.refreshOngoing()
  },
  refreshOngoing() {
    const list = storage.ongoing.getList()
    this.setData({ ongoingMatches: list })
  },
  formatNow() {
    const d = new Date()
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  },
  startEightBall() {
    wx.navigateTo({ url: `/pages/eight-ball/eight-ball?new=1` })
  },
  startNineBall() {
    wx.navigateTo({ url: `/pages/nine-ball/nine-ball?new=1&players=2` })
  },
  startNineBallThree() {
    wx.navigateTo({ url: `/pages/nine-ball/nine-ball?new=1&players=3` })
  },
  continueMatch(e) {
    const id = Number(e.currentTarget.dataset.id)
    const item = (this.data.ongoingMatches || []).find(v => v.id === id)
    if (!item) return
    const url = item.mode === '中式黑八' ? '/pages/eight-ball/eight-ball' : '/pages/nine-ball/nine-ball'
    wx.navigateTo({ url: `${url}?matchId=${id}` })
  },
  deleteMatch(e) {
    const id = Number(e.currentTarget.dataset.id)
    wx.showModal({
      title: '提示',
      content: '确认删除该比赛？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          const list = storage.ongoing.removeById(id)
          this.setData({ ongoingMatches: list })
        }
      }
    })
  }
})
