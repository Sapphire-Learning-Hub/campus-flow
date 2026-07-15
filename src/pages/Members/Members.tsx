import { PlusOutlined, SearchOutlined, TeamOutlined } from "@ant-design/icons";
import { Input, Select, Table, Tag, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/common/PageHeader.tsx";
import "./index.css";

interface MemberRow {
  id: string;

  name: string;

  email: string;

  department: string;

  role: string;

  taskCount: number;

  joinedAt: string;
}

const members: MemberRow[] = [
  {
    id: "1",
    name: "张伟",
    email: "zhangwei@example.com",
    department: "计算机学院",
    role: "管理员",
    taskCount: 3,
    joinedAt: "2026-07-01",
  },

  {
    id: "2",
    name: "李明",
    email: "liming@example.com",
    department: "软件工程系",
    role: "开发者",
    taskCount: 5,
    joinedAt: "2026-07-03",
  },

  {
    id: "3",
    name: "王强",
    email: "wangqiang@example.com",
    department: "人工智能学院",
    role: "成员",
    taskCount: 1,
    joinedAt: "2026-07-05",
  },
];

export default function MembersPage() {
  const columns: ColumnsType<MemberRow> = [
    {
      title: "成员",

      key: "member",

      render: (_, member) => (
        <div className="member-cell">
          <div className="avatar">{member.name[0]}</div>

          <span>
            <b>{member.name}</b>

            <small>{member.email}</small>
          </span>
        </div>
      ),
    },

    {
      title: "学院 / 部门",

      dataIndex: "department",

      width: 180,
    },

    {
      title: "角色",

      dataIndex: "role",

      width: 150,

      render: (role) => <Tag>{role}</Tag>,
    },

    {
      title: "负责任务",

      width: 120,

      render: (_, member) => (
        <Button type="link">{member.taskCount} 个任务</Button>
      ),
    },

    {
      title: "加入时间",

      dataIndex: "joinedAt",

      width: 130,
    },

    {
      title: "操作",

      width: 100,

      render: () => (
        <Button danger type="text">
          删除
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* 页面标题 */}
      <PageHeader
        title={"成员"}
        description={"按项目维护角色权限与任务责任"}
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            添加成员
          </Button>
        }
      />

      {/* 当前项目 */}

      <div className="project-context-bar">
        <TeamOutlined />

        <span>当前项目</span>

        <Select
          defaultValue="智能计划系统"
          options={[
            {
              label: "智能计划系统",
              value: "智能计划系统",
            },
            {
              label: "校园管理平台",
              value: "校园管理平台",
            },
          ]}
        />

        <Tag>{members.length} 名成员</Tag>
      </div>

      {/* 筛选区域 */}

      <div className="data-toolbar">
        <Input prefix={<SearchOutlined />} placeholder="搜索姓名、邮箱或学院" />

        <Select
          placeholder="全部角色"
          options={[
            {
              label: "全部角色",
              value: "all",
            },
            {
              label: "管理员",
              value: "admin",
            },
            {
              label: "开发者",
              value: "developer",
            },
            {
              label: "成员",
              value: "member",
            },
          ]}
        />

        <span className="toolbar-meta">
          {members.length} 名成员 · 智能计划系统
        </span>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={members}
        pagination={false}
      />
    </div>
  );
}
