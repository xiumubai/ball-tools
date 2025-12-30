"use client"

import { Trophy, Target, Zap, Clock, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface HomePageProps {
  onStartMatch: (type: "8ball" | "9ball") => void
}

export function HomePage({ onStartMatch }: HomePageProps) {
  return (
    <div className="p-4 space-y-6">
      {/* 顶部欢迎区域 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-foreground">台球计分器</h1>
        <p className="text-muted-foreground text-sm">专业的台球比赛记分工具，随时随地记录精彩瞬间</p>
      </div>

      {/* 快速开始比赛 */}
      <Card className="bg-card border-border p-6 relative overflow-hidden glass">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-card-foreground mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            开始比赛
          </h2>
          <p className="text-muted-foreground text-sm mb-6">选择一种比赛模式，立即开始记分</p>
          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={() => onStartMatch("8ball")}
              className="h-16 text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">8</span>
                <span>中式黑八</span>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
            </Button>
            
            <Button
              onClick={() => onStartMatch("9ball")}
              className="h-16 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">9</span>
                <span>九球追分</span>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 功能特性介绍 */}
      <div>
        <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider opacity-70">功能特性</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card/50 border-border p-4 glass hover:bg-card/80 transition-colors">
            <Trophy className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-bold text-foreground mb-1">专业规则</h4>
            <p className="text-xs text-muted-foreground">内置标准8球与9球追分规则，支持自定义设置</p>
          </Card>
          <Card className="bg-card/50 border-border p-4 glass hover:bg-card/80 transition-colors">
            <Clock className="w-8 h-8 text-amber-500 mb-3" />
            <h4 className="font-bold text-foreground mb-1">历史记录</h4>
            <p className="text-xs text-muted-foreground">本地保存比赛记录，随时回顾过往战绩</p>
          </Card>
          <Card className="bg-card/50 border-border p-4 glass hover:bg-card/80 transition-colors">
            <Target className="w-8 h-8 text-emerald-500 mb-3" />
            <h4 className="font-bold text-foreground mb-1">数据统计</h4>
            <p className="text-xs text-muted-foreground">详细的胜率、炸清、接清数据分析</p>
          </Card>
          <Card className="bg-card/50 border-border p-4 glass hover:bg-card/80 transition-colors">
            <Users className="w-8 h-8 text-blue-500 mb-3" />
            <h4 className="font-bold text-foreground mb-1">多人模式</h4>
            <p className="text-xs text-muted-foreground">支持2-3人同场竞技，灵活适应不同场景</p>
          </Card>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="bg-secondary/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          温馨提示：本应用为本地离线模式，所有比赛数据仅保存在当前设备中。清理浏览器缓存可能会导致数据丢失。
        </p>
      </div>
    </div>
  )
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
