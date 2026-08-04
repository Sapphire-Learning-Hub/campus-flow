import { Button, Input, Segmented, Select } from "antd";
import {
  AppstoreOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  WarningFilled,
} from "@ant-design/icons";
import type { TaskView } from "@/types/settings.ts";
import { useTranslation } from "react-i18next";
import { useLocalizedOptions } from "@/hooks/useLocalizedOptions.ts";

import { type TaskFilters } from "@/pages/Tasks/taskData.ts";
import { type SetStateAction, useMemo } from "react";

import { countActiveFilters } from "@/utils/collection.ts";
import type { Project } from "@/types/project.ts";
import type { Member } from "@/types/member.ts";

const FILTER_SELECT_PROPS = {
  allowClear: true,
  showSearch: false,
};

interface TaskFilterProps {
  filters: TaskFilters;
  onFiltersChange: (nextFilters: SetStateAction<TaskFilters>) => void;
  view: TaskView;
  onViewChange: (nextView: TaskView) => void;
  projects: Project[];
  members: Member[];
  filteredCount: number;
  totalCount: number;
  overdueCount: number;
}
export function TaskControls({
  filters,
  onFiltersChange,
  view,
  onViewChange,
  projects,
  members,
  filteredCount,
  totalCount,
  overdueCount,
}: TaskFilterProps) {
  const { t } = useTranslation();
  const {
    priorityOptions,
    taskStageOptions,
    taskStatusOptions,
    taskTypeOptions,
  } = useLocalizedOptions();
  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );
  return (
    <section
      className="task-controls surface-panel"
      aria-label={t("tasksPage.filters.label")}
    >
      <div className="task-filter-grid">
        <Input
          className="task-search-input"
          prefix={<SearchOutlined />}
          allowClear
          value={filters.keyword}
          placeholder={t("tasksPage.filters.search")}
          onChange={(event) =>
            onFiltersChange((current) => ({
              ...current,
              keyword: event.target.value || undefined,
            }))
          }
        />
        <Select
          {...FILTER_SELECT_PROPS}
          aria-label={t("tasksPage.filters.byProject")}
          value={filters.projectId}
          placeholder={t("tasksPage.filters.allProjects")}
          options={projects.map((project) => ({
            label: project.name,
            value: project.id,
          }))}
          onChange={(projectId) => {
            onFiltersChange((current) => ({
              ...current,
              projectId,
            }));
          }}
        />
        <Select
          {...FILTER_SELECT_PROPS}
          aria-label={t("tasksPage.filters.byType")}
          value={filters.workItemType}
          placeholder={t("tasksPage.filters.allTypes")}
          options={taskTypeOptions}
          onChange={(workItemType) =>
            onFiltersChange((current) => ({ ...current, workItemType }))
          }
        />
        <Select
          {...FILTER_SELECT_PROPS}
          aria-label={t("tasksPage.filters.byStage")}
          value={filters.stage}
          placeholder={t("tasksPage.filters.allStages")}
          options={taskStageOptions}
          onChange={(stage) =>
            onFiltersChange((current) => ({ ...current, stage }))
          }
        />
        <Select
          {...FILTER_SELECT_PROPS}
          aria-label={t("tasksPage.filters.byStatus")}
          value={filters.status}
          placeholder={t("tasksPage.filters.allStatuses")}
          options={taskStatusOptions}
          onChange={(status) =>
            onFiltersChange((current) => ({ ...current, status }))
          }
        />
        <Select
          {...FILTER_SELECT_PROPS}
          aria-label={t("tasksPage.filters.byPriority")}
          value={filters.priority}
          placeholder={t("tasksPage.filters.allPriorities")}
          options={priorityOptions}
          onChange={(priority) =>
            onFiltersChange((current) => ({ ...current, priority }))
          }
        />
        <Select
          {...FILTER_SELECT_PROPS}
          aria-label={t("tasksPage.filters.byAssignee")}
          value={filters.assigneeId}
          placeholder={t("tasksPage.filters.allAssignees")}
          options={members.map((member) => ({
            label: member.name,
            value: member.id,
          }))}
          onChange={(assigneeId) =>
            onFiltersChange((current) => ({ ...current, assigneeId }))
          }
        />
        <Button
          type={filters.overdueOnly ? "primary" : "default"}
          danger={filters.overdueOnly}
          icon={<WarningFilled />}
          onClick={() =>
            onFiltersChange((current) => ({
              ...current,
              overdueOnly: !current.overdueOnly,
            }))
          }
        >
          {t("tasksPage.filters.overdueOnly")}
        </Button>
        <Button
          disabled={!activeFilterCount}
          onClick={() => onFiltersChange({})}
        >
          {t("tasksPage.actions.clear")}
          {activeFilterCount ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>

      <div className="task-controls-footer">
        <span>
          {t("tasksPage.resultSummary", {
            filtered: filteredCount,
            total: totalCount,
          })}
          {overdueCount
            ? ` · ${t("tasksPage.overdueCount", {
                count: overdueCount,
              })}`
            : ""}
        </span>
        <Segmented
          value={view}
          onChange={(value) => onViewChange(value as TaskView)}
          options={[
            {
              value: "list",
              icon: <UnorderedListOutlined />,
              label: t("tasksPage.views.list"),
            },
            {
              value: "card",
              icon: <AppstoreOutlined />,
              label: t("tasksPage.views.board"),
            },
          ]}
        />
      </div>
    </section>
  );
}
