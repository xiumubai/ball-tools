"use client"

import { Trophy, Settings, HelpCircle, AlertCircle, Database, Trash2, Github } from "lucide-react"
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

export function ProfilePage() {
  const handleClearData = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="p-4 space-y-6">
      {/* 头部区域 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-foreground">设置与关于</h1>
        <p className="text-muted-foreground text-sm">管理您的本地数据和应用偏好设置</p>
      </div>

      {/* 数据管理 */}
      <Card className="bg-card border-border overflow-hidden glass">
        <div className="p-4 border-b border-border/50">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            数据管理
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">本地存储说明</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                本应用采用离线模式，所有比赛记录、统计数据和设置均保存在您的设备浏览器缓存中。
                <br />
                <span className="text-amber-500/80">注意：清除浏览器缓存将导致所有数据永久丢失。</span>
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full h-12">
                <Trash2 className="w-4 h-4 mr-2" />
                清除所有数据
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>确定要清除所有数据吗？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作将永久删除您的所有比赛记录、统计数据和个性化设置。此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  确认清除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {/* 关于应用 */}
      <Card className="bg-card border-border overflow-hidden glass">
        <div className="p-4 border-b border-border/50">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            关于应用
          </h2>
        </div>
        <div className="divide-y divide-border/50">
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm text-foreground">当前版本</span>
            <span className="text-sm font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">v1.0.0</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm text-foreground">开发者</span>
            <span className="text-sm text-muted-foreground">Trae AI</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
          >
            <span className="text-sm text-foreground flex items-center gap-2">
              <Github className="w-4 h-4" />
              开源地址
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
      </Card>

      {/* 底部版权 */}
      <div className="text-center py-8 space-y-2">
        <p className="text-xs text-muted-foreground">
          © 2024 Billiard Scoreboard. All rights reserved.
        </p>
        <p className="text-[10px] text-muted-foreground/50">
          Designed for Pool Lovers
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
