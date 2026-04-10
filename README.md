# 基于本地知识库的 AI 问答助手

基于 LangChain + ChromaDB + Ant Design X 构建的本地知识库 AI 问答助手。

## 功能特性

- ✅ 自动初始化知识库 - 页面加载时自动调用 `/api/ingest` 构建知识库
- ✅ 骨架屏加载 - 初始化过程中显示骨架屏，完成后显示聊天界面
- ✅ 流式对话气泡 - 使用 `@ant-design/x` Bubble 组件，支持打字动画
- ✅ 快捷提问 - Prompts 组件点击直接发送提问
- ✅ 斜杠触发建议 - 输入 `/` 触发快捷建议
- ✅ 右侧思维链 - 显示完整的推理过程
- ✅ Docker 启动 ChromaDB - 提供 docker-compose.yml 一键启动

## 技术栈

- **框架**: Next.js 16 + React 19
- **AI 框架**: LangChain
- **向量数据库**: ChromaDB (Docker 启动)
- **UI 组件**: Ant Design X + Ant Design
- **嵌入模型**: Qwen/Qwen3-Embedding-8B (硅基流动)
- **大模型**: deepseek-ai/DeepSeek-V3.2 (硅基流动)

## 快速开始

### 1. 启动 ChromaDB

```bash
docker-compose up -d
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# 硅基流动 API Key
SILICONFLOW_API_KEY=your-api-key-here
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 启动开发服务器

```bash
pnpm dev
```

### 5. 访问应用

打开浏览器访问 <http://localhost:3000>

## 项目结构

```
.
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts       # AI 聊天接口
│   │   └── ingest/
│   │       └── route.ts      # 知识库初始化接口
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # 主页面
├── docker-compose.yml          # Docker Compose 配置
├── package.json
└── README.md
```

## 工作流程

1. **初始化知识库**: 页面打开 → 自动调用 `/api/ingest` → 读取 `public/data/profile.pdf` → 分割文档 → 存入 ChromaDB → 完成后进入聊天界面
2. **用户提问**: 用户输入/点击快捷提问 → 添加用户消息 → 添加空 AI 气泡 → 调用 `/api/chat` → 检索知识库 → 生成回答 → 更新 AI 气泡 → 更新思维链

## 配置说明

### 修改默认问题

在 `app/page.tsx` 中修改 `Prompts` 组件的 items 即可：

```typescript
<Prompts
  items={[
    {
      key: "1",
      label: "工作几年了？",
      icon: <BulbOutlined style={{ color: "#FFD700" }} />,
    },
    {
      key: "2",
      label: "工作了几家公司？",
      icon: <BulbOutlined style={{ color: "#FFD700" }} />,
    },
  ]}
/>
```

### 修改推荐建议

在 `app/page.tsx` 中修改 `Suggestion` 组件的 items 即可：

```typescript
<Suggestion
  items={[
    { label: "姓名", value: "姓名" },
    { label: "学历", value: "学历" },
  ]}
  onSelect={(value) => setValue(`[${value}]:`)}
>
```

