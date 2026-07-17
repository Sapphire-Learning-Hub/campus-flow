# CampusFlow

> 基于 React、TypeScript、Vite 与 Ant Design 的校园项目协作管理平台。

CampusFlow 面向课程项目、学生团队与社团活动，提供项目空间、工作项、成员协作、动态记录和个人设置等功能。项目当前处于前端功能联调阶段：主要业务页面已经完成静态实现，登录与注册已接入本地 Mock 接口，项目、任务、成员和动态的 API/service 仍未完成。

## 项目完成情况

> 盘点日期：2026-07-17。`已完成` 表示当前范围内可用，`部分完成` 表示界面或基础链路可用但仍缺少关键联动。

| 模块 | 状态 | 当前实现 | 尚未完成 |
| --- | --- | --- | --- |
| 工程基础 | 已完成 | Vite 8、React 19、TypeScript 6、ESLint、代码分包、`@/*` 路径别名 | 可按 Vite 8 提示迁移原生 tsconfig paths 配置 |
| 路由 | 已完成 | 登录、注册、工作台、项目列表、项目详情、工作项、成员、设置和 404 路由；业务页面懒加载 | 暂无登录态路由守卫 |
| 公共布局 | 部分完成 | 侧边导航、顶栏、面包屑、个人抽屉、折叠导航及响应式样式 | 顶栏用户信息仍为静态数据；移动端抽屉判断尚未接入真实媒体查询 |
| 登录 / 注册 | 部分完成 | 表单校验、提交状态、错误提示、MSW 认证接口、Token 本地/会话存储 | 缺少全局认证上下文、登录态恢复、路由守卫；退出按钮尚未调用退出接口 |
| 工作台 | 静态完成 | 指标、项目进展、截止任务和最近动态布局 | 数据和操作按钮均未接入 service |
| 项目空间 | 静态完成 | 项目概览、卡片/列表切换、项目详情及成员/工作项/动态展示 | 筛选、收藏、创建、编辑、删除和详情参数尚未接入数据层 |
| 工作项 | 静态完成 | 指标、表格/看板切换、状态/阶段/优先级展示 | 搜索筛选、创建编辑、状态流转和 API 数据接入 |
| 成员 | 静态完成 | 项目选择、成员表格、角色和任务数展示 | 查询筛选、添加、删除、权限管理和 API 数据接入 |
| 个人设置 | 部分完成 | 资料、外观、偏好设置表单；设置页具备桌面/移动布局 | 保存目前只做前端校验与成功提示，主题和偏好未持久化 |
| Mock API / service | 未完成 | 认证链路可用；项目、任务、成员和动态已有初步 handler 与 service 代码 | 仍需补齐并验收业务接口、异常处理和页面接入；Mock 数据仅保存在内存中 |
| 测试与构建 | 部分完成 | `npm run build` 通过；`npm run lint` 无错误 | 暂无单元、集成或端到端测试脚本；Lint 有 1 条 MSW 生成文件警告 |

## 当前可用功能

- 登录和注册表单可通过 MSW 完成请求，并按“保持登录状态”选择 `localStorage` 或 `sessionStorage` 保存 Token。
- 项目空间支持卡片与列表两种静态视图，项目详情页已完成概览、工作项、成员和动态区域。
- 工作项页面支持表格与看板两种静态视图。
- 设置页支持个人资料校验、主题模式/主题色选择以及响应式移动端折叠布局。
- 开发环境已搭建 MSW、统一响应结构和 Axios 请求基础；项目、任务、成员和动态的 handler/service 仍按未完成处理。

## 页面与数据接入状态

| 地址 | 页面能力 | 数据来源 |
| --- | --- | --- |
| `/login` | 登录校验、请求状态、错误反馈、登录后跳转 | 已接入 Mock API |
| `/register` | 注册校验、服务条款弹窗、注册后跳转 | 已接入 Mock API |
| `/dashboard` | 指标、项目进度、截止任务、最近动态 | 组件内静态数据 |
| `/projects` | 项目汇总、卡片/列表切换、筛选区 | 组件内静态数据 |
| `/projects/:projectId` | 项目概览、任务、成员、动态 | 固定静态数据，暂未读取 `projectId` |
| `/tasks` | 工作项汇总、表格/看板切换、筛选区 | 组件内静态数据 |
| `/members` | 项目成员表格与角色展示 | 组件内静态数据 |
| `/settings` | 资料、外观、偏好设置 | 组件本地状态，刷新后重置 |
| 其他地址 | 404 页面 | — |

