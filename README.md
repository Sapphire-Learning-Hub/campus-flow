# CampusFlow

> 基于 React、TypeScript、Vite 与 Ant Design 的校园项目协作管理平台。

CampusFlow 面向课程项目、学生团队和社团活动，提供工作台、项目空间、工作项、成员协作与个人设置等功能。当前版本是一个独立的前端应用，支持真实后端模式和开发 Mock 模式。运行模式由 Vite 环境变量决定；主要业务页面已经完成数据接入、操作反馈、权限控制和中英文国际化。

## 当前能力

| 模块       | 已实现能力                                                                       |
| ---------- | -------------------------------------------------------------------------------- |
| 认证与会话 | 登录、注册、当前用户恢复、退出登录、受保护路由、登录后返回原访问地址             |
| 工作台     | 项目与任务指标、项目进度、近期工作项、最近动态、快捷创建入口                     |
| 项目空间   | 关键字与状态筛选、卡片/列表视图、分页、收藏、创建、编辑、详情与删除              |
| 工作项     | 关键字、项目、状态、优先级和负责人筛选，表格/看板视图，创建、编辑与删除          |
| 成员管理   | 按项目、角色和关键字筛选，添加成员、调整角色、移除成员、关联任务跳转             |
| 个人设置   | 资料更新、密码修改、头像预览、明暗/跟随系统主题、主题色、分页与默认视图偏好      |
| 权限       | 按 `owner`、`admin`、`member`、`readonly` 角色限制项目、任务与成员操作           |
| 国际化     | 简体中文与英文切换，语言持久化，Ant Design、Day.js、页面标题和 HTML 语言属性联动 |
| 页面状态   | 加载、后台刷新、空数据、请求错误、重试、操作成功/失败反馈                        |
| 响应式布局 | 可折叠侧边栏、移动端导航、顶栏搜索、个人信息抽屉                                 |

## 技术栈

- React 19 + TypeScript 6
- Vite 8
- React Router 8（Data Router、路由 Loader、页面懒加载）
- Ant Design 6 + Ant Design Icons
- Axios
- MSW 2
- i18next + react-i18next
- Day.js
- ESLint + Prettier

## 快速开始

### 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- npm

### 安装与启动

```bash
npm ci
npm run dev
```

启动后按终端提示访问应用，Vite 默认地址通常为：

```text
http://localhost:5173
```

`npm run dev` 会加载 `.env.development`；如果存在 `.env.local`，其中同名变量会覆盖开发环境文件。仓库基线的 `.env.development` 指向真实后端；如果本地文件被改成 `VITE_USE_MOCK=true`，则当前工作副本会切换到 MSW Mock 模式。

### 运行模式

| 模式            | 典型配置                                   | MSW  | 数据来源                                  | 是否依赖真实后端 |
| --------------- | ------------------------------------------ | ---- | ----------------------------------------- | ---------------- |
| 开发 + 真实后端 | `VITE_USE_MOCK=false`                      | 关闭 | `VITE_API_BASE_URL` 指向的服务            | 是               |
| 开发 + Mock     | `VITE_USE_MOCK=true` 且使用 `npm run dev`  | 开启 | 浏览器内存中的 `src/api/mock/database.ts` | 否               |
| 构建/预览       | `.env.production` 中 `VITE_USE_MOCK=false` | 关闭 | `VITE_API_BASE_URL` 指向的服务            | 是               |

MSW 的实际启动条件是：

```ts
import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === "true";
```

因此，`VITE_USE_MOCK=true` 只有在开发服务器中才会启动 Mock；生产构建和 `npm run preview` 不会因为浏览器存在 `mockServiceWorker.js` 就自动使用 Mock。

### 环境变量

真实后端模式示例：

```env
VITE_API_BASE_URL=https://xxxx/api
VITE_USE_MOCK=false
```

开发 Mock 模式示例:

```env
VITE_API_BASE_URL=/api
VITE_USE_MOCK=true
```

变量含义：

- `VITE_API_BASE_URL`：Axios 的 API 基地址；业务服务会在此基础上请求 `/auth`、`/projects`、`/tasks`、`/members` 和 `/activities` 等路径。未设置时，代码回退到 `/api`。
- `VITE_USE_MOCK`：只有精确值为字符串 `true` 且运行在 Vite 开发环境时才启用 MSW；其他情况都请求真实后端。

真实后端模式不会替用户启动数据库或 API 服务。启动前必须确保 `VITE_API_BASE_URL` 可访问；如果前端和后端不同源，后端还需要允许前端开发地址的 CORS 请求。修改环境变量后应重新启动开发服务器；生产环境变量会在 `npm run build` 时写入构建产物。

### 测试账号

以下账号由 Mock 数据库预置，只保证在 Mock 模式可用：

| 用户名     | 密码     | 角色/用途        |
| ---------- | -------- | ---------------- |
| `admin`    | `123456` | 管理员演示账号   |
| `demo`     | `123456` | 普通演示账号     |
| `member`   | `123456` | 成员权限演示账号 |
| `readonly` | `123456` | 只读权限演示账号 |

真实后端不会读取 `src/api/mock/database.ts`，也不会自动创建这些账号。

### 数据持久化

| 数据                     | 真实后端模式                                                            | Mock 模式                                                            |
| ------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 项目、工作项、成员、动态 | 写入真实后端数据库，刷新或重新打开页面仍保留                            | 只修改浏览器当前运行时的内存对象，完整刷新页面后从种子数据重新初始化 |
| 注册账号、资料和密码修改 | 由真实后端持久化                                                        | 只存在于当前 Mock 运行时，完整刷新后重置                             |
| 登录 Token               | 浏览器 `localStorage` 或 `sessionStorage`，取决于是否勾选“保持登录状态” | 同左                                                                 |
| 主题、分页大小、默认视图 | `localStorage` 的 `campus-flow:settings`                                | 同左                                                                 |
| 语言选择                 | `localStorage` 的 `campus-flow:language`                                | 同左                                                                 |

