import { Button, Table, type TableProps } from "antd";
import { formatShortDate, isOverdue } from "@/utils/date.ts";
import { useMemo } from "react";
import {
  PriorityTag,
  StageTag,
  StatusTag,
  TypeTag,
} from "@/components/tasks/TaskBoard.tsx";
import { WarningFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import type { Task } from "@/types/task.ts";

import { MemberAvatar } from "@/components/common/MemberAvatar.tsx";
import { getTaskStage, getTaskType } from "@/utils/task.ts";
import type { Project } from "@/types/project.ts";
import type { Member } from "@/types/member.ts";

interface TaskListProps {
  tasks: Task[];
  projectsById: ReadonlyMap<string, Project>;
  membersById: ReadonlyMap<string, Member>;
  pagination: NonNullable<TableProps<Project>["pagination"]>;
  canEdit: (task: Task) => boolean;
  onEdit: (task: Task) => void;
}
export function TaskList({
  tasks,
  projectsById,
  membersById,
  pagination,
  canEdit,
  onEdit,
}: TaskListProps) {
  const { t } = useTranslation();

  const columns: TableProps<Task>["columns"] = useMemo(
    () => [
      {
        title: t("tasksPage.columns.task"),
        key: "task",
        width: 260,
        render: (_, task) => (
          <div className="task-title-cell">
            <button type="button" onClick={() => onEdit(task)}>
              {task.title}
            </button>
            {task.tags.length ? (
              <small>{task.tags.map((tag) => `#${tag}`).join(" ")}</small>
            ) : null}
          </div>
        ),
      },
      {
        title: t("tasksPage.columns.project"),
        key: "project",
        width: 145,
        render: (_, task) => {
          const project = projectsById.get(task.projectId);
          return (
            <span className="task-project-cell">
              <i style={{ background: project?.color ?? "#94a3b8" }} />
              {project?.name ?? t("tasksPage.unknownProject")}
            </span>
          );
        },
      },
      {
        title: t("tasksPage.columns.type"),
        key: "type",
        width: 72,
        render: (_, task) => <TypeTag type={getTaskType(task)} />,
      },
      {
        title: t("tasksPage.columns.status"),
        key: "status",
        width: 82,
        render: (_, task) => <StatusTag status={task.status} />,
      },
      {
        title: t("tasksPage.columns.stage"),
        key: "stage",
        width: 72,
        render: (_, task) => <StageTag stage={getTaskStage(task)} />,
      },
      {
        title: t("tasksPage.columns.priority"),
        key: "priority",
        width: 72,
        render: (_, task) => <PriorityTag priority={task.priority} />,
      },
      {
        title: t("tasksPage.columns.assignee"),
        key: "assignee",
        width: 105,
        render: (_, task) => (
          <MemberAvatar
            member={
              task.assigneeId ? membersById.get(task.assigneeId) : undefined
            }
            size={24}
            showName
          />
        ),
      },
      {
        title: t("tasksPage.columns.schedule"),
        key: "schedule",
        width: 145,
        render: (_, task) => {
          const overdue = isOverdue(task.deadline, task.status === "done");
          return (
            <span className={overdue ? "danger-text" : undefined}>
              {overdue ? <WarningFilled /> : null}
              {formatShortDate(task.startDate)} -{" "}
              {formatShortDate(task.deadline)}
            </span>
          );
        },
      },
      {
        title: t("tasksPage.columns.actions"),
        key: "actions",
        fixed: "right",
        width: 65,
        render: (_, task) => (
          <Button type="link" size="small" onClick={() => onEdit(task)}>
            {canEdit(task)
              ? t("tasksPage.actions.edit")
              : t("tasksPage.actions.view")}
          </Button>
        ),
      },
    ],
    [canEdit, membersById, onEdit, projectsById, t],
  );
  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={tasks}
      scroll={{ x: 1060 }}
      rowClassName={(task) =>
        isOverdue(task.deadline, task.status === "done")
          ? "task-table-row-overdue"
          : ""
      }
      pagination={pagination}
    />
  );
}
