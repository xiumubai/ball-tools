"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronDown, ChevronRight, Inbox } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// 接口定义，应与 match-detail-page.tsx 共享
interface PlayerStats {
  name: string
  score: number
  // 8球统计
  normalWin?: number
  clearWin?: number
  breakClear?: number
  fouls?: number
  // 9球统计
  smallGold?: number
  bigGold?: number
  golden9?: number
}

interface Match {
  id: number
  type: "8球" | "9球"
  players: PlayerStats[]
  date: string
  time: string
  duration: string
  totalRounds: number
}

interface HistoryPageProps {
  onMatchClick: (match: Match) => void
}

export function HistoryPage({ onMatchClick }: HistoryPageProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 读取本地存储数据
    const loadData = () => {
      try {
        const nineBallRecords = JSON.parse(localStorage.getItem("nineBallRecords") || "[]")
        // 假设8球记录格式与9球类似，暂时没有8球记录
        const eightBallRecords = JSON.parse(localStorage.getItem("eightBallRecords") || "[]")

        const formattedMatches: Match[] = []

        // 处理9球数据
        nineBallRecords.forEach((record: any, index: number) => {
          const dateObj = new Date(record.date)
          const date = dateObj.toISOString().split('T')[0]
          const time = dateObj.toTimeString().split(' ')[0].substring(0, 5)
          
          // 格式化时长
          const durationSec = record.duration || 0
          const hrs = Math.floor(durationSec / 3600)
          const mins = Math.floor((durationSec % 3600) / 60)
          const secs = durationSec % 60
          const duration = `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`

          formattedMatches.push({
            id: dateObj.getTime() + index, // 生成唯一ID
            type: "9球",
            date,
            time,
            duration,
            totalRounds: record.gameCount || 0,
            players: record.players.map((p: any) => ({
              name: p.name,
              score: p.score,
              normalWin: p.stats.normalWin,
              smallGold: p.stats.smallGold,
              bigGold: p.stats.bigGold,
              golden9: p.stats.golden9,
              fouls: p.stats.foul
            }))
          })
        })

        // 处理8球数据 (假设结构)
        eightBallRecords.forEach((record: any, index: number) => {
             const dateObj = new Date(record.date)
             const date = dateObj.toISOString().split('T')[0]
             const time = dateObj.toTimeString().split(' ')[0].substring(0, 5)
             
             // 格式化时长
             const durationSec = record.duration || 0
             const hrs = Math.floor(durationSec / 3600)
             const mins = Math.floor((durationSec % 3600) / 60)
             const secs = durationSec % 60
             const duration = `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`

             formattedMatches.push({
               id: dateObj.getTime() + index + 10000,
               type: "8球",
               date,
               time,
               duration,
               totalRounds: record.totalRounds || 0,
               players: record.players // 假设结构已经匹配
             })
        })

        // 按时间倒序排序
        formattedMatches.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`).getTime()
            const dateB = new Date(`${b.date}T${b.time}`).getTime()
            return dateB - dateA
        })

        setMatches(formattedMatches)
      } catch (e) {
        console.error("Failed to load match records", e)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const stats = {
    total: matches.length,
    wins: matches.length > 0 ? matches.filter(m => m.players[0].score > m.players[1].score).length : 0, // 简单假设玩家1是"我"
    losses: matches.length > 0 ? matches.filter(m => m.players[0].score < m.players[1].score).length : 0,
    winRate: matches.length > 0 
      ? `${Math.round((matches.filter(m => m.players[0].score > m.players[1].score).length / matches.length) * 100)}%` 
      : "0%",
  }

  return (
    <div className="p-4 space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">比赛记录</h1>
        <button className="flex items-center gap-1 text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
          <Calendar className="w-4 h-4" />
          全部
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="bg-card border-border p-3 text-center glass">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">总场次</p>
        </Card>
        <Card className="bg-card border-border p-3 text-center glass">
          <p className="text-2xl font-bold text-primary">{stats.wins}</p>
          <p className="text-xs text-muted-foreground">胜</p>
        </Card>
        <Card className="bg-card border-border p-3 text-center glass">
          <p className="text-2xl font-bold text-destructive">{stats.losses}</p>
          <p className="text-xs text-muted-foreground">负</p>
        </Card>
        <Card className="bg-card border-border p-3 text-center glass">
          <p className="text-2xl font-bold text-accent">{stats.winRate}</p>
          <p className="text-xs text-muted-foreground">胜率</p>
        </Card>
      </div>

      {/* 比赛类型筛选 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full bg-secondary/50 p-1">
          <TabsTrigger
            value="all"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            全部
          </TabsTrigger>
          <TabsTrigger
            value="8ball"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            8球
          </TabsTrigger>
          <TabsTrigger
            value="9ball"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            9球
          </TabsTrigger>
        </TabsList>

        {matches.length === 0 && !loading ? (
            <div className="mt-10 flex flex-col items-center justify-center text-muted-foreground">
                <Inbox className="w-12 h-12 mb-2 opacity-20" />
                <p>暂无比赛记录</p>
            </div>
        ) : (
            <>
                <TabsContent value="all" className="mt-4 space-y-3">
                {matches.map((match) => (
                    <MatchCard key={match.id} match={match} onClick={() => onMatchClick(match)} />
                ))}
                </TabsContent>
                <TabsContent value="8ball" className="mt-4 space-y-3">
                {matches
                    .filter((m) => m.type === "8球")
                    .map((match) => (
                    <MatchCard key={match.id} match={match} onClick={() => onMatchClick(match)} />
                    ))}
                </TabsContent>
                <TabsContent value="9ball" className="mt-4 space-y-3">
                {matches
                    .filter((m) => m.type === "9球")
                    .map((match) => (
                    <MatchCard key={match.id} match={match} onClick={() => onMatchClick(match)} />
                    ))}
                </TabsContent>
            </>
        )}
      </Tabs>
    </div>
  )
}

function MatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const winner = match.players.reduce((prev, current) => (prev.score > current.score ? prev : current))

  return (
    <Card
      className="bg-card border-border p-4 active:bg-secondary/50 transition-colors cursor-pointer glass hover:bg-card/80"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        {/* 左侧：比赛信息 */}
        <div className="flex-1">
          {/* 比赛类型和时间 */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded font-bold ${match.type === '8球' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                {match.type}
            </span>
            <span className="text-xs text-muted-foreground">
              {match.date} {match.time}
            </span>
          </div>

          {/* 玩家和比分 */}
          <div className="flex items-center gap-4">
            {match.players.slice(0, 2).map((player, index) => (
              <div key={index} className="flex items-center gap-3 min-w-[80px]">
                {index > 0 && <span className="text-muted-foreground/30 font-black text-sm italic">VS</span>}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 ring-1 ring-border">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                      {player.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p
                      className={`text-sm font-bold truncate max-w-[60px] ${
                        player.score === winner.score ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {player.name}
                    </p>
                    <p
                      className={`text-lg font-black leading-none ${
                        player.score === winner.score ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {player.score}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {match.players.length > 2 && (
                <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">+{match.players.length - 2}</span>
            )}
          </div>
        </div>

        {/* 右侧：查看详情箭头 */}
        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-50" />
      </div>
    </Card>
  )
}
