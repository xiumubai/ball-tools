"use client"

import { useState, useEffect, useCallback } from "react"
import { RotateCcw, Undo2, Settings, X, Square, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

// 操作记录类型
interface ActionRecord {
  type: "普胜" | "接清" | "炸清" | "犯规"
  player: 1 | 2
  timestamp: number
}

// 玩家统计类型
interface PlayerStats {
  normalWins: number
  runOuts: number
  breakAndRuns: number
  fouls: number
}

export function EightBallPage({ matchId, onBack }: { matchId?: string; onBack?: () => void }) {
  // 玩家姓名
  const [player1Name, setPlayer1Name] = useState("玩家1")
  const [player2Name, setPlayer2Name] = useState("玩家2")
  const [editingPlayer, setEditingPlayer] = useState<1 | 2 | null>(null)
  const [tempName, setTempName] = useState("")

  // 比分
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)

  const [targetScore, setTargetScore] = useState<number | null>(7)

  // 当前选中的玩家（用于操作）
  const [selectedPlayer, setSelectedPlayer] = useState<1 | 2>(1)

  // 统计数据
  const [player1Stats, setPlayer1Stats] = useState<PlayerStats>({
    normalWins: 0,
    runOuts: 0,
    breakAndRuns: 0,
    fouls: 0,
  })
  const [player2Stats, setPlayer2Stats] = useState<PlayerStats>({
    normalWins: 0,
    runOuts: 0,
    breakAndRuns: 0,
    fouls: 0,
  })

  // 操作历史
  const [actionHistory, setActionHistory] = useState<ActionRecord[]>([])

  // 倒计时
  const [countdownTime, setCountdownTime] = useState(3600)
  const [initialTime, setInitialTime] = useState(3600)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())

  // 设置面板
  const [showSettings, setShowSettings] = useState(false)

  const [isMatchEnded, setIsMatchEnded] = useState(false)

  // 加载保存的比赛状态
  useEffect(() => {
    if (!matchId) return

    const savedMatches = localStorage.getItem("ongoingMatches")
    if (savedMatches) {
      try {
        const matches = JSON.parse(savedMatches)
        const currentMatch = matches.find((m: any) => m.id === matchId)
        
        if (currentMatch && currentMatch.type === "8ball" && currentMatch.data) {
          const d = currentMatch.data
          setPlayer1Name(d.player1Name)
          setPlayer2Name(d.player2Name)
          setPlayer1Score(d.player1Score)
          setPlayer2Score(d.player2Score)
          setTargetScore(d.targetScore)
          setPlayer1Stats(d.player1Stats)
          setPlayer2Stats(d.player2Stats)
          setActionHistory(d.actionHistory)
          setCountdownTime(d.countdownTime)
          setInitialTime(d.initialTime)
          if (currentMatch.startTime) setStartTime(currentMatch.startTime)
          // 不自动开始计时
          setIsRunning(false)
        }
      } catch (e) {
        console.error("Failed to restore match", e)
      }
    }
  }, [matchId])

  // 保存比赛状态
  useEffect(() => {
    if (isMatchEnded || !matchId) return

    const state = {
      id: matchId,
      type: "8ball",
      startTime,
      lastUpdated: Date.now(),
      data: {
        player1Name,
        player2Name,
        player1Score,
        player2Score,
        targetScore,
        player1Stats,
        player2Stats,
        actionHistory,
        countdownTime,
        initialTime,
      }
    }

    const savedMatches = JSON.parse(localStorage.getItem("ongoingMatches") || "[]")
    const matchIndex = savedMatches.findIndex((m: any) => m.id === matchId)
    
    let newMatches
    if (matchIndex >= 0) {
      newMatches = [...savedMatches]
      newMatches[matchIndex] = state
    } else {
      newMatches = [state, ...savedMatches]
    }
    
    localStorage.setItem("ongoingMatches", JSON.stringify(newMatches))
  }, [
    matchId, player1Name, player2Name, player1Score, player2Score, targetScore,
    player1Stats, player2Stats, actionHistory, countdownTime, initialTime,
    isMatchEnded, startTime
  ])

  // 倒计时逻辑
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && countdownTime > 0) {
      interval = setInterval(() => {
        setCountdownTime((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, countdownTime])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startEditName = (player: 1 | 2) => {
    setEditingPlayer(player)
    setTempName(player === 1 ? player1Name : player2Name)
  }

  const confirmNameEdit = () => {
    if (editingPlayer === 1) {
      setPlayer1Name(tempName || "玩家1")
    } else if (editingPlayer === 2) {
      setPlayer2Name(tempName || "玩家2")
    }
    setEditingPlayer(null)
    setTempName("")
  }

  const handleAction = useCallback(
    (actionType: "普胜" | "接清" | "炸清" | "犯规") => {
      const record: ActionRecord = {
        type: actionType,
        player: selectedPlayer,
        timestamp: Date.now(),
      }
      setActionHistory((prev) => [...prev, record])

      const updateStats = (prev: PlayerStats): PlayerStats => {
        switch (actionType) {
          case "普胜":
            return { ...prev, normalWins: prev.normalWins + 1 }
          case "接清":
            return { ...prev, runOuts: prev.runOuts + 1 }
          case "炸清":
            return { ...prev, breakAndRuns: prev.breakAndRuns + 1 }
          case "犯规":
            return { ...prev, fouls: prev.fouls + 1 }
          default:
            return prev
        }
      }

      if (selectedPlayer === 1) {
        setPlayer1Stats(updateStats)
      } else {
        setPlayer2Stats(updateStats)
      }

      if (actionType !== "犯规") {
        if (selectedPlayer === 1) {
          setPlayer1Score((prev) => prev + 1)
        } else {
          setPlayer2Score((prev) => prev + 1)
        }
      }
    },
    [selectedPlayer],
  )

  const undoLastAction = useCallback(() => {
    if (actionHistory.length === 0) return

    const lastAction = actionHistory[actionHistory.length - 1]
    setActionHistory((prev) => prev.slice(0, -1))

    const revertStats = (prev: PlayerStats): PlayerStats => {
      switch (lastAction.type) {
        case "普胜":
          return { ...prev, normalWins: Math.max(0, prev.normalWins - 1) }
        case "接清":
          return { ...prev, runOuts: Math.max(0, prev.runOuts - 1) }
        case "炸清":
          return { ...prev, breakAndRuns: Math.max(0, prev.breakAndRuns - 1) }
        case "犯规":
          return { ...prev, fouls: Math.max(0, prev.fouls - 1) }
        default:
          return prev
      }
    }

    if (lastAction.player === 1) {
      setPlayer1Stats(revertStats)
    } else {
      setPlayer2Stats(revertStats)
    }

    if (lastAction.type !== "犯规") {
      if (lastAction.player === 1) {
        setPlayer1Score((prev) => Math.max(0, prev - 1))
      } else {
        setPlayer2Score((prev) => Math.max(0, prev - 1))
      }
    }
  }, [actionHistory])

  const resetMatch = useCallback(() => {
    setPlayer1Score(0)
    setPlayer2Score(0)
    setPlayer1Stats({ normalWins: 0, runOuts: 0, breakAndRuns: 0, fouls: 0 })
    setPlayer2Stats({ normalWins: 0, runOuts: 0, breakAndRuns: 0, fouls: 0 })
    setActionHistory([])
    setCountdownTime(initialTime)
    setIsRunning(false)
    setIsMatchEnded(false)
  }, [initialTime])

  const endMatch = useCallback(() => {
    setIsRunning(false)
    setIsMatchEnded(true)
    if (matchId) {
      const savedMatches = JSON.parse(localStorage.getItem("ongoingMatches") || "[]")
      const newMatches = savedMatches.filter((m: any) => m.id !== matchId)
      localStorage.setItem("ongoingMatches", JSON.stringify(newMatches))
    }
  }, [matchId])

  const totalGames = player1Score + player2Score

  const isAutoEnded = targetScore !== null && (player1Score >= targetScore || player2Score >= targetScore)
  const showEndDialog = isMatchEnded || isAutoEnded

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-3 glass border-b-0 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-1 -ml-1 hover:bg-secondary/50 rounded-full mr-1">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm">8球</span>
          <span className="text-sm text-muted-foreground">{targetScore ? `BO${targetScore * 2 - 1}` : "无限制"}</span>
        </div>
        <div className="text-sm font-bold bg-secondary/50 px-3 py-1 rounded-full">第 {totalGames + 1} 局</div>
        <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-secondary/80 rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* 倒计时 */}
      <div className="text-center py-3">
        <button onClick={() => setIsRunning(!isRunning)} className="inline-flex items-center gap-2 bg-card/40 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
          <span
            className={`font-mono text-2xl font-bold tabular-nums ${countdownTime < 300 ? "text-destructive animate-pulse" : "text-foreground"}`}
          >
            {formatTime(countdownTime)}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${isRunning ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}
          >
            {isRunning ? "暂停" : "开始"}
          </span>
        </button>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4">
        {/* 比分显示 - 横向排列 */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {/* 玩家1 */}
          <button
            onClick={() => setSelectedPlayer(1)}
            className={`flex-1 py-6 rounded-3xl transition-all duration-300 relative overflow-hidden ${
              selectedPlayer === 1 
                ? "bg-primary/20 neon-glow" 
                : "glass hover:bg-card/80 border-transparent"
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity ${selectedPlayer === 1 ? "opacity-100" : ""}`} />
            {editingPlayer === 1 ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={confirmNameEdit}
                onKeyDown={(e) => e.key === "Enter" && confirmNameEdit()}
                className="bg-transparent text-center text-base font-bold w-full px-4 focus:outline-none relative z-10"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className="text-sm font-bold text-muted-foreground mb-2 relative z-10"
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  startEditName(1)
                }}
              >
                {player1Name}
              </div>
            )}
            <div key={player1Score} className="text-7xl font-black tabular-nums leading-none tracking-tight animate-score relative z-10 drop-shadow-lg">
              {player1Score}
            </div>
          </button>

          {/* 分隔符 */}
          <div className="text-3xl font-black text-muted-foreground/20 italic">VS</div>

          {/* 玩家2 */}
          <button
            onClick={() => setSelectedPlayer(2)}
            className={`flex-1 py-6 rounded-3xl transition-all duration-300 relative overflow-hidden ${
              selectedPlayer === 2 
                ? "bg-primary/20 neon-glow" 
                : "glass hover:bg-card/80 border-transparent"
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity ${selectedPlayer === 2 ? "opacity-100" : ""}`} />
            {editingPlayer === 2 ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={confirmNameEdit}
                onKeyDown={(e) => e.key === "Enter" && confirmNameEdit()}
                className="bg-transparent text-center text-base font-bold w-full px-4 focus:outline-none relative z-10"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className="text-sm font-bold text-muted-foreground mb-2 relative z-10"
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  startEditName(2)
                }}
              >
                {player2Name}
              </div>
            )}
            <div key={player2Score} className="text-7xl font-black tabular-nums leading-none tracking-tight animate-score relative z-10 drop-shadow-lg">
              {player2Score}
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* 玩家1统计 */}
          <div className={`glass rounded-2xl p-4 transition-all duration-300 ${selectedPlayer === 1 ? "ring-1 ring-primary/30 bg-card/80" : "bg-card/40"}`}>
            <div className="text-xs font-bold text-muted-foreground text-center mb-3 truncate opacity-70">{player1Name}</div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-background/30 rounded-lg p-1.5">
                <div className="text-xl font-black text-primary">{player1Stats.normalWins}</div>
                <div className="text-[10px] font-medium text-muted-foreground">普胜</div>
              </div>
              <div className="bg-background/30 rounded-lg p-1.5">
                <div className="text-xl font-black text-emerald-500">{player1Stats.runOuts}</div>
                <div className="text-[10px] font-medium text-muted-foreground">接清</div>
              </div>
              <div className="bg-background/30 rounded-lg p-1.5">
                <div className="text-xl font-black text-amber-500">{player1Stats.breakAndRuns}</div>
                <div className="text-[10px] font-medium text-muted-foreground">炸清</div>
              </div>
              <div className="bg-background/30 rounded-lg p-1.5">
                <div className="text-xl font-black text-destructive">{player1Stats.fouls}</div>
                <div className="text-[10px] font-medium text-muted-foreground">犯规</div>
              </div>
            </div>
          </div>

          {/* 玩家2统计 */}
          <div className={`glass rounded-2xl p-4 transition-all duration-300 ${selectedPlayer === 2 ? "ring-1 ring-primary/30 bg-card/80" : "bg-card/40"}`}>
            <div className="text-xs font-bold text-muted-foreground text-center mb-3 truncate opacity-70">{player2Name}</div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-background/30 rounded-lg p-1.5">
                <div className="text-xl font-black text-primary">{player2Stats.normalWins}</div>
                <div className="text-[10px] font-medium text-muted-foreground">普胜</div>
              </div>
              <div className="bg-background/30 rounded-lg p-1.5">
                <div className="text-xl font-black text-emerald-500">{player2Stats.runOuts}</div>
                <div className="text-[10px] font-medium text-muted-foreground">接清</div>
              </div>
              <div className="bg-background/30 rounded-lg p-1.5">
                <div className="text-xl font-black text-amber-500">{player2Stats.breakAndRuns}</div>
                <div className="text-[10px] font-medium text-muted-foreground">炸清</div>
              </div>
              <div className="bg-background/30 rounded-lg p-1.5">
                <div className="text-xl font-black text-destructive">{player2Stats.fouls}</div>
                <div className="text-[10px] font-medium text-muted-foreground">犯规</div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => handleAction("普胜")}
            className="h-16 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground text-lg font-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-primary/20 hover:brightness-110"
          >
            普胜
          </button>
          <button
            onClick={() => handleAction("接清")}
            className="h-16 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-lg font-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-emerald-500/20 hover:brightness-110"
          >
            接清
          </button>
          <button
            onClick={() => handleAction("炸清")}
            className="h-16 bg-gradient-to-b from-amber-400 to-amber-500 text-white text-lg font-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-amber-500/20 hover:brightness-110"
          >
            炸清
          </button>
          <button
            onClick={() => handleAction("犯规")}
            className="h-16 border-2 border-destructive/50 bg-destructive/10 text-destructive text-lg font-black rounded-2xl active:scale-95 transition-all hover:bg-destructive hover:text-white hover:border-destructive"
          >
            犯规
          </button>
        </div>

        {/* 辅助操作 */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="h-12 text-sm font-medium bg-transparent"
            onClick={undoLastAction}
            disabled={actionHistory.length === 0}
          >
            <Undo2 className="w-4 h-4 mr-1.5" />
            撤销
          </Button>
          <Button variant="outline" className="h-12 text-sm font-medium bg-transparent" onClick={resetMatch}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            重置
          </Button>
          <Button
            variant="outline"
            className="h-12 text-sm font-medium bg-transparent border-destructive text-destructive hover:bg-destructive hover:text-white"
            onClick={endMatch}
          >
            <Square className="w-4 h-4 mr-1.5" />
            结束
          </Button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="fixed inset-0 bg-background/95 z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-bold">比赛设置</h2>
            <button onClick={() => setShowSettings(false)} className="p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-4 space-y-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">目标局数</label>
              <div className="grid grid-cols-5 gap-2">
                {[5, 7, 9, 11].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTargetScore(n)}
                    className={`py-3 rounded-lg font-medium text-sm ${
                      targetScore === n ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    BO{n * 2 - 1}
                  </button>
                ))}
                <button
                  onClick={() => setTargetScore(null)}
                  className={`py-3 rounded-lg font-medium text-sm ${
                    targetScore === null ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  无限
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">比赛时长</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "30分", value: 1800 },
                  { label: "1小时", value: 3600 },
                  { label: "2小时", value: 7200 },
                  { label: "无限", value: 99999 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setInitialTime(opt.value)
                      setCountdownTime(opt.value)
                    }}
                    className={`py-3 rounded-lg font-medium text-sm ${
                      initialTime === opt.value ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 比赛结束弹窗 */}
      {showEndDialog && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-card border border-border rounded-2xl p-6 text-center max-w-sm w-full shadow-2xl">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-xl font-bold text-foreground mb-1">比赛结束</h2>
            <p className="text-primary text-lg font-bold mb-3">
              {player1Score > player2Score ? player1Name : player2Score > player1Score ? player2Name : "平局"}
              {player1Score !== player2Score && " 获胜!"}
            </p>
            <div className="text-5xl font-black text-foreground mb-1 tabular-nums">
              {player1Score} : {player2Score}
            </div>
            <div className="text-sm text-muted-foreground mb-5">共进行 {totalGames} 局</div>

            {/* 最终统计对比 */}
            <div className="grid grid-cols-2 gap-3 mb-5 text-left">
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1 truncate">{player1Name}</div>
                <div className="text-xs space-y-0.5">
                  <div className="flex justify-between">
                    <span>普胜</span>
                    <span className="font-bold">{player1Stats.normalWins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>接清</span>
                    <span className="font-bold">{player1Stats.runOuts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>炸清</span>
                    <span className="font-bold">{player1Stats.breakAndRuns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>犯规</span>
                    <span className="font-bold text-destructive">{player1Stats.fouls}</span>
                  </div>
                </div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1 truncate">{player2Name}</div>
                <div className="text-xs space-y-0.5">
                  <div className="flex justify-between">
                    <span>普胜</span>
                    <span className="font-bold">{player2Stats.normalWins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>接清</span>
                    <span className="font-bold">{player2Stats.runOuts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>炸清</span>
                    <span className="font-bold">{player2Stats.breakAndRuns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>犯规</span>
                    <span className="font-bold text-destructive">{player2Stats.fouls}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={resetMatch} className="h-11 bg-transparent">
                再来一局
              </Button>
              <Button className="h-11">保存记录</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
