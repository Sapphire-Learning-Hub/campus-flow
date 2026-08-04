import { Button, Progress, Space, Table, type TableProps } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StatusTag } from "@/components/projects/ProjectBoard.tsx";
import { MemberAvatar } from "@/components/common/MemberAvatar.tsx";
import type { Member } from "@/types/member.ts";
import type { Project } from "@/types/project.ts";
import {
  EMPTY_PROJECT_METRICS,
  isProjectOverdue,
  type ProjectMetrics,
} from "@/pages/Projects/projectData.ts";
import { WarningFilled } from "@ant-design/icons";
import { formatShortDate } from "@/utils/date.ts";

export interface ProjectListProps {
  projects: Project[];
  membersById: ReadonlyMap<string, Member>;
  metricsByProjectId: ReadonlyMap<string, ProjectMetrics>;
  pagination: NonNullable<TableProps<Project>["pagination"]>;
  canEdit: (project: Project) => boolean;
  onEdit: (project: Project) => void;
  onOpenDetail: (project: Project) => void;
}

export function ProjectList({
  projects,
  membersById,
  metricsByProjectId,
  pagination,
  canEdit,
  onEdit,
  onOpenDetail,
}: ProjectListProps) {
  const { t } = useTranslation();

  const columns: TableProps<Project>["columns"] = useMemo(
    () => [
      {
        title: t("projectsPage.columns.project"),
        key: "project",
        width: 300,
        render: (_, project) => (
          <div className="project-title-cell">
            <i style={{ background: project.color }} />
            <div>
              <button type="button" onClick={() => onOpenDetail(project)}>
                {project.name}
              </button>
              <small>{project.description}</small>
            </div>
          </div>
        ),
      },
      {
        title: t("projectsPage.columns.status"),
        key: "status",
        width: 90,
        render: (_, project) => <StatusTag status={project.status} />,
      },
      {
        title: t("projectsPage.columns.owner"),
        key: "leader",
        width: 120,
        render: (_, project) => (
          <MemberAvatar member={membersById.get(project.leaderId)} size={24} showName />
        ),
      },
      {
        title: t("projectsPage.columns.progress"),
        key: "progress",
        width: 150,
        render: (_, project) => {
          const metrics = metricsByProjectId.get(project.id) ?? EMPTY_PROJECT_METRICS;
          return (
            <span className="project-progress-cell">
              <Progress percent={metrics.progress} size="small" strokeColor={project.color} />
            </span>
          );
        },
      },
      {
        title: t("projectsPage.columns.workItems"),
        key: "tasks",
        width: 145,
        render: (_, project) => {
          const metrics = metricsByProjectId.get(project.id) ?? EMPTY_PROJECT_METRICS;
          return (
            <span className="project-task-count">
              <b>{metrics.open}</b> {t("projectsPage.card.incomplete")}
              {metrics.review
                ? ` · ${t("projectsPage.reviewCount", {
                    count: metrics.review,
                  })}`
                : ""}
            </span>
          );
        },
      },
      {
        title: t("projectsPage.columns.members"),
        key: "members",
        width: 75,
        render: (_, project) => t("projectsPage.personCount", { count: project.members.length }),
      },
      {
        title: t("projectsPage.columns.deadline"),
        key: "deadline",
        width: 120,
        render: (_, project) => {
          const overdue = isProjectOverdue(project);
          return (
            <time className={overdue ? "danger-text" : undefined}>
              {overdue ? <WarningFilled /> : null}
              {formatShortDate(project.deadline)}
            </time>
          );
        },
      },
      {
        title: t("projectsPage.columns.actions"),
        key: "actions",
        fixed: "right",
        width: 130,
        render: (_, project) => (
          <Space size={0}>
            <Button type="link" size="small" onClick={() => onOpenDetail(project)}>
              {t("projectsPage.actions.details")}
            </Button>
            <Button type="link" size="small" onClick={() => onEdit(project)}>
              {canEdit(project) ? t("projectsPage.actions.edit") : t("projectsPage.actions.view")}
            </Button>
          </Space>
        ),
      },
    ],
    [canEdit, membersById, metricsByProjectId, onEdit, onOpenDetail, t],
  );

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={projects}
      scroll={{ x: 1110 }}
      rowClassName={(project) => (isProjectOverdue(project) ? "project-table-row-overdue" : "")}
      pagination={pagination}
    />
  );
}