## 可用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 执行 TypeScript 项目构建并生成生产产物
npm run lint     # 运行 ESLint
npm run format   # 使用 Prettier 格式化项目文件
npm run format:check # 检查项目文件是否符合 Prettier 规范
npm run preview  # 本地预览生产构建
```

提交代码时，Husky 的 `pre-commit` 钩子会通过 lint-staged 对暂存的可格式化文件自动运行 Prettier。

## 页面与路由

| 地址                   | 页面           |
| ---------------------- | -------------- |
| `/login`               | 登录           |
| `/register`            | 注册与服务条款 |
| `/dashboard`           | 工作台         |
| `/projects`            | 项目空间       |
| `/projects/:projectId` | 项目详情       |
| `/tasks`               | 工作项管理     |
| `/members`             | 成员管理       |
| `/settings`            | 个人设置       |
| 其他地址               | 404 页面       |

除登录、注册和 404 外，其余页面均位于受保护路由下。访问受保护地址时，父路由 Loader 会校验本地 Token 并请求当前用户；会话无效时跳转到登录页，并保留原访问地址。

## 接口与数据源

页面只通过 `src/services/` 访问 API，真实后端和 MSW 使用同一套路径、请求参数和响应结构。切换数据源时不需要修改页面组件，实际请求地址由 `VITE_API_BASE_URL` 决定。

### 真实后端依赖

当前生产环境配置使用：

```text
https://xxxxxx/api
```

所有接口都应返回统一外层结构：

```ts
interface ApiResponse<T> {
  data: T;
  message: string;
  requestId: string;
  timestamp: string;
}
```

`/projects` 和 `/tasks` 的列表接口还需要支持 `page`、`pageSize` 以及页面使用的筛选参数，并在 `data` 中返回：

```ts
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

前端会从本地存储读取 Token，并在请求中发送：

```http
Authorization: Bearer <token>
```

真实后端负责数据库持久化、用户认证、权限校验和业务数据一致性。前端虽然会隐藏、禁用或拦截无权限操作，但这些检查不能替代后端鉴权。

### MSW Mock API

只有在开发服务器且 `VITE_USE_MOCK=true` 时，MSW 才会拦截 `/api` 请求。Mock 数据库和 handler 位于 `src/api/mock/`，启动时由 `createSeedDatabase()` 创建种子数据，并在浏览器运行时内存中处理登录、项目、工作项、成员和动态接口。

Mock handler 会验证登录身份、项目成员关系和角色权限，适合：

- 没有真实后端时运行和验收前端页面；
- 演示不同角色的页面权限；
- 验证加载、空数据、错误、分页和操作反馈。

## 权限模型

| 角色       | 项目能力   | 工作项能力                   | 成员能力           |
| ---------- | ---------- | ---------------------------- | ------------------ |
| `owner`    | 编辑、删除 | 创建、编辑、删除、分配       | 添加、改角色、移除 |
| `admin`    | 编辑       | 创建、编辑、删除、分配       | 只读               |
| `member`   | 只读       | 创建；编辑分配给自己的工作项 | 只读               |
| `readonly` | 只读       | 只读                         | 只读               |

项目所有者角色不可在成员管理页被直接修改或移除。

## 国际化与本地偏好

应用支持 `zh-CN` 与 `en`，首次访问时按以下顺序确定语言：

1. URL 查询参数，例如 `?lng=en`。
2. `localStorage` 中保存的用户选择。
3. 浏览器首选语言。
4. HTML 默认语言。

语言资源位于 `public/locales/{language}/common.json`。切换语言时，业务界面、Ant Design 内置文案、Day.js locale、`<html lang>`、页面标题和描述会同步更新。

以下偏好保存在 `localStorage` 的 `campus-flow:settings` 中：

- 浅色、深色或跟随系统的主题模式；
- 主题色；
- 默认分页大小；
- 项目默认视图；
- 工作项默认视图。

## 项目结构

```text
campus-flow/
├─ docs/                     # 实现说明、问题复盘与 QA 记录
├─ public/
│  ├─ locales/              # 中英文运行时语言包
│  └─ mockServiceWorker.js   # MSW 生成的 Service Worker
└─ src/
   ├─ api/mock/              # 内存数据库、鉴权工具与 Mock handlers
   ├─ components/            # 公共组件和实体编辑抽屉
   ├─ constants/             # 状态、角色、优先级等选项
   ├─ contexts/              # 全局设置上下文
   ├─ hooks/                 # 页面数据、当前用户、设置等复用逻辑
   ├─ i18n/                  # i18next 初始化与语言同步
   ├─ layouts/               # 应用公共布局
   ├─ pages/                 # 路由页面
   ├─ routes/                # 路由定义与登录守卫
   ├─ services/              # 认证及业务 API 封装
   ├─ style/                 # 全局样式
   ├─ types/                 # 领域模型与接口类型
   └─ utils/                 # 请求、权限、日期、集合与 ID 工具
```

主要数据流：

```text
页面 / 表单
    ↓
services + Axios
    ↓
逻辑 API 路径（如 /api/projects）
    ↓
MSW handlers（仅 DEV && VITE_USE_MOCK=true）
或 VITE_API_BASE_URL 指向的真实后端
    ↓
统一 ApiResponse
```

## 参考资料

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [React Router](https://reactrouter.com/)
- [Ant Design](https://ant.design/)
- [Mock Service Worker](https://mswjs.io/)
- [i18next](https://www.i18next.com/)
