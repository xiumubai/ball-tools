// pages/profile.js
Page({
  data: {
    version: 'v1.0.0',
    author: '朽木白',
    desc: '由一个台球爱好者开发',
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
      this.getTabBar().setSelected(3)
    }
  },
  onClearAll() {
    wx.showModal({
      title: '清除所有数据',
      content: '此操作不可恢复，确认后将删除本地比赛记录与设置',
      confirmText: '清除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const keys = ['zhongba_match_history','zhongba_match_current','zhuifen_match_history','zhuifen_match_current','zhuifen_rules']
          try { keys.forEach(k => wx.removeStorageSync(k)) } catch(e) {}
          wx.showToast({ title: '已清除', icon: 'none' })
        }
      }
    })
  },
  onCopyRepo() {
    wx.setClipboardData({ data: this.data.repoUrl, success: () => { wx.showToast({ title: '链接已复制', icon: 'none' }) } })
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

  }
})
