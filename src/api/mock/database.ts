import dayjs from "dayjs";
import type { Activity } from "@/types/activity";
import type { Member } from "@/types/member";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import type { MockUser } from "@/types/user";

export interface MockDatabase {
  users: MockUser[];
  members: Member[];
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
}

const date = (offset: number) => dayjs().add(offset, "day").format("YYYY-MM-DD");
const stamp = (offset: number, hour = 10) =>
  dayjs().add(offset, "day").hour(hour).minute(0).second(0).toISOString();

const members: Member[] = [
  {
    id: "m1",
    name: "张三",
    email: "zhangsan@campus.edu.cn",
    department: "计算机学院",
    color: "#1d5eff",
    joinedAt: date(-420),
  },
  {
    id: "m2",
    name: "李四",
    email: "lisi@campus.edu.cn",
    department: "软件学院",
    color: "#10b981",
    joinedAt: date(-380),
  },
  {
    id: "m3",
    name: "王五",
    email: "wangwu@campus.edu.cn",
    department: "设计学院",
    color: "#f59e0b",
    joinedAt: date(-320),
  },
  {
    id: "m4",
    name: "赵六",
    email: "zhaoliu@campus.edu.cn",
    department: "商学院",
    color: "#ef4444",
    joinedAt: date(-280),
  },
  {
    id: "m5",
    name: "钱七",
    email: "qianqi@campus.edu.cn",
    department: "新闻学院",
    color: "#8b5cf6",
    joinedAt: date(-240),
  },
  {
    id: "m6",
    name: "孙八",
    email: "sunba@campus.edu.cn",
    department: "外国语学院",
    color: "#06b6d4",
    joinedAt: date(-210),
  },
  {
    id: "m7",
    name: "周九",
    email: "zhoujiu@campus.edu.cn",
    department: "信息工程学院",
    color: "#ec4899",
    joinedAt: date(-180),
  },
  {
    id: "m8",
    name: "吴十",
    email: "wushi@campus.edu.cn",
    department: "建筑学院",
    color: "#64748b",
    joinedAt: date(-160),
  },
];

const projectMembers = (items: Array<[string, "owner" | "admin" | "member" | "readonly"]>) =>
  items.map(([memberId, role]) => ({ memberId, role, addedAt: date(-120) }));

const projects: Project[] = [
  {
    id: "p1",
    name: "校园电商平台",
    description: "面向在校师生的可信二手交易平台，覆盖发布、交易、物流和信用评价。",
    status: "active",
    leaderId: "m1",
    members: projectMembers([
      ["m1", "owner"],
      ["m2", "admin"],
      ["m3", "member"],
      ["m4", "member"],
    ]),
    createdAt: date(-128),
    deadline: date(48),
    updatedAt: stamp(-1),
    color: "#1d5eff",
    favorite: true,
  },
  {
    id: "p2",
    name: "学生社团管理系统",
    description: "整合社团注册、活动审批、经费申请和成员档案的协同平台。",
    status: "active",
    leaderId: "m2",
    members: projectMembers([
      ["m2", "owner"],
      ["m1", "admin"],
      ["m5", "member"],
      ["m6", "readonly"],
    ]),
    createdAt: date(-96),
    deadline: date(72),
    updatedAt: stamp(-2),
    color: "#10b981",
    favorite: true,
  },
  {
    id: "p3",
    name: "在线考试系统",
    description: "支持题库、智能组卷、在线监考与学习分析的课程考试平台。",
    status: "planning",
    leaderId: "m3",
    members: projectMembers([
      ["m3", "owner"],
      ["m1", "member"],
      ["m7", "member"],
    ]),
    createdAt: date(-34),
    deadline: date(120),
    updatedAt: stamp(-6),
    color: "#8b5cf6",
    favorite: false,
  },
  {
    id: "p4",
    name: "图书馆预约系统",
    description: "提供座位预约、入馆签到和学习空间使用分析。",
    status: "completed",
    leaderId: "m4",
    members: projectMembers([
      ["m4", "owner"],
      ["m1", "readonly"],
      ["m8", "member"],
    ]),
    createdAt: date(-220),
    deadline: date(-22),
    updatedAt: stamp(-20),
    color: "#06b6d4",
    favorite: false,
  },
  {
    id: "p5",
    name: "校园导航小程序",
    description: "为新生提供室内外路线、无障碍导航和校园地点服务信息。",
    status: "active",
    leaderId: "m5",
    members: projectMembers([
      ["m5", "owner"],
      ["m1", "admin"],
      ["m6", "member"],
      ["m7", "member"],
    ]),
    createdAt: date(-76),
    deadline: date(31),
    updatedAt: stamp(-3),
    color: "#f59e0b",
    favorite: false,
  },
  {
    id: "p6",
    name: "校园活动日历",
    description: "聚合讲座、比赛、社团活动并提供订阅、提醒和分享。",
    status: "active",
    leaderId: "m8",
    members: projectMembers([
      ["m8", "owner"],
      ["m1", "member"],
      ["m2", "admin"],
    ]),
    createdAt: date(-112),
    deadline: date(18),
    updatedAt: stamp(-4),
    color: "#ec4899",
    favorite: true,
  },
  {
    id: "p7",
    name: "课程评价平台",
    description: "已归档的课程匿名评价与选课参考工具。",
    status: "archived",
    leaderId: "m6",
    members: projectMembers([
      ["m6", "owner"],
      ["m1", "readonly"],
    ]),
    createdAt: date(-360),
    deadline: date(-180),
    updatedAt: stamp(-160),
    color: "#64748b",
    favorite: false,
  },
];

