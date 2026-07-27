# CampusFlow

> 基于 React、TypeScript、Vite 与 Ant Design 的校园项目协作管理平台。

CampusFlow 面向课程项目、学生团队和社团活动，提供工作台、项目空间、工作项、成员协作与个人设置等功能。当前版本是一个可独立运行的前端演示应用：开发环境通过 MSW 提供内存 Mock API，主要业务页面已经完成数据接入、操作反馈、权限控制和中英文国际化。

## 当前能力

| 模块 | 已实现能力 |
| --- | --- |
| 认证与会话 | 登录、注册、当前用户恢复、退出登录、受保护路由、登录后返回原访问地址 |
| 工作台 | 项目与任务指标、项目进度、近期工作项、最近动态、快捷创建入口 |
| 项目空间 | 关键字与状态筛选、卡片/列表视图、分页、收藏、创建、编辑、详情与删除 |
| 工作项 | 关键字、项目、状态、优先级和负责人筛选，表格/看板视图，创建、编辑与删除 |
| 成员管理 | 按项目、角色和关键字筛选，添加成员、调整角色、移除成员、关联任务跳转 |
| 个人设置 | 资料更新、密码修改、头像预览、明暗/跟随系统主题、主题色、分页与默认视图偏好 |
| 权限 | 按 `owner`、`admin`、`member`、`readonly` 角色限制项目、任务与成员操作 |
| 国际化 | 简体中文与英文切换，语言持久化，Ant Design、Day.js、页面标题和 HTML 语言属性联动 |
| 页面状态 | 加载、后台刷新、空数据、请求错误、重试、操作成功/失败反馈 |
| 响应式布局 | 可折叠侧边栏、移动端导航、顶栏搜索、个人信息抽屉 |

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

演示账号：

```text
用户名：admin
密码：123456
```

也可以在注册页创建临时账号。Mock 数据只在当前页面会话中保存，完整刷新后新账号及业务数据变更会被重置。

### 环境变量

开发环境 `.env.development`：

```env
VITE_API_BASE_URL=/api
VITE_USE_MOCK=true
```

生产环境 `.env.production` 默认关闭 Mock：

```env
VITE_API_BASE_URL=/api
VITE_USE_MOCK=false
```

关闭 Mock 后需要提供遵循当前 `/api` 数据约定的后端服务。若只需本地功能演示，请使用开发模式。

## 可用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 执行 TypeScript 项目构建并生成生产产物
npm run lint     # 运行 ESLint
npm run preview  # 本地预览生产构建
```
## 页面与路由

| 地址 | 页面 |
| --- | --- |
| `/login` | 登录 |
| `/register` | 注册与服务条款 |
| `/dashboard` | 工作台 |
| `/projects` | 项目空间 |
| `/projects/:projectId` | 项目详情 |
| `/tasks` | 工作项管理 |
| `/members` | 成员管理 |
| `/settings` | 个人设置 |
| 其他地址 | 404 页面 |

除登录、注册和 404 外，其余页面均位于受保护路由下。访问受保护地址时，父路由 Loader 会校验本地 Token 并请求当前用户；会话无效时跳转到登录页，并保留原访问地址。

## Mock API

开发模式下，MSW 会拦截 `/api` 请求。页面只通过 `src/services/` 访问数据，因此关闭 Mock 后可以在不改页面组件的前提下对接真实后端。

| 领域 | 接口能力 |
| --- | --- |
| 认证 | 登录、注册、当前用户、资料更新、修改密码、退出登录 |
| 项目 | 分页查询、详情、创建、更新、删除 |
| 工作项 | 条件查询、详情、创建、更新、删除 |
| 成员 | 查询项目成员、添加成员、修改角色、移除成员 |
| 动态 | 按项目查询、限制返回数量 |

接口统一返回以下结构：

```ts
interface ApiResponse<T> {
  data: T;
  message: string;
  requestId: string;
  timestamp: string;
}
```

Mock handler 会同时验证登录身份、项目成员关系和角色权限。前端也会提前隐藏、禁用或拦截无权限操作，但最终权限判断仍应由真实后端负责。

## 权限模型

| 角色 | 项目能力 | 工作项能力 | 成员能力 |
| --- | --- | --- | --- |
| `owner` | 编辑、删除 | 创建、编辑、删除、分配 | 添加、改角色、移除 |
| `admin` | 编辑 | 创建、编辑、删除、分配 | 只读 |
| `member` | 只读 | 创建；编辑分配给自己的工作项 | 只读 |
| `readonly` | 只读 | 只读 | 只读 |

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
/api
    ↓
MSW handlers（开发环境）或真实后端
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
