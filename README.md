# CampusFlow

> 用 React、TypeScript、Vite 与 Ant Design 实现的校园项目与活动管理平台。

CampusFlow 用于管理课程项目、学生团队、社团活动和个人学习计划。最终应用会覆盖登录、项目、任务、成员、权限、个人设置与本地 Mock 数据等完整协作流程。

## 当前进度

本仓库正在开发。下表反映当前代码状态：

| 模块 | 状态 | 当前内容 |
| --- | --- | --- |
| 工程基础 | 已完成 | Vite、React 19、TypeScript、ESLint、路径别名 `@/*` |
| 路由 | 已完成 | 登录、注册、工作台、项目、任务、成员、设置和 404 路由 |
| 公共布局 | 已完成 | 侧边导航、顶栏、个人抽屉与基础样式令牌 |
| 登录 / 注册 | 静态页面 | 已有 Ant Design 表单和基础校验，尚未接入认证、会话与路由守卫 |
| 工作台 | 静态页面 | 已完成主要布局和展示样式，指标、项目和动态仍是组件内示例数据 |
| 项目、任务、成员、设置 | 进行中 | 目前是占位页面 |
| 数据类型 | 已完成 | 已定义用户、项目、任务、成员、活动、接口响应和分页类型 |
| Mock 数据 | 进行中 | 已有 seed 数据库和异步 `mockRequest` 雏形，尚未接入业务 service 与页面 |
| 测试与生产构建 | 进行中 | 暂无测试脚本，生产构建应在补齐当前 Mock 依赖后作为阶段验收 |

## 技术栈

- React 19 + TypeScript 6
- Vite 8
- React Router
- Ant Design 6 与 Ant Design Icons
- Day.js
- localStorage Mock 数据库（开发中）

## 本地运行

建议使用 Node.js 22 LTS 或更新版本。

```bash
npm install
npm run dev
```

默认访问地址由 Vite 在终端输出，通常为 `http://localhost:5173`。

可使用的检查命令：

```bash
npm run lint
npm run build
npm run preview
```

## 当前可浏览页面

| 地址 | 说明 |
| --- | --- |
| `/login` | 登录表单静态实现，预填 `admin / 123456` 仅用于界面演示 |
| `/register` | 注册表单与前端规则校验 |
| `/dashboard` | 工作台的静态布局和响应式样式基础 |
| `/projects` | 项目管理占位页 |
| `/tasks` | 任务管理占位页 |
| `/members` | 成员管理占位页 |
| `/settings` | 个人设置占位页 |
| 其他地址 | 404 页面 |

## 目录说明

```text
src/
├─ api/                 # Mock 数据库与请求适配层（进行中）
├─ assets/              # 图片与静态资源
├─ components/common/   # 品牌与页面标题等可复用组件
├─ contexts/            # 认证、业务数据、设置等 Provider（待逐步补齐）
├─ layouts/             # 登录布局与后台通用布局
├─ pages/               # 各路由页面
├─ routes/              # 路由表与后续路由守卫
├─ style/               # 全局令牌、基础样式和响应式规则
└─ types/               # 项目、任务、成员、用户等领域类型
```

## 参考资料

- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Vite 文档](https://vite.dev/)
- [Ant Design 中文文档](https://ant.design/docs/react/introduce-cn)
