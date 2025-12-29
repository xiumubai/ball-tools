Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: 'home', selectedIcon: 'home-filled' },
      { pagePath: '/pages/match/match', text: '比赛', icon: 'tools', selectedIcon: 'tools' },
      { pagePath: '/pages/history/history', text: '记录', icon: 'history', selectedIcon: 'history' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: 'user', selectedIcon: 'user' },
    ],
  },
  methods: {
    switchTab(e) {
      const idx = Number(e.currentTarget.dataset.index)
      const url = this.data.list[idx].pagePath
      wx.switchTab({ url })
      this.setData({ selected: idx })
    },
    setSelected(idx) {
      this.setData({ selected: idx })
    },
  }
})
