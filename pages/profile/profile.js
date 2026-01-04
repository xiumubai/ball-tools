// pages/profile.js
const storage = require('../../utils/storage')
Page({
  data: {
    version: 'v2.1.1',
    author: '朽木白',
    desc: '由一个台球爱好者开发',
    totalPlayText: '00:00:00'
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
    this.refreshPlayTotal()
  },
  refreshPlayTotal() {
    const sec = storage.play.getTotalSeconds()
    const h = String(Math.floor(sec / 3600)).padStart(2, '0')
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
    const s = String(sec % 60).padStart(2, '0')
    this.setData({ totalPlayText: `${h}:${m}:${s}` })
  },
  handleDev() {
    wx.showToast({
      title: '正在开发中',
      icon: 'none'
    })
  },
  onClearAll() {
    wx.showModal({
      title: '清除所有数据',
      content: '此操作不可恢复，确认后将删除本地比赛记录与设置',
      confirmText: '清除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          try { wx.clearStorageSync() } catch(e) {}
          wx.showToast({ title: '已清除', icon: 'none' })
          this.refreshPlayTotal()
        }
      }
    })
  },
  onExportData() {
    wx.showLoading({ title: '正在导出...' })
    
    // 1. 收集数据
    const exportData = {
      exportTime: new Date().toISOString(),
      version: this.data.version,
      data: {
        trainingModes: storage.training.getModes(),
        trainingHistory: storage.training.getHistory(),
        eightHistory: storage.eight.getHistory(),
        nineHistory: storage.nine.getHistory(),
        playHistory: storage.play.getHistory(),
        playTotal: storage.play.getTotalSeconds()
      }
    }

    const jsonStr = JSON.stringify(exportData, null, 2)
    const fs = wx.getFileSystemManager()
    const fileName = `ball_tools_backup_${new Date().getTime()}.json`
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`

    // 2. 写入临时文件
    fs.writeFile({
      filePath,
      data: jsonStr,
      encoding: 'utf8',
      success: () => {
        wx.hideLoading()
        // 3. 提示导出成功并尝试分享/打开
        wx.showModal({
          title: '导出成功',
          content: `备份文件已生成：${fileName}\n建议通过“转发”发送给好友或自己保存。`,
          confirmText: '转发分享',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              // 4. 分享文件 (PC端或部分高版本微信支持)
              if (wx.shareFileMessage) {
                wx.shareFileMessage({
                  filePath,
                  fileName,
                  success: () => {
                    wx.showToast({ title: '分享成功' })
                  },
                  fail: (err) => {
                    console.error('shareFileMessage fail', err)
                    // 如果分享失败，尝试使用预览文档方式
                    this.openDocument(filePath)
                  }
                })
              } else {
                // 如果不支持 shareFileMessage，尝试预览文档
                this.openDocument(filePath)
              }
            }
          }
        })
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '导出失败', icon: 'none' })
        console.error('writeFile fail', err)
      }
    })
  },

  onImportData() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const filePath = res.tempFiles[0].path
        const fs = wx.getFileSystemManager()
        
        fs.readFile({
          filePath,
          encoding: 'utf8',
          success: (readRes) => {
            try {
              const content = JSON.parse(readRes.data)
              if (!content || !content.data) {
                throw new Error('无效的备份文件格式')
              }
              
              wx.showModal({
                title: '确认恢复',
                content: '导入将覆盖现有数据，此操作不可撤销。确认要继续吗？',
                success: (confirmRes) => {
                  if (confirmRes.confirm) {
                    this.restoreData(content.data)
                  }
                }
              })
            } catch (e) {
              wx.showToast({ title: '文件解析失败', icon: 'none' })
              console.error('import parse error', e)
            }
          },
          fail: (err) => {
            wx.showToast({ title: '读取文件失败', icon: 'none' })
            console.error('readFile fail', err)
          }
        })
      }
    })
  },

  restoreData(data) {
    try {
      if (data.trainingModes) storage.training.setModes(data.trainingModes)
      if (data.trainingHistory) storage.training.setHistory(data.trainingHistory)
      if (data.eightHistory) storage.eight.setHistory(data.eightHistory)
      if (data.nineHistory) storage.nine.setHistory(data.nineHistory)
      if (data.playHistory) storage.play.setHistory(data.playHistory)
      if (data.playTotal !== undefined) storage.play.setTotalSeconds(data.playTotal)
      
      this.refreshPlayTotal()
      wx.showToast({ title: '数据恢复成功', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: '恢复部分数据失败', icon: 'none' })
      console.error('restore error', e)
    }
  },

  openDocument(filePath) {
    wx.openDocument({
      filePath,
      showMenu: true,
      success: () => {
        console.log('打开文档成功')
      },
      fail: (err) => {
        wx.showToast({ title: '打开失败', icon: 'none' })
        console.error('openDocument fail', err)
      }
    })
  },

  goPlaytimeHistory() {
    wx.navigateTo({ url: '/pages/playtime/history' })
  },
  goTraining() {
    wx.navigateTo({ url: '/pages/training/index' })
  },
  goTactic() {
    wx.navigateTo({ url: '/pages/tactic/index' })
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
