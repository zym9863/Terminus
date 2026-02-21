[English](README-EN.md)

# 终焉视界 (Terminus Horizon)

一个基于 WebGL 的交互式 Web 体验。用户以第一人称视角在程序化生成的 3D 世界中漫游，随着不断前行，周围的视觉元素逐渐经历"数字风化"——从清晰的高清渲染退化为像素块、乱码，最终归于虚空。用户还可以在世界中放置"回声信标"封存消息，这些信标会随时间和访问逐渐衰减消逝。

## 功能特性

### 熵增画廊 (The Entropy Gallery)

- **程序化世界生成**：世界沿 Z 轴无限延伸，由 Chunk 系统动态加载/卸载
- **熵值系统**：距离起点越远，熵值越高，视觉崩坏越严重
  - 文明阶段 (0.0-0.2)：清晰渲染，正常光照
  - 风化阶段 (0.2-0.4)：颜色褪色，边缘噪点
  - 像素化阶段 (0.4-0.6)：分辨率降低，几何简化
  - 乱码阶段 (0.6-0.8)：顶点位移，色差效果
  - 虚空阶段 (0.8-1.0)：几何溶解，归于黑暗

### 回声信标 (Echo Beacons)

- 在世界中放置持久化消息信标
- 信标随时间和查看次数逐渐衰减消逝
- 支持查看其他玩家留下的信标

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | Svelte 5 + Vite |
| 3D 渲染 | Three.js + 自定义 GLSL Shaders |
| 后端/数据库 | Supabase (PostgreSQL + Realtime) |
| 语言 | TypeScript |

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
├── docs/
│   └── plans/              # 设计文档
├── package.json
└── vite.config.ts
```

## 快速开始

### 环境要求

- Node.js 18+
- pnpm (推荐) 或 npm

### 安装依赖

```bash
pnpm install
```

### 环境配置

复制 `.env.example` 为 `.env` 并填入你的 Supabase 配置：

```bash
cp .env.example .env
```

需要配置以下环境变量：
- `VITE_SUPABASE_URL` - Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥

### 开发运行

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 操作说明

| 按键 | 功能 |
|------|------|
| WASD | 移动 |
| 鼠标 | 视角控制 |
| E | 放置信标 |
| F | 查看信标 |
| ESC | 退出/解锁鼠标 |

## 开发资源

- [设计文档](docs/plans/2026-02-21-terminus-horizon-design.md)
- [实现计划](docs/plans/2026-02-21-terminus-horizon-implementation.md)

## IDE 推荐

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

## License

MIT
