import { useTranslation } from "react-i18next";
import { formatShortDate, isOverdue } from "@/utils/date.ts";
import { Button, Tag, Tooltip } from "antd";
import { getTaskStage, getTaskType } from "@/utils/task.ts";
import { MemberAvatar } from "@/components/common/MemberAvatar.tsx";
import { WarningFilled } from "@ant-design/icons";
import type { Task, TaskPriority, TaskStage, TaskStatus, TaskType } from "@/types/task.ts";
import type { Project } from "@/types/project.ts";
import type { Member } from "@/types/member.ts";
import {
  TASK_PRIORITY_META,
  TASK_STAGE_META,
  TASK_STATUS_META,
  TASK_TYPE_META,
} from "@/constants/status.ts";

interface TaskCardProps {
  task: Task;
  project?: Project;
  member?: Member;
  editable: boolean;
  onEdit: (task: Task) => void;
}
interface TaskBoardProps {
  tasks: Task[];
  projectsById: ReadonlyMap<string, Project>;
  membersById: ReadonlyMap<string, Member>;
  emptyDescription: string;
  canEdit: (task: Task) => boolean;
  onEdit: (task: Task) => void;
}
export function TypeTag({ type }: { type: TaskType }) {
  const { t } = useTranslation();
  return <Tag color={TASK_TYPE_META[type].color}>{t(`options.taskType.${type}`)}</Tag>;
}

export function StageTag({ stage }: { stage: TaskStage }) {
  const { t } = useTranslation();
  return <Tag color={TASK_STAGE_META[stage].color}>{t(`options.taskStage.${stage}`)}</Tag>;
}

export function PriorityTag({ priority }: { priority: TaskPriority }) {
  const { t } = useTranslation();
  return <Tag color={TASK_PRIORITY_META[priority].color}>{t(`options.priority.${priority}`)}</Tag>;
}

export function StatusTag({ status }: { status: TaskStatus }) {
  const { t } = useTranslation();
  const meta = TASK_STATUS_META[status];
  return <Tag color={meta.color}>{t(`options.taskStatus.${status}`)}</Tag>;
}

function TaskCard({ task, project, member, editable, onEdit }: TaskCardProps) {
  const { t } = useTranslation();
  const overdue = isOverdue(task.deadline, task.status === "done");

  return (
    <article className={`task-card${overdue ? " is-overdue" : ""}`}>
      <header className="task-card-header">
        <button type="button" className="task-card-title" onClick={() => onEdit(task)}>
          {task.title}
        </button>
        <Button type="link" size="small" onClick={() => onEdit(task)}>
          {editable ? t("tasksPage.actions.edit") : t("tasksPage.actions.view")}
        </Button>
      </header>

      <p className="task-card-description">{task.description}</p>

      <div className="task-card-tags">
        <TypeTag type={getTaskType(task)} />
        <StageTag stage={getTaskStage(task)} />
        <PriorityTag priority={task.priority} />
      </div>

      <div className="task-card-project">
        <span style={{ background: project?.color ?? "#94a3b8" }} />
        <b>{project?.name ?? t("tasksPage.unknownProject")}</b>
      </div>

      <footer className="task-card-footer">
        <MemberAvatar member={member} size={24} showName />
        <Tooltip title={overdue ? t("tasksPage.card.overdue") : t("tasksPage.columns.schedule")}>
          <time className={overdue ? "danger-text" : undefined}>
            {overdue ? <WarningFilled /> : null}
            {formatShortDate(task.deadline)}
          </time>
        </Tooltip>
      </footer>

      <div className="task-card-status">
        <StatusTag status={task.status} />
      </div>
    </article>
  );
}

export function TaskBoard({
  tasks,
  projectsById,
  membersById,
  emptyDescription,
  canEdit,
  onEdit,
}: TaskBoardProps) {
  const { t } = useTranslation();

  return (
    <div className="task-board" aria-label={t("tasksPage.boardLabel")}>
      {tasks.length ? (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            project={projectsById.get(task.projectId)}
            member={task.assigneeId ? membersById.get(task.assigneeId) : undefined}
            editable={canEdit(task)}
            onEdit={onEdit}
          />
        ))
      ) : (
        <div className="task-board-empty">{emptyDescription}</div>
      )}
    </div>
  );
}
