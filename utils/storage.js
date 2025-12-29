const KEYS = {
  ongoingMatches: 'ongoingMatches',
  eightCurrent: 'zhongba_match_current',
  eightHistory: 'zhongba_match_history',
  nineRules: 'zhuifen_rules',
  nineCurrent: 'zhuifen_match_current',
  nineHistory: 'zhuifen_match_history'
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
  addHistory(record) { const hist = this.getHistory(); hist.push(record); safeSet(KEYS.eightHistory, hist); return hist }
}

const nine = {
  getCurrent() { return safeGet(KEYS.nineCurrent) || null },
  setCurrent(obj) { if (obj == null) safeRemove(KEYS.nineCurrent); else safeSet(KEYS.nineCurrent, obj) },
  getCurrentById(id) { if (!id) return this.getCurrent(); return safeGet(`${KEYS.nineCurrent}_${id}`) || null },
  setCurrentById(id, obj) { if (!id) return this.setCurrent(obj); const k = `${KEYS.nineCurrent}_${id}`; if (obj == null) safeRemove(k); else safeSet(k, obj) },
  getHistory() { return ensureArray(safeGet(KEYS.nineHistory) || []) },
  addHistory(record) { const hist = this.getHistory(); hist.push(record); safeSet(KEYS.nineHistory, hist); return hist }
}

const rules = {
  getNineRules() {
    const r = safeGet(KEYS.nineRules)
    return r && r.foul ? r : { foul: 1, normal: 4, xiaojin: 7, dajin: 10, huangjin9: 4 }
  },
  setNineRules(r) { safeSet(KEYS.nineRules, r) }
}

module.exports = { keys: KEYS, get: safeGet, set: safeSet, remove: safeRemove, ongoing, eight, nine, rules }