const task = (
  id: string,
  projectId: string,
  title: string,
  status: Task["status"],
  priority: Task["priority"],
  assigneeId: string | undefined,
  deadlineOffset: number | undefined,
  tags: string[],
): Task => ({
  id,
  projectId,
  title,
  description: `${title}的详细执行说明与验收标准。`,
  workItemType: inferTaskType(title, tags),
  stage: inferTaskStage(status),
  status,
  priority,
  assigneeId,
  createdAt: date(-40),
  startDate: date(deadlineOffset === undefined ? -12 : Math.min(-1, deadlineOffset - 10)),
  deadline: deadlineOffset === undefined ? undefined : date(deadlineOffset),
  tags,
  updatedAt: stamp(-2),
});

function inferTaskType(title: string, tags: string[]): NonNullable<Task["workItemType"]> {
  const text = `${title} ${tags.join(" ")}`;
  if (text.includes("测试") || text.includes("验收")) return "test";
  if (text.includes("设计") || text.includes("原型")) return "design";
  if (text.includes("缺陷") || text.includes("回归")) return "bug";
  if (text.includes("运营") || text.includes("专题") || text.includes("名单")) return "operation";
  if (text.includes("调研") || text.includes("需求") || text.includes("产品")) return "requirement";
  return "development";
}

function inferTaskStage(status: Task["status"]): NonNullable<Task["stage"]> {
  if (status === "pending") return "discovery";
  if (status === "review") return "acceptance";
  if (status === "done") return "acceptance";
  return "delivery";
}

const tasks: Task[] = [
  task("t1", "p1", "完成商品发布流程", "in_progress", "urgent", "m3", 1, ["前端", "核心流程"]),
  task("t2", "p1", "交易订单状态机", "review", "high", "m2", 4, ["后端"]),
  task("t3", "p1", "用户信用评价", "pending", "medium", undefined, 12, ["产品"]),
  task("t4", "p1", "项目需求与原型评审", "done", "high", "m1", -42, ["设计"]),
  task("t5", "p1", "移动端响应式验收", "pending", "high", "m4", -2, ["测试"]),
  task("t6", "p2", "提交活动审批原型", "in_progress", "high", "m5", 2, ["原型"]),
  task("t7", "p2", "整理社团招新名单", "pending", "medium", "m1", 6, ["运营"]),
  task("t8", "p2", "经费审批规则配置", "done", "high", "m2", -18, ["后端"]),
  task("t9", "p2", "成员权限矩阵", "review", "high", "m1", 9, ["权限"]),
  task("t10", "p3", "题库数据模型设计", "in_progress", "high", "m7", 16, ["数据"]),
  task("t11", "p3", "智能组卷调研", "pending", "medium", "m1", 24, ["算法"]),
  task("t12", "p4", "预约流程回归测试", "done", "medium", "m8", -28, ["测试"]),
  task("t13", "p4", "发布复盘文档", "done", "low", "m1", -21, ["文档"]),
  task("t14", "p5", "无障碍路线采集", "in_progress", "urgent", "m6", -1, ["地图"]),
  task("t15", "p5", "地点详情卡片", "review", "medium", "m7", 8, ["前端"]),
  task("t16", "p5", "离线地图缓存", "pending", "low", undefined, undefined, ["PWA"]),
  task("t17", "p6", "活动订阅筛选", "done", "high", "m2", -6, ["前端"]),
  task("t18", "p6", "提醒通知策略", "in_progress", "high", "m1", 3, ["通知"]),
  task("t19", "p6", "周末活动专题", "pending", "medium", "m8", 5, ["运营"]),
];

const activities: Activity[] = [
  {
    id: "a1",
    projectId: "p1",
    actorId: "m3",
    kind: "task_updated",
    content: "将「完成商品发布流程」移至进行中",
    createdAt: stamp(-1, 15),
  },
  {
    id: "a2",
    projectId: "p2",
    actorId: "m1",
    kind: "task_created",
    content: "创建了任务「成员权限矩阵」",
    createdAt: stamp(-2, 11),
  },
  {
    id: "a3",
    projectId: "p5",
    actorId: "m6",
    kind: "task_updated",
    content: "更新了「无障碍路线采集」的截止日期",
    createdAt: stamp(-3, 16),
  },
  {
    id: "a4",
    projectId: "p6",
    actorId: "m2",
    kind: "task_updated",
    content: "完成了「活动订阅筛选」",
    createdAt: stamp(-6, 14),
  },
  {
    id: "a5",
    projectId: "p3",
    actorId: "m3",
    kind: "project_updated",
    content: "更新了项目计划与里程碑",
    createdAt: stamp(-7, 9),
  },
];

export function createSeedDatabase(): MockDatabase {
  return {
    users: [
      {
        id: "u1",
        memberId: "m1",
        username: "admin",
        password: "123456",
        name: "张三",
        email: "zhangsan@campus.edu.cn",
        department: "计算机学院",
      },
      {
        id: "u2",
        memberId: "m2",
        username: "demo",
        password: "123456",
        name: "李四",
        email: "lisi@campus.edu.cn",
        department: "软件学院",
      },
      {
        id: "u3",
        memberId: "m3",
        username: "member",
        password: "123456",
        name: "王五",
        email: "wangwu@campus.edu.cn",
        department: "设计学院",
      },
      {
        id: "u4",
        memberId: "m6",
        username: "readonly",
        password: "123456",
        name: "孙八",
        email: "sunba@campus.edu.cn",
        department: "外国语学院",
      },
    ],
    members: structuredClone(members),
    projects: structuredClone(projects),
    tasks: structuredClone(tasks),
    activities: structuredClone(activities),
  };
}
export const mockDatabase = createSeedDatabase();
