import type { Project, ProjectStatus } from "@/types/project.ts";
import type { Member } from "@/types/member.ts";
import {
  EMPTY_PROJECT_METRICS,
  isProjectOverdue,
  type ProjectMetrics,
} from "@/pages/Projects/projectData.ts";
import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import { Button, Progress, Tag, Tooltip } from "antd";
import { PERMISSION_DENIED } from "@/utils/Permissions.ts";
import { CalendarOutlined, StarFilled, StarOutlined, WarningFilled } from "@ant-design/icons";
import { MemberAvatar } from "@/components/common/MemberAvatar.tsx";
import { formatShortDate } from "@/utils/date.ts";
import { PROJECT_STATUS_META } from "@/constants/status.ts";

export function StatusTag({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation();
  const meta = PROJECT_STATUS_META[status];
  return <Tag color={meta.color}>{t(`options.projectStatus.${status}`)}</Tag>;
}
interface ProjectCardProps {
  project: Project;
  member?: Member;
  metrics: ProjectMetrics;
  editable: boolean;
  favoriteBusy: boolean;
  onEdit: (project: Project) => void;
  onOpenDetail: (project: Project) => void;
  onToggleFavorite: (project: Project) => void;
}
interface ProjectBoardProps {
  projects: Project[];
  membersById: ReadonlyMap<string, Member>;
  metricsByProjectId: ReadonlyMap<string, ProjectMetrics>;
  emptyDescription: string;
  favoriteBusyId?: string;
  canEdit: (project: Project) => boolean;
  onEdit: (project: Project) => void;
  onOpenDetail: (project: Project) => void;
  onToggleFavorite: (project: Project) => void;
}
function ProjectCard({
  project,
  member,
  metrics,
  editable,
  favoriteBusy,
  onEdit,
  onOpenDetail,
  onToggleFavorite,
}: ProjectCardProps) {
  const { t } = useTranslation();
  const overdue = isProjectOverdue(project);

  return (
    <article
      className={`project-workspace-card${overdue ? " is-overdue" : ""}`}
      style={{ "--project-accent": project.color } as CSSProperties}
    >
      <header className="project-card-heading">
        <span className="project-card-symbol" aria-hidden="true">
          {project.name.slice(0, 1)}
        </span>
        <div>
          <button type="button" onClick={() => onEdit(project)}>
            {project.name}
          </button>
          <small>
            {t("projectsPage.memberCount", {
              count: project.members.length,
            })}
          </small>
        </div>
        <Tooltip
          title={
            editable ? t("projectsPage.actions.toggleFavorite") : PERMISSION_DENIED.editProject
          }
        >
          <Button
            className="project-favorite-button"
            type="text"
            size="small"
            aria-label={
              project.favorite
                ? t("projectsPage.actions.unfavorite")
                : t("projectsPage.actions.favorite")
            }
            icon={project.favorite ? <StarFilled /> : <StarOutlined />}
            loading={favoriteBusy}
            onClick={() => onToggleFavorite(project)}
          />
        </Tooltip>
      </header>

      <p className="project-card-description">{project.description}</p>

      <div className="project-card-insights">
        <span>
          <b>{metrics.total}</b> {t("projectsPage.card.workItems")}
        </span>
        <span>
          <b>{metrics.open}</b> {t("projectsPage.card.incomplete")}
        </span>
        <span className={metrics.overdue ? "danger-text" : undefined}>
          <b>{metrics.overdue}</b> {t("projectsPage.card.overdue")}
        </span>
      </div>

      <div className="project-card-progress">
        <div>
          <span>{t("projectsPage.card.progress")}</span>
          <b>{metrics.progress}%</b>
        </div>
        <Progress percent={metrics.progress} showInfo={false} strokeColor={project.color} />
      </div>

      <footer className="project-card-footer">
        <MemberAvatar member={member} size={24} showName />
        <Tooltip
          title={
            overdue ? t("projectsPage.card.projectOverdue") : t("projectsPage.columns.deadline")
          }
        >
          <time className={overdue ? "danger-text" : undefined}>
            {overdue ? <WarningFilled /> : <CalendarOutlined />}
            {formatShortDate(project.deadline)}
          </time>
        </Tooltip>
      </footer>

      <div className="project-card-status">
        <StatusTag status={project.status} />
        <Button type="link" size="small" onClick={() => onOpenDetail(project)}>
          {t("projectsPage.actions.viewDetails")}
        </Button>
      </div>
    </article>
  );
}

export function ProjectBoard({
  projects,
  membersById,
  metricsByProjectId,
  emptyDescription,
  favoriteBusyId,
  canEdit,
  onEdit,
  onOpenDetail,
  onToggleFavorite,
}: ProjectBoardProps) {
  const { t } = useTranslation();

  return (
    <div className="project-board" aria-label={t("projectsPage.boardLabel")}>
      {projects.length ? (
        projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            member={membersById.get(project.leaderId)}
            metrics={metricsByProjectId.get(project.id) ?? EMPTY_PROJECT_METRICS}
            editable={canEdit(project)}
            favoriteBusy={favoriteBusyId === project.id}
            onEdit={onEdit}
            onOpenDetail={onOpenDetail}
            onToggleFavorite={onToggleFavorite}
          />
        ))
      ) : (
        <div className="project-board-empty">{emptyDescription}</div>
      )}
    </div>
  );
}
