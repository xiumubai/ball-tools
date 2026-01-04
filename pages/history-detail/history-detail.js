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
    // Removed
  },

  renderCanvas() {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery()
      query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0]) {
          reject(new Error('Canvas not found'))
          return
        }
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        // 根据设计稿调整画布尺寸，保持高宽比
        // WXML中设置的是 375x667 (16:9左右)，这里可以设大一点保证清晰度
        const width = res[0].width
        const height = res[0].height
        
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
        
        // 1. Background (Dark Gradient)
        // linear-gradient(180deg, #0b1220, #0f1a2e)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
        bgGrad.addColorStop(0, '#0b1220')
        bgGrad.addColorStop(1, '#0f1a2e')
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, width, height)

        // Radial Gradients (Simulation)
        // Top Right Purple
        const rad1 = ctx.createRadialGradient(width*0.8, -height*0.1, 0, width*0.8, -height*0.1, width*0.8)
        rad1.addColorStop(0, 'rgba(126,124,249,0.15)')
        rad1.addColorStop(0.6, 'transparent')
        ctx.fillStyle = rad1
        ctx.fillRect(0, 0, width, height)
        
        // Bottom Left Blue
        const rad2 = ctx.createRadialGradient(0, height, 0, 0, height, width*0.6)
        rad2.addColorStop(0, 'rgba(76,140,245,0.18)')
        rad2.addColorStop(0.6, 'transparent')
        ctx.fillStyle = rad2
        ctx.fillRect(0, 0, width, height)
        
        // 2. Watermark "追分记"
        ctx.save()
        ctx.translate(width / 2, height / 2)
        ctx.rotate(-22 * Math.PI / 180)
        ctx.font = '800 80px sans-serif' // 大号水印
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.fillText('追分记', 0, 0)
        ctx.restore()
        
        // 3. Card Content Area (Padding)
        const padX = 32
        const padY = 48
        
        // Brand
        // Logo Box
        const logoSize = 24
        const logoX = width/2 - 90 // 大致居中偏左一点，或者居中布局
        // 其实设计稿是居左还是居中？WXML是居中，这里保持居中
        
        // Title "8球 战报"
        ctx.fillStyle = '#E6E8EF'
        ctx.font = '800 24px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(`${this.data.type} 战报`, width / 2, padY + 40)
        
        // Meta "Time | Rounds"
        ctx.fillStyle = '#9AA4B2'
        ctx.font = '12px sans-serif'
        ctx.fillText(`${this.data.date} ${this.data.time} | 总局数: ${this.data.totalRounds}`, width / 2, padY + 76)
        
        // Scores
        const scoreY = padY + 130
        const players = this.data.players
        const pCount = players.length
        const sectionW = width / pCount
        
        players.forEach((p, i) => {
          const cx = i * sectionW + sectionW / 2
          
          // Score Number (Gradient Text Simulation -> just white/blue for canvas)
          ctx.fillStyle = '#DAE0FF' // Light Blue-ish White
          ctx.font = '800 48px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(String(p.score), cx, scoreY)
          
          // Name
          ctx.fillStyle = '#9AA4B2'
          ctx.font = '14px sans-serif'
          ctx.fillText(p.name, cx, scoreY + 60)
        })
        
        // Divider
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(padX, scoreY + 100)
        ctx.lineTo(width - padX, scoreY + 100)
        ctx.stroke()
        
        // Table
        const tableY = scoreY + 130
        const rowH = 40
        const rows = this.data.statsRows
        
        // Table Header
        ctx.fillStyle = 'rgba(255,255,255,0.06)' // Header bg
        ctx.fillRect(padX, tableY, width - padX*2, rowH)
        
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#C9D1E6'
        ctx.font = '600 13px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText('统计项', padX + 12, tableY + rowH/2)
        
        const colW = (width - padX*2 - 80) / pCount 
        players.forEach((p, i) => {
          ctx.textAlign = 'center'
          ctx.fillText(p.name, padX + 80 + i * colW + colW/2, tableY + rowH/2)
        })
        
        // Table Rows
        ctx.font = '13px sans-serif'
        rows.forEach((row, idx) => {
          const y = tableY + rowH + idx * rowH
          const rowCenterY = y + rowH/2
          
          // Row Line
          ctx.strokeStyle = 'rgba(255,255,255,0.08)'
          ctx.beginPath()
          ctx.moveTo(padX, y + rowH)
          ctx.lineTo(width - padX, y + rowH)
          ctx.stroke()
          
          // Label
          // Color based on type
          if (row.label === '普胜') ctx.fillStyle = '#28C76F'
          else if (row.label === '犯规') ctx.fillStyle = '#FF5D5D'
          else ctx.fillStyle = '#E8ECF7'
          
          ctx.textAlign = 'left'
          ctx.fillText(row.label, padX + 12, rowCenterY)
          
          // Values
          ctx.fillStyle = '#E8ECF7'
          row.values.forEach((v, i) => {
            ctx.textAlign = 'center'
            ctx.fillText(String(v), padX + 80 + i * colW + colW/2, rowCenterY)
          })
        })
        
        // Footer
        ctx.fillStyle = '#9AA4B2'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Generated by Ball Tools', width / 2, height - 30)
        
        this.canvasNode = canvas
        resolve(canvas)
      })
    })
  },

  async saveCard() {
    wx.showLoading({ title: '生成中...' })
    try {
      const canvas = await this.renderCanvas()
      wx.canvasToTempFilePath({
        canvas: canvas,
        success: (res) => {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading()
              wx.showToast({ title: '已保存到相册', icon: 'success' })
            },
            fail: (err) => {
              wx.hideLoading()
              if (err.errMsg.includes('auth')) {
                wx.showModal({
                  title: '提示',
                  content: '需要访问相册权限才能保存图片',
                  success: (m) => {
                    if (m.confirm) wx.openSetting()
                  }
                })
              } else {
                wx.showToast({ title: '保存失败', icon: 'none' })
              }
            }
          })
        },
        fail: (err) => {
          wx.hideLoading()
          wx.showToast({ title: '生成图片失败', icon: 'none' })
          console.error(err)
        }
      })
    } catch (e) {
      wx.hideLoading()
      console.error(e)
      wx.showToast({ title: '初始化画布失败', icon: 'none' })
    }
  }
})
