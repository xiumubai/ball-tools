"use client"

import { useState, useEffect } from "react"
import { Target, Zap, Users, Play, Clock, ArrowRight, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MatchLobbyPageProps {
  onSelectMatch: (type: "8ball" | "9ball", mode?: 2 | 3, matchId?: string) => void
}

export function MatchLobbyPage({ onSelectMatch }: MatchLobbyPageProps) {
  const [ongoingMatches, setOngoingMatches] = useState<any[]>([])

  useEffect(() => {
    // 检查是否有正在进行的比赛
    const savedMatches = localStorage.getItem("ongoingMatches")
    if (savedMatches) {
      try {
        const parsed = JSON.parse(savedMatches)
        if (Array.isArray(parsed)) {
          setOngoingMatches(parsed.sort((a, b) => b.startTime - a.startTime))
        }
      } catch (e) {
        console.error("Failed to parse ongoing matches", e)
      }
    }
  }, [])

  const handleContinue = (match: any) => {
    onSelectMatch(match.type, match.mode, match.id)
  }

  const handleDiscard = (matchId: string) => {
    const newMatches = ongoingMatches.filter(m => m.id !== matchId)
    setOngoingMatches(newMatches)
    localStorage.setItem("ongoingMatches", JSON.stringify(newMatches))
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-foreground">比赛大厅</h1>
        <p className="text-muted-foreground text-sm">选择比赛模式，或继续进行中的比赛</p>
      </div>

      {/* 正在进行的比赛 */}
      {ongoingMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              正在进行 ({ongoingMatches.length})
            </h2>
          </div>
          
          <div className="grid gap-4">
            {ongoingMatches.map((match) => (
              <Card key={match.id} className="bg-card border-primary/50 p-4 glass relative overflow-hidden ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Play className="w-24 h-24 text-primary" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          match.type === '8ball' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                        }`}>
                          {match.type === '8ball' ? '中式黑八' : '九球追分'}
                        </span>
                        {match.mode && (
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                            {match.mode}人模式
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        开始于 {new Date(match.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => handleContinue(match)} className="flex-1 bg-primary text-primary-foreground font-bold">
                      继续比赛
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="px-3 border-destructive/50 text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>放弃这场比赛？</AlertDialogTitle>
                          <AlertDialogDescription>
                            当前比赛进度将丢失，且不会保存到历史记录中。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDiscard(match.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            确认放弃
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 新比赛入口 */}
      <div className="grid grid-cols-1 gap-4">
        <h2 className="font-bold text-foreground text-sm mt-2">新比赛</h2>
        
        {/* 8球入口 */}
        <button
          onClick={() => onSelectMatch("8ball")}
          className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 text-left transition-all hover:ring-2 hover:ring-emerald-500/50 hover:bg-card/80"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">中式黑八</h3>
              <p className="text-sm text-muted-foreground mt-1">标准8球规则，支持炸清/接清统计</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* 9球入口组 */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelectMatch("9ball", 2)}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-5 text-left transition-all hover:ring-2 hover:ring-amber-500/50 hover:bg-card/80"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-colors" />
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="font-bold text-foreground">9球追分</h3>
              <p className="text-xs text-muted-foreground mt-1">2人对战模式</p>
            </div>
          </button>

          <button
            onClick={() => onSelectMatch("9ball", 3)}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-5 text-left transition-all hover:ring-2 hover:ring-orange-500/50 hover:bg-card/80"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/20 transition-colors" />
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-bold text-foreground">9球三人</h3>
              <p className="text-xs text-muted-foreground mt-1">3人混战模式</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}