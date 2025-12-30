# 追分王 · 台球计分小程序

一个用于中式黑八与九球追分的微信小程序，支持断点续打、比赛历史记录与本地持久化存储。界面采用深色主题与台球绿强调色，强调可读性与层次感。

![小程序二维码](docs/qcode.jpg)

## 功能特性
- 八球与九球两种计分模式，支持两人与三人九球模式
- 比赛计时，暂停/继续后可自动补齐计时差
- 断点续打：比赛快照本地持久化，退出后可继续比赛
- 长按玩家姓名可重命名（仅支持中文，最多 4 字）
- 比赛结束写入历史记录，重开比赛清理快照并重置数据
- 进行中的比赛列表展示与一键继续

## 页面与导航
- 首页：`pages/index/index`
- 比赛大厅：`pages/match/match`（开始八球/九球、查看并继续进行中比赛）
- 九球追分：`pages/nine-ball/nine-ball`
- 中式黑八：`pages/eight-ball/eight-ball`
- 历史列表：`pages/history/history`
- 历史详情：`pages/history-detail/history-detail`
- 我的：`pages/profile/profile`

## 操作说明
- 开始/暂停：点击计时器按钮（播放/暂停），页面会在开始与暂停时持久化当前快照
- 计分操作：在各模式页面点击操作按钮（如普胜、犯规等），自动更新分数与局数
- 修改姓名：长按玩家卡片上的姓名，弹窗修改；校验规则为中文 1–4 字（`pages/eight-ball/eight-ball.js:243-247`）
- 结束比赛：确认后写入历史、清理当前快照与进行中条目（八球：`pages/eight-ball/eight-ball.js:282-296`；九球：`pages/nine-ball/nine-ball.js:334-342`）
- 重开比赛：确认作废并重置当前页数据，同时清理快照与进行中条目（八球：`pages/eight-ball/eight-ball.js:329-337`；九球：`pages/nine-ball/nine-ball.js:357-365`）
- 继续比赛：在比赛大厅选择进行中比赛进入（`pages/match/match.js:22-41`）

## 计分规则（默认）
- 九球追分：`utils/storage.js:69-75`
  - `foul` 犯规：1
  - `normal` 普胜：4
  - `xiaojin` 小金：7
  - `dajin` 大金：10
  - `huangjin9` 黄金9：4
- 中式黑八：页面内按“普胜 / 接清 / 炸清 / 犯规”等操作更新分与统计（参考 `pages/eight-ball/eight-ball.js:70-117`）

## 本地存储约定
- 进行中比赛列表：`ongoingMatches`（`utils/storage.js:24-29`）
- 八球当前快照：`zhongba_match_current`（`utils/storage.js:31-35`）
- 八球历史记录：`zhongba_match_history`（`utils/storage.js:36-47`）
- 九球规则：`zhuifen_rules`（`utils/storage.js:69-75`）
- 九球当前快照：`zhuifen_match_current`（`utils/storage.js:50-54`）
- 九球历史记录：`zhuifen_match_history`（`utils/storage.js:55-66`）
- 孤儿快照清理：`cleanupOrphans()` 会删除所有不在进行中列表中的快照键（`utils/storage.js:24-35`），并在开始/结束/重开比赛时调用（八球：`pages/eight-ball/eight-ball.js:123, 282-286, 329-331`；九球：`pages/nine-ball/nine-ball.js:367, 334-336, 357-359`）

## 设计与样式
- 深色背景渐变+径向高光，提升对比与层次（`app.wxss:1`）
- 常用色与 UI：`app.wxss` 中包含 `bg-primary`、`text-foreground` 等工具类
- 组件库：`tdesign-miniprogram@^1.12.0`（`package.json:3`）

## 开发与调试
- 使用微信开发者工具导入该项目目录
- 运行与预览小程序，查看各页面功能是否正常
- 本项目数据均存储于本地（`wx.*StorageSync`），不涉及服务端接口

## 免责声明
本项目仅用于台球记分与练习使用，不涉及用户隐私数据的云端存储；所有数据保存在本地设备中。
