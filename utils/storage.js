const KEYS = {
  ongoingMatches: 'ongoingMatches',
  eightCurrent: 'zhongba_match_current',
  eightHistory: 'zhongba_match_history',
  nineRules: 'zhuifen_rules',
  nineCurrent: 'zhuifen_match_current',
  nineHistory: 'zhuifen_match_history',
  playCurrent: 'global_play_current',
  playTotal: 'global_play_total',
  playHistory: 'global_play_history',
  trainingModes: 'training_modes',
  trainingCurrent: 'training_current',
  trainingHistory: 'training_history'
}

function safeGet(key) {
  try { return wx.getStorageSync(key) } catch (e) { return null }
}

function safeSet(key, value) {
  try { wx.setStorageSync(key, value) } catch (e) {}
}

function safeRemove(key) {
  try { wx.removeStorageSync(key) } catch (e) {}
}

function ensureArray(v) { return Array.isArray(v) ? v : [] }

function cleanupOrphans() {
  let keys = []
  try { const info = wx.getStorageInfoSync(); keys = info && info.keys ? info.keys : [] } catch (e) { keys = [] }
  const list = ongoing.getList()
  const ids = new Set((Array.isArray(list) ? list : []).map(v => v && v.id))
  const prefixEight = `${KEYS.eightCurrent}_`
  const prefixNine = `${KEYS.nineCurrent}_`
  keys.forEach(k => {
    if (typeof k !== 'string') return
    if (k.indexOf(prefixEight) === 0) {
      const id = Number(k.slice(prefixEight.length))
      if (!ids.has(id)) safeRemove(k)
    } else if (k.indexOf(prefixNine) === 0) {
      const id = Number(k.slice(prefixNine.length))
      if (!ids.has(id)) safeRemove(k)
    }
  })
}

const ongoing = {
  getList() { return ensureArray(safeGet(KEYS.ongoingMatches) || []) },
  setList(list) { safeSet(KEYS.ongoingMatches, Array.isArray(list) ? list : []) },
  add(match) { const list = this.getList(); list.unshift(match); this.setList(list); return list },
  removeById(id) { const list = this.getList().filter(v => v && v.id !== id); this.setList(list); return list }
}

const eight = {
  getCurrent() { return safeGet(KEYS.eightCurrent) || null },
  setCurrent(obj) { if (obj == null) safeRemove(KEYS.eightCurrent); else safeSet(KEYS.eightCurrent, obj) },
  getCurrentById(id) { if (!id) return this.getCurrent(); return safeGet(`${KEYS.eightCurrent}_${id}`) || null },
  setCurrentById(id, obj) { if (!id) return this.setCurrent(obj); const k = `${KEYS.eightCurrent}_${id}`; if (obj == null) safeRemove(k); else safeSet(k, obj) },
  getHistory() { return ensureArray(safeGet(KEYS.eightHistory) || []) },
  setHistory(list) { safeSet(KEYS.eightHistory, Array.isArray(list) ? list : []) },
  addHistory(record) { const hist = this.getHistory(); hist.push(record); safeSet(KEYS.eightHistory, hist); return hist },
  removeHistoryByTs(ts) {
    const hist = this.getHistory()
    const filtered = hist.filter(r => {
      const t = r && (r.finishedAt || (r.finishedAtISO ? Date.parse(r.finishedAtISO) : 0))
      return t !== ts
    })
    this.setHistory(filtered)
    return filtered
  }
}

const nine = {
  getCurrent() { return safeGet(KEYS.nineCurrent) || null },
  setCurrent(obj) { if (obj == null) safeRemove(KEYS.nineCurrent); else safeSet(KEYS.nineCurrent, obj) },
  getCurrentById(id) { if (!id) return this.getCurrent(); return safeGet(`${KEYS.nineCurrent}_${id}`) || null },
  setCurrentById(id, obj) { if (!id) return this.setCurrent(obj); const k = `${KEYS.nineCurrent}_${id}`; if (obj == null) safeRemove(k); else safeSet(k, obj) },
  getHistory() { return ensureArray(safeGet(KEYS.nineHistory) || []) },
  setHistory(list) { safeSet(KEYS.nineHistory, Array.isArray(list) ? list : []) },
  addHistory(record) { const hist = this.getHistory(); hist.push(record); safeSet(KEYS.nineHistory, hist); return hist },
  removeHistoryByTs(ts) {
    const hist = this.getHistory()
    const filtered = hist.filter(r => {
      const t = r && (r.finishedAt || (r.finishedAtISO ? Date.parse(r.finishedAtISO) : 0))
      return t !== ts
    })
    this.setHistory(filtered)
    return filtered
  }
}

const rules = {
  getNineRules() {
    const r = safeGet(KEYS.nineRules)
    return r && r.foul ? r : { foul: 1, normal: 4, xiaojin: 7, dajin: 10, huangjin9: 4 }
  },
  setNineRules(r) { safeSet(KEYS.nineRules, r) }
}

const play = {
  getCurrent() { return safeGet(KEYS.playCurrent) || { isRunning: false, runningSince: 0, elapsedTime: 0 } },
  setCurrent(obj) { if (obj == null) safeRemove(KEYS.playCurrent); else safeSet(KEYS.playCurrent, obj) },
  getTotalSeconds() { const v = safeGet(KEYS.playTotal); return typeof v === 'number' && v >= 0 ? v : 0 },
  setTotalSeconds(sec) { const n = Number(sec) || 0; safeSet(KEYS.playTotal, n) },
  getHistory() { return ensureArray(safeGet(KEYS.playHistory) || []) },
  setHistory(list) { safeSet(KEYS.playHistory, Array.isArray(list) ? list : []) },
  addHistory(record) { const hist = this.getHistory(); hist.push(record); safeSet(KEYS.playHistory, hist); return hist },
  removeHistoryByTs(ts) {
    const hist = this.getHistory()
    const filtered = hist.filter(r => r.startedAt !== ts)
    this.setHistory(filtered)
    
    // Recalculate total time
    let total = 0
    filtered.forEach(r => total += Number(r.elapsedSeconds || 0))
    this.setTotalSeconds(total)
    
    return filtered
  }
}

const training = {
  getModes() { return ensureArray(safeGet(KEYS.trainingModes) || []) },
  setModes(list) { safeSet(KEYS.trainingModes, Array.isArray(list) ? list : []) },
  addMode(mode) { const list = this.getModes(); list.push(mode); this.setModes(list); return list },
  removeMode(id) { const list = this.getModes().filter(m => m.id !== id); this.setModes(list); return list },
  getCurrent() { return safeGet(KEYS.trainingCurrent) || null },
  setCurrent(obj) { if (obj == null) safeRemove(KEYS.trainingCurrent); else safeSet(KEYS.trainingCurrent, obj) },
  getHistory() { return ensureArray(safeGet(KEYS.trainingHistory) || []) },
  setHistory(list) { safeSet(KEYS.trainingHistory, Array.isArray(list) ? list : []) },
  addHistory(record) { const hist = this.getHistory(); hist.push(record); safeSet(KEYS.trainingHistory, hist); return hist },
  removeHistoryByTs(ts) {
    const hist = this.getHistory()
    const filtered = hist.filter(r => {
      const t = r && (r.finishedAt || (r.finishedAtISO ? Date.parse(r.finishedAtISO) : 0))
      return t !== ts
    })
    this.setHistory(filtered)
    return filtered
  }
}

module.exports = { keys: KEYS, get: safeGet, set: safeSet, remove: safeRemove, ongoing, eight, nine, rules, play, training, cleanupOrphans }
