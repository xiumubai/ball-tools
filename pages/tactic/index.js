Page({
  data: {
    ballsOnTable: [],
    isToolbarExpanded: false,
    currentMode: 'move', 
    drawShape: 'free', 
    lines: [], 
    currentLine: null,
    tableWidth: 340, 
    tableHeight: 680,
    tableInnerWidth: 310, // 台呢宽度
    tableInnerHeight: 620, // 台呢高度
    borderWidth: 15, // 边框宽度 px
    historyStack: [] 
  },

  onLoad() {
    this.calculateTableSize();
    setTimeout(() => {
      const w = this.data.tableInnerWidth;
      const h = this.data.tableInnerHeight;
      // 初始化位置改为相对于台呢
      this.addBallToTable(0, 'solid', w * 0.5, h * 0.75, false); 
      this.addBallToTable(8, 'solid', w * 0.5, h * 0.25, false);
      this.initCanvas();
    }, 100);
  },

  calculateTableSize() {
    const sys = wx.getSystemInfoSync();
    const winW = sys.windowWidth;
    const winH = sys.windowHeight;
    const paddingX = 40 * (winW / 750); // 左右留白
    const paddingY = 60 * (winW / 750); // 上下留白
    
    // 标准尺寸 (mm)
    const REAL_OUTER_W = 1550;
    const REAL_OUTER_H = 2830;
    const REAL_INNER_W = 1270;
    const REAL_INNER_H = 2540;
    
    // 边框宽度 (单边)
    const REAL_BORDER_W = (REAL_OUTER_W - REAL_INNER_W) / 2; // 140mm
    // 实际上通常长边的边框和短边的边框宽度可能略有不同，但为了UI简化，这里统一处理，
    // 或者严格按照比例计算。
    // 既然给了外沿和内沿尺寸，我们优先保证内沿是 2:1 (2540/1270)，且外沿包裹内沿。
    
    // 屏幕可用最大区域
    const maxW = winW - paddingX * 2;
    const maxH = winH - paddingY * 2;
    
    // 计算缩放比例
    // 尝试以宽度适配
    let scale = maxW / REAL_OUTER_W;
    // 如果高度超出了，则以高度适配
    if (REAL_OUTER_H * scale > maxH) {
      scale = maxH / REAL_OUTER_H;
    }
    
    const tableWidth = REAL_OUTER_W * scale;
    const tableHeight = REAL_OUTER_H * scale;
    const borderWidth = REAL_BORDER_W * scale;
    const tableInnerWidth = REAL_INNER_W * scale;
    const tableInnerHeight = REAL_INNER_H * scale;

    this.setData({ 
      tableWidth, 
      tableHeight,
      borderWidth,
      tableInnerWidth,
      tableInnerHeight
    }, () => {
      // 在布局更新完成后初始化 Canvas
      setTimeout(() => {
        this.initCanvas();
      }, 300);
    });
  },

  onReady() {
    // 移除 initCanvas 调用，统一在 calculateTableSize 回调中执行
  },

  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#drawCanvas').fields({ node: true, size: true, rect: true }).exec((res) => {
      if (res[0]) {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        this.canvas = canvas;
        this.ctx = ctx;
        this.canvasLeft = res[0].left;
        this.canvasTop = res[0].top;
        this.drawLines();
      }
    });
  },

  toggleToolbar() { this.setData({ isToolbarExpanded: !this.data.isToolbarExpanded }); },
  closeToolbar() { if (this.data.isToolbarExpanded) this.setData({ isToolbarExpanded: false }); },
  preventBubble() {},
  setMode(e) { this.setData({ currentMode: e.currentTarget.dataset.mode }); },
  setDrawShape(e) { this.setData({ drawShape: e.currentTarget.dataset.shape }); },

  saveHistory() {
    const stack = this.data.historyStack;
    const snapshot = {
      ballsOnTable: JSON.parse(JSON.stringify(this.data.ballsOnTable)),
      lines: JSON.parse(JSON.stringify(this.data.lines))
    };
    stack.push(snapshot);
    if (stack.length > 50) stack.shift();
    this.setData({ historyStack: stack });
  },

  undo() {
    const stack = this.data.historyStack;
    if (stack.length === 0) {
      wx.showToast({ title: '没有可撤销的操作', icon: 'none' });
      return;
    }
    const prevState = stack.pop();
    this.setData({
      historyStack: stack,
      ballsOnTable: prevState.ballsOnTable,
      lines: prevState.lines
    }, () => {
      this.drawLines(); 
    });
  },

  randomBreak() {
    this.saveHistory();
    this.generateRandomBalls();
  },

  generateRandomBalls() {
    const balls = [];
    const ballSizeRpx = 40;
    const sys = wx.getSystemInfoSync();
    const ratio = sys.windowWidth / 750;
    const ballDiameter = ballSizeRpx * ratio;
    
    const w = this.data.tableInnerWidth;
    const h = this.data.tableInnerHeight;
    const padding = 10 * ratio; 
    
    // 0: 白球, 8: 黑八, 1-7: 全色, 9-15: 花色
    const numbers = [0, 8, ...[1,2,3,4,5,6,7], ...[9,10,11,12,13,14,15]];
    
    // 生成随机位置并确保不重叠
    for (let i = 0; i < numbers.length; i++) {
      const num = numbers[i];
      let type = 'solid';
      if (num > 8) type = 'stripe';
      if (num === 8) type = 'solid'; // 8号也是solid样式，但在css中有特殊处理
      
      let x, y, overlapped;
      let attempts = 0;
      const maxAttempts = 200;
      
      do {
        x = padding + Math.random() * (w - ballDiameter - 2 * padding);
        y = padding + Math.random() * (h - ballDiameter - 2 * padding);
        
        overlapped = false;
        for (let b of balls) {
          const dx = x - b.x;
          const dy = y - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          // 增加一点点缓冲距离，避免贴得太紧
          if (dist < ballDiameter * 1.05) {
            overlapped = true;
            break;
          }
        }
        attempts++;
      } while(overlapped && attempts < maxAttempts);
      
      if (!overlapped) {
        balls.push({
          id: Date.now() + i, // 确保ID唯一
          number: num,
          type,
          x,
          y
        });
      }
    }
    
    this.setData({ ballsOnTable: balls });
    wx.showToast({ title: '开球完成', icon: 'none' });
  },

  addBall(e) {
    this.saveHistory(); 
    const { number, type } = e.currentTarget.dataset;
    const w = this.data.tableInnerWidth;
    const h = this.data.tableInnerHeight;
    const x = 20 + Math.random() * (w - 40);
    const y = h * 0.5 + Math.random() * (h * 0.4);
    this.addBallToTable(number, type, x, y);
    wx.showToast({ title: '已添加', icon: 'none' });
  },

  addBallToTable(number, type, x, y, save = true) {
    const newBall = { id: Date.now(), number, type, x, y };
    const list = this.data.ballsOnTable;
    list.push(newBall);
    this.setData({ ballsOnTable: list });
  },

  onBallTouchStart(e) {
    if (this.data.currentMode === 'draw') return;
    this.dragStartSnapshot = {
      ballsOnTable: JSON.parse(JSON.stringify(this.data.ballsOnTable)),
      lines: JSON.parse(JSON.stringify(this.data.lines))
    };
    this.isDraggingBall = true;
  },

  onBallMove(e) {
    const id = e.currentTarget.dataset.id;
    const { x, y } = e.detail;
    const ball = this.data.ballsOnTable.find(b => b.id === id);
    if (ball) {
      ball.x = x;
      ball.y = y;
    }
  },

  onBallTouchEnd(e) {
    if (!this.isDraggingBall) return;
    this.isDraggingBall = false;
    const stack = this.data.historyStack;
    stack.push(this.dragStartSnapshot);
    this.setData({ historyStack: stack });
    this.setData({ ballsOnTable: this.data.ballsOnTable });
  },

  onBallLongPress(e) {
    if (this.data.currentMode === 'draw') return;
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除',
      content: '确定要移除这颗球吗？',
      success: (res) => {
        if (res.confirm) {
          this.saveHistory(); 
          const list = this.data.ballsOnTable.filter(b => b.id !== id);
          this.setData({ ballsOnTable: list });
        }
      }
    });
  },

  clearTable() {
    wx.showModal({
      title: '清空球桌',
      content: '确定要清空所有球吗？',
      success: (res) => {
        if (res.confirm) {
          this.saveHistory(); 
          this.setData({ ballsOnTable: [] });
        }
      }
    });
  },

  clearLines() {
    this.saveHistory(); 
    this.setData({ lines: [] });
    this.currentLine = null;
    this.drawLines();
  },

  getCanvasPoint(e) {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    return {
      x: x - (this.canvasLeft || 0),
      y: y - (this.canvasTop || 0)
    };
  },

  updateCanvasRect() {
    const query = wx.createSelectorQuery();
    query.select('#drawCanvas').fields({ rect: true }).exec((res) => {
      if (res[0]) {
        this.canvasLeft = res[0].left;
        this.canvasTop = res[0].top;
      }
    });
  },

  onCanvasTouchStart(e) {
    if (this.data.currentMode !== 'draw') return;
    this.saveHistory();
    // 再次尝试更新 rect 以防偏移
    this.updateCanvasRect();
    
    const point = this.getCanvasPoint(e);
    const shape = this.data.drawShape;
    this.currentLine = { type: shape, color: 'red', width: 2, start: point, end: point, points: [point] };
    this.drawLines();
  },

  onCanvasTouchMove(e) {
    if (this.data.currentMode !== 'draw' || !this.currentLine) return;
    const point = this.getCanvasPoint(e);
    this.currentLine.end = point;
    if (this.currentLine.type === 'free') this.currentLine.points.push(point);
    this.drawLines();
  },

  onCanvasTouchEnd() {
    if (this.data.currentMode !== 'draw' || !this.currentLine) return;
    const lines = this.data.lines;
    lines.push(this.currentLine);
    this.currentLine = null;
    this.drawLines();
  },

  drawLines() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const canvas = this.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    const linesToDraw = [...this.data.lines];
    if (this.currentLine) linesToDraw.push(this.currentLine);

    linesToDraw.forEach(item => {
      ctx.beginPath();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (item.type === 'free') {
        if (item.points.length < 2) return;
        ctx.moveTo(item.points[0].x, item.points[0].y);
        for (let i = 1; i < item.points.length; i++) {
          ctx.lineTo(item.points[i].x, item.points[i].y);
        }
      } else if (item.type === 'line') {
        ctx.moveTo(item.start.x, item.start.y);
        ctx.lineTo(item.end.x, item.end.y);
      } else if (item.type === 'circle') {
        const dx = item.end.x - item.start.x;
        const dy = item.end.y - item.start.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.arc(item.start.x, item.start.y, radius, 0, 2 * Math.PI);
      }
      ctx.stroke();
    });
  }
});