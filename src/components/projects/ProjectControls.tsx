import { Button, Input, Segmented, Select } from "antd";
import {
  AppstoreOutlined,
  SearchOutlined,
  StarFilled,
  UnorderedListOutlined,
  WarningFilled,
} from "@ant-design/icons";
import type { Member } from "@/types/member.ts";
import type { ProjectView } from "@/types/settings.ts";
import { type SetStateAction, useMemo } from "react";
import {
  type DateSort,
  type ProjectFilters,
} from "@/pages/Projects/projectData.ts";
import { useLocalizedOptions } from "@/hooks/useLocalizedOptions.ts";
import { countActiveFilters } from "@/utils/collection.ts";
import { useTranslation } from "react-i18next";

const FILTER_SELECT_PROPS = {
  allowClear: true,
  showSearch: false,
};

export interface ProjectFilterProps {
  filters: ProjectFilters;
  onFiltersChange: (nextFilters: SetStateAction<ProjectFilters>) => void;
  view: ProjectView;
  onViewChange: (nextView: ProjectView) => void;
  sort: DateSort;
  onSortChange: (nextSort: DateSort) => void;
  members: Member[];
  filteredCount: number;
  totalCount: number;
  favoriteCount: number;
}

export function ProjectControls({
  filters,
  onFiltersChange,
  view,
  onViewChange,
  sort,
  onSortChange,
  members,
  filteredCount,
  totalCount,
  favoriteCount,
}: ProjectFilterProps) {
  const { t } = useTranslation();
  const { projectStatusOptions } = useLocalizedOptions();
  const dateSortOptions = useMemo<Array<{ label: string; value: DateSort }>>(
    () => [
      {
        label: t("projectsPage.sort.updatedAt"),
        value: "updatedAt",
      },
      {
        label: t("projectsPage.sort.createdAt"),
        value: "createdAt",
      },
      {
        label: t("projectsPage.sort.deadline"),
        value: "deadline",
      },
    ],
    [t],
  );
  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

  return (
    <section
      className="project-controls surface-panel"
      aria-label={t("projectsPage.filters.label")}
    >
      <div className="project-filter-grid">
        <Input
          className="project-search-input"
          prefix={<SearchOutlined />}
          allowClear
          value={filters.keyword}
          placeholder={t("projectsPage.filters.search")}
          onChange={(event) =>
            onFiltersChange((current) => ({
              ...current,
              keyword: event.target.value || undefined,
            }))
          }
        />
        <Select
          {...FILTER_SELECT_PROPS}
          aria-label={t("projectsPage.filters.byStatus")}
          value={filters.status}
          placeholder={t("projectsPage.filters.allStatuses")}
          options={projectStatusOptions}
          onChange={(status) =>
            onFiltersChange((current) => ({ ...current, status }))
          }
        />
        <Select
          aria-label={t("projectsPage.filters.sort")}
          value={sort}
          placeholder={t("projectsPage.sort.updatedAt")}
          options={dateSortOptions}
          onChange={(value) => onSortChange(value as DateSort)}
        />
        <Select
          {...FILTER_SELECT_PROPS}
          aria-label={t("projectsPage.filters.byOwner")}
          value={filters.leaderId}
          placeholder={t("projectsPage.filters.allOwners")}
          options={members.map((member) => ({
            label: member.name,
            value: member.id,
          }))}
          onChange={(leaderId) =>
            onFiltersChange((current) => ({ ...current, leaderId }))
          }
        />
        <Button
          type={filters.favoriteOnly ? "primary" : "default"}
          icon={<StarFilled />}
          onClick={() =>
            onFiltersChange((current) => ({
              ...current,
              favoriteOnly: !current.favoriteOnly,
            }))
          }
        >
          {t("projectsPage.filters.favoritesOnly")}
        </Button>
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
          {t("projectsPage.filters.overdueOnly")}
        </Button>
        <Button
          disabled={!activeFilterCount}
          onClick={() => onFiltersChange({})}
        >
          {t("projectsPage.actions.clear")}
          {activeFilterCount ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>

      <div className="project-controls-footer">
        <span>
          {t("projectsPage.resultSummary", {
            filtered: filteredCount,
            total: totalCount,
          })}
          {favoriteCount
            ? ` · ${t("projectsPage.favoriteCount", {
                count: favoriteCount,
              })}`
            : ""}
        </span>
        <Segmented
          value={view}
          onChange={(value) => onViewChange(value as ProjectView)}
          options={[
            {
              value: "list",
              icon: <UnorderedListOutlined />,
              label: t("projectsPage.views.list"),
            },
            {
              value: "card",
              icon: <AppstoreOutlined />,
              label: t("projectsPage.views.board"),
            },
          ]}
        />
      </div>
    </section>
  );
}
