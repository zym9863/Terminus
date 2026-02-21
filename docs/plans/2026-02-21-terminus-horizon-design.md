# 终焉视界 (Terminus Horizon) — 设计文档

## 概述

"终焉视界"是一个基于 WebGL 的交互式 Web 体验。用户以第一人称视角在程序化生成的 3D 世界中漫游，随着不断前行，周围的视觉元素逐渐经历"数字风化"——从清晰的高清渲染退化为像素块、乱码，最终归于虚空。用户还可以在世界中放置"回声信标"封存消息，这些信标会随时间和访问逐渐衰减消逝。

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | Svelte 5 + Vite |
| 3D 渲染 | Three.js + 自定义 GLSL Shaders |
| 后端/数据库 | Supabase (PostgreSQL + Realtime) |
| 语言 | TypeScript |
| 部署 | Vercel / Cloudflare Pages |

## 项目结构

```
terminus/
├── src/
│   ├── lib/
│   │   ├── engine/         # Three.js 场景、相机、渲染循环
│   │   ├── world/          # Chunk 生成、程序化内容
│   │   ├── shaders/        # GLSL vertex/fragment shaders
│   │   ├── entropy/        # 熵值系统、崩坏效果管理
│   │   ├── beacons/        # 信标系统（放置、衰减、渲染）
│   │   ├── controls/       # 第一人称控制器
│   │   └── supabase/       # Supabase 客户端、数据操作
│   ├── components/         # Svelte UI 组件（HUD、信标编辑器）
│   ├── App.svelte
│   └── main.ts
├── public/
├── package.json
└── vite.config.ts
```

## 核心功能一：熵增画廊 (The Entropy Gallery)

### 世界架构：线性深渊

世界沿 Z 轴无限延伸，用户从"文明起点"出发向前行进。距离起点越远，熵值越高，视觉崩坏越严重。

### Chunk 系统

世界由沿 Z 轴排列的 Chunk 组成，每个 Chunk 30×30×30 单位。

- **预加载策略：** 玩家前方加载 5 个 Chunk，身后保留 2 个，更远的回收销毁
- **程序化内容：** Simplex Noise 生成几何体（柱体、碎片、漂浮方块、废墟结构），Seed 基于 Chunk 索引确定性生成
- **视觉分层：** 建筑残骸（大型几何体）、碎片（中型粒子群）、微尘（小型粒子系统）

### 熵值与崩坏阶段

核心参数 `entropy`（0.0 ~ 1.0），由玩家 Z 坐标映射：

| 熵值范围 | 阶段名 | 视觉效果 |
|---------|--------|---------|
| 0.0 - 0.2 | 文明 | 清晰渲染，正常光照，几何体完整 |
| 0.2 - 0.4 | 风化 | 颜色褪色，边缘噪点抖动，纹理轻微扭曲 |
| 0.4 - 0.6 | 像素化 | 分辨率逐步降低（后处理像素化 shader），几何体简化为方块 |
| 0.6 - 0.8 | 乱码 | 顶点位移剧烈，UV 扭曲产生乱码纹理，颜色通道分离（色差） |
| 0.8 - 1.0 | 虚空 | 几何体溶解为粒子，背景渐变为纯黑，最终只剩零星闪烁点 |

### Shader 管线

- **Vertex Shader：** 接收 `entropy` uniform，控制顶点位移、几何简化
- **Fragment Shader：** 控制颜色衰减、像素化、色差、噪点叠加
- **Post-processing：** 全屏后处理 Pass 实现像素化降分辨率、Bloom 衰减、VHS 扫描线

## 核心功能二：回声信标 (Echo Beacons)

### 数据模型

```sql
beacons (
  id          UUID PRIMARY KEY,
  position_x  FLOAT,
  position_y  FLOAT,
  position_z  FLOAT,
  message     TEXT,
  author      TEXT,
  created_at  TIMESTAMPTZ,
  view_count  INT DEFAULT 0,
  noise_level FLOAT DEFAULT 0
)
```

### 衰减机制

信标的 `noise_level` 由两个因素驱动：

1. **时间衰减：** 每 24 小时 noise_level += 0.05（约 20 天后完全消逝）
2. **查看衰减：** 每次被其他用户查看 noise_level += 0.02

客户端实时计算：`effective_noise = min(1.0, base_noise + time_decay + view_decay)`

### 视觉呈现

| noise_level | 效果 |
|-------------|------|
| 0.0 - 0.3 | 光柱清晰，文字完整可读 |
| 0.3 - 0.6 | 光芒闪烁，文字部分替换为乱码符号（█▓░） |
| 0.6 - 0.9 | 微弱光点，文字大部分不可辨认 |
| 0.9 - 1.0 | 完全消逝，从世界中移除 |

### 交互流程

1. 按 `E` 打开信标放置面板
2. 输入消息（最多 280 字符）和署名（可选，最多 30 字符）
3. 确认后信标插入 Supabase，在 3D 世界中渲染为发光光柱
4. 其他玩家靠近信标时高亮提示，按 `F` 查看内容
5. 查看时触发 view_count 递增

## UI/HUD

### HUD 元素

- **左下角：** 坐标 + 熵值指示器（蓝→红渐变色条）
- **右上角：** 附近可见信标数量
- **中下方：** 交互提示（"按 E 放置信标" / "按 F 查看信标"）
- **准心：** 中央十字准星，随熵值增加逐渐扭曲/抖动

### 信标编辑面板

- 暂停第一人称控制、解锁鼠标
- 半透明暗色背景 + 居中编辑卡片
- 消息输入 + 署名输入 + 确认/取消

### 信标查看面板

- 靠近信标按 F 打开
- 显示消息（根据 noise_level 乱码化）、创建时间、查看次数
- 关闭后恢复控制

### 入口体验

- 加载画面：从虚空中浮现标题"终焉视界 / TERMINUS"
- 操作提示（WASD/鼠标/E/F）
- 点击"进入"后锁定鼠标，开始漫游

## 后续迭代

- 环境音效：随熵值变化（低频嗡鸣 → 静电噪音 → 寂静）
- 移动端适配：触控控制
- 社交功能：信标点赞/回复
