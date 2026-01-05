// pages/index/index.js
const storage = require('../../utils/storage')
Page({

  data: {
    playingIsRunning: false,
    playingElapsed: 0,
    playingRunningSince: 0,
    playingText: '00:00:00',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected(0)
    }
    this.restorePlay()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '追分王 - 记录暴击好兄弟的每一天',
      path: '/pages/index/index',
      imageUrl: '/images/nine.png'
    }
  },
  onShareTimeline() {
    return {
      title: '追分王 - 记录暴击好兄弟的每一天',
      query: '',
      imageUrl: '/images/nine.png'
    }
  },
  goMatchBall() {
    wx.switchTab({ url: '/pages/match/match' })
  },
  restorePlay() {
    const cur = storage.play.getCurrent()
    let { isRunning, runningSince, elapsedTime } = cur || { isRunning: false, runningSince: 0, elapsedTime: 0 }
    if (isRunning && runningSince) {
      const now = Date.now()
      const delta = Math.floor((now - Number(runningSince)) / 1000)
      if (delta > 0) {
        elapsedTime = Number(elapsedTime || 0) + delta
        runningSince = now
        storage.play.setCurrent({ isRunning: true, runningSince, elapsedTime })
      }
      this.startInterval()
    }
    this.setData({ playingIsRunning: !!isRunning, playingRunningSince: Number(runningSince || 0), playingElapsed: Number(elapsedTime || 0) })
    this.updatePlayingText()
  },
  updatePlayingText() {
    const s = this.data.playingElapsed
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    this.setData({ playingText: `${h}:${m}:${sec}` })
  },
  togglePlaying() {
    if (this.data.playingIsRunning) this.stopPlaying()
    else this.startPlaying()
  },
  startPlaying() {
    if (this._playTimer) return
    const now = Date.now()
    this.setData({ playingIsRunning: true, playingRunningSince: now })
    const cur = { isRunning: true, runningSince: now, elapsedTime: Number(this.data.playingElapsed || 0) }
    storage.play.setCurrent(cur)
    this.startInterval()
  },
  stopPlaying() {
    if (this._playTimer) {
      clearInterval(this._playTimer)
      this._playTimer = null
    }
    const now = Date.now()
    const rs = Number(this.data.playingRunningSince || 0)
    let elapsed = Number(this.data.playingElapsed || 0)
    if (rs) {
      const delta = Math.floor((now - rs) / 1000)
      if (delta > 0) elapsed += delta
    }
    if (elapsed > 0 && rs) {
      storage.play.addHistory({ startedAt: rs, finishedAt: now, elapsedSeconds: elapsed })
    }
    const total = storage.play.getTotalSeconds()
    storage.play.setTotalSeconds(total + elapsed)
    storage.play.setCurrent({ isRunning: false, runningSince: 0, elapsedTime: 0 })
    this.setData({ playingIsRunning: false, playingRunningSince: 0, playingElapsed: 0 })
    this.updatePlayingText()
    wx.showToast({ title: '本次时长已计入汇总', icon: 'none' })
  },
  startInterval() {
    if (this._playTimer) return
    this._playTimer = setInterval(() => {
      const t = Number(this.data.playingElapsed || 0) + 1
      this.setData({ playingElapsed: t })
      storage.play.setCurrent({ isRunning: true, runningSince: Number(this.data.playingRunningSince || Date.now()), elapsedTime: t })
      this.updatePlayingText()
    }, 1000)
  },
  clearPlayInterval() {
    if (this._playTimer) {
      clearInterval(this._playTimer)
      this._playTimer = null
    }
  },
  onHide() {
    this.clearPlayInterval()
  },
  onUnload() {
    this.clearPlayInterval()
  }
})