## Mock API

开发环境通过 MSW 拦截 `/api` 请求：

| 领域 | 状态 | 当前情况 |
| --- | --- | --- |
| 认证 | 部分完成 | 登录/注册已接入；当前用户与退出登录待接入 |
| 项目 API/service | 未完成 | 已有查询和 CRUD 初步代码，尚未完成页面联调与功能验收 |
| 任务 API/service | 未完成 | 已有条件查询和 CRUD 初步代码，尚未完成页面联调与功能验收 |
| 成员 API/service | 未完成 | 已有成员查询初步代码，尚未完成接口能力、页面联调与功能验收 |
| 动态 API/service | 未完成 | 已有动态查询初步代码，尚未完成接口能力、页面联调与功能验收 |

Mock 数据来自 `src/api/mock/database.ts` 的内存种子数据，刷新页面后新增或修改的数据会重置。Token 会根据登录选项保存在浏览器本地存储或会话存储中。

## 技术栈

- React 19 + TypeScript 6
- Vite 8
- React Router 8
- Ant Design 6 + Ant Design Icons
- Axios
- MSW 2
- Day.js
- ESLint + Prettier

## 本地运行

建议使用 Node.js 22 LTS 或更新版本。

```bash
npm install
npm run dev
```

Vite 默认会在终端输出访问地址，通常为 `http://localhost:5173`。

开发环境的 `.env.development` 已默认启用 Mock：

```env
VITE_API_BASE_URL=/api
VITE_USE_MOCK=true
```

可使用以下演示账号：

```text
用户名：admin
密码：123456
```

也可以在注册页创建临时账号。由于 Mock 数据只保存在内存中，新注册账号会在页面刷新后丢失。

生产环境的 `.env.production` 默认设置 `VITE_USE_MOCK=false`，部署时需要提供与 `/api` 约定匹配的真实后端服务；如仅进行本地演示，请使用开发模式。

## 可用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # TypeScript 检查并生成生产构建
npm run lint     # 运行 ESLint
npm run preview  # 预览生产构建
```

最近一次检查结果（2026-07-17）：

- `npm run build`：通过。
- `npm run lint`：0 个错误，1 个来自 `public/mockServiceWorker.js` 的生成文件警告。
- 自动化测试：尚未配置。

## 目录说明

```text
src/
├─ api/mock/            # MSW Worker、种子数据库、响应工具与接口 handlers
├─ assets/              # 图片等静态资源
├─ components/common/   # 品牌、头像、页面标题等公共组件
├─ contexts/            # 全局上下文预留目录
├─ layouts/             # 后台公共布局
├─ pages/               # 路由页面
├─ routes/              # 路由配置
├─ services/            # 认证及各业务领域的请求封装
├─ style/               # 全局样式、设计令牌和响应式规则
├─ types/               # 领域模型与接口响应类型
└─ utils/               # Axios 实例、ID 等通用工具
```

## 下一步计划

1. 增加认证上下文和路由守卫，恢复当前用户信息，并让公共布局接入真实登录态与退出逻辑。
2. 完成项目、任务、成员和动态 API/service，并补齐接口异常处理和功能验收。
3. 将项目、任务、成员和动态页面接入 service，补齐加载、空数据和错误状态。
4. 实现项目/任务的创建、编辑、删除、筛选和状态流转，并让项目详情读取路由参数。
5. 持久化个人设置，完成全局主题和默认视图联动。
6. 修正公共布局的移动端导航判断，完成多尺寸交互验收。
7. 引入单元测试与端到端测试，并清理生成文件的 Lint 警告。

## 参考资料

- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Vite 文档](https://vite.dev/)
- [React Router 文档](https://reactrouter.com/)
- [Ant Design 中文文档](https://ant.design/docs/react/introduce-cn)
- [MSW 文档](https://mswjs.io/docs/)
