const storage = require('../../utils/storage')
Page({
  data: {
    modes: [],
    newModeName: '',
    totalSessions: 0
  },
  onLoad() {
    this.refreshModes()
  },
  onShow() {
    this.refreshModes()
  },
  refreshModes() {
    const list = storage.training.getModes()
    const history = storage.training.getHistory()
    const modes = (Array.isArray(list) ? list : []).map(m => {
      const count = history.filter(h => h.modeId === m.id).length
      return { ...m, count }
    })
    const totalSessions = history.length
    this.setData({ modes, totalSessions })
  },
  onNameInput(e) {
    this.setData({ newModeName: e.detail.value })
  },
  addMode() {
    const name = (this.data.newModeName || '').trim()
    const reg = /^[\u4e00-\u9fa5A-Za-z0-9]{1,12}$/
    if (!reg.test(name)) { wx.showToast({ title: '支持中英文数字，最多12字', icon: 'none' }); return }
    const id = Date.now()
    storage.training.addMode({ id, name })
    this.setData({ newModeName: '' })
    this.refreshModes()
    wx.showToast({ title: '已添加', icon: 'none' })
  },
  deleteMode(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    
    if (!id) return

    wx.showModal({
      title: '删除训练模式',
      content: `确定要删除 "${name}" 吗？此操作不可恢复。`,
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          storage.training.removeMode(id)
          this.refreshModes()
          wx.showToast({ title: '已删除', icon: 'none' })
        }
      }
    })
  },
  enterMode(e) {
    const id = Number(e.currentTarget.dataset.id)
    const name = e.currentTarget.dataset.name
    if (!id) return
    wx.navigateTo({ url: `/pages/training/session?modeId=${id}&modeName=${encodeURIComponent(name)}` })
  },
  goHistory(e) {
    const id = e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id
    const url = id ? `/pages/training/history?modeId=${id}` : '/pages/training/history'
    wx.navigateTo({ url })
  }
})
