import {
  CalendarOutlined,
  FlagOutlined,
  PlusOutlined,
  ProjectOutlined,
  ReloadOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { App, Button, Pagination, Space, Tooltip } from "antd";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { PageState } from "@/components/common/PageState";
import { ProjectFormDrawer } from "@/components/projects/ProjectForm";
import { useAsyncPageData } from "@/hooks/useAsyncPageData";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEntityEditor } from "@/hooks/useEntityEditor";
import { useSettings } from "@/hooks/useSettings";
import { getApiErrorMessage } from "@/services/client";
import { updateProject } from "@/services/projects";
import { ProjectBoard } from "@/components/projects/ProjectBoard.tsx";
import type { Project } from "@/types/project";
import type { ProjectView } from "@/types/settings";
import { indexById } from "@/utils/collection";
import { getProjectPermissions, PERMISSION_DENIED } from "@/utils/Permissions.ts";
import {
  calculateProjectMetrics,
  filterProjects,
  loadProjectsPageData,
  readProjectPage,
  summarizeProjects,
  type DateSort,
  type ProjectFilters,
  type ProjectsPageData,
} from "./projectData";
import "./Project.css";
import { ProjectControls } from "@/components/projects/ProjectControls.tsx";
import { ProjectList } from "@/components/projects/ProjectList.tsx";
const INITIAL_PROJECTS_PAGE_DATA: ProjectsPageData = {
  tasks: [],
  taskTotal: 0,
  projects: [],
  projectTotal: 0,
  allProjects: [],
  members: [],
};

export default function ProjectsWorkspacePage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const currentUser = useCurrentUser();
  const { settings: appSettings } = useSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = readProjectPage(searchParams.get("page"));
  const pageSize = appSettings.pageSize;
  const [view, setView] = useState<ProjectView>(appSettings.defaultProjectView);
  const [filters, setFilters] = useState<ProjectFilters>(() => ({
    leaderId: searchParams.get("leaderId") || undefined,
  }));
  const [sort, setSort] = useState<DateSort>("updatedAt");
  const [favoriteBusyId, setFavoriteBusyId] = useState<string>();
  const getProjectsPageErrorMessage = useCallback(
    (requestError: unknown) => getApiErrorMessage(requestError, t("projectsPage.loadError")),
    [t],
  );
  const updatePage = useCallback(
    (nextPage: number, replace = false) => {
      const nextParams = new URLSearchParams(searchParams);
      const normalizedPage = Math.max(1, Math.floor(nextPage));
      if (normalizedPage === 1) nextParams.delete("page");
      else nextParams.set("page", String(normalizedPage));
      setSearchParams(nextParams, { replace });
    },
    [searchParams, setSearchParams],
  );
  const handlePageChange = useCallback((nextPage: number) => updatePage(nextPage), [updatePage]);
  const resetPage = useCallback(() => {
    if (page > 1) updatePage(1, true);
  }, [page, updatePage]);
  const updateFilters = useCallback(
    (nextFilters: SetStateAction<ProjectFilters>) => {
      setFilters(nextFilters);
      resetPage();
    },
    [resetPage],
  );
  const loadPage = useCallback(
    (signal: AbortSignal) =>
      loadProjectsPageData(
        {
          page,
          pageSize,
          keyword: filters.keyword?.trim() || undefined,
          status: filters.status,
        },
        signal,
      ),
    [filters.keyword, filters.status, page, pageSize],
  );
  const { data, setData, loading, refreshing, error, reload, refresh } = useAsyncPageData({
    initialData: INITIAL_PROJECTS_PAGE_DATA,
    load: loadPage,
    getErrorMessage: getProjectsPageErrorMessage,
  });
  const { taskTotal, tasks, projectTotal, projects, allProjects, members } = data;
  useEffect(() => {
    if (loading) return;

    const lastPage = Math.max(1, Math.ceil(projectTotal / pageSize));
    if (page > lastPage) updatePage(lastPage, true);
  }, [loading, page, pageSize, projectTotal, updatePage]);
  const {
    open: drawerOpen,
    editingItem: editingProject,
    openCreate,
    openEdit,
    close: closeEditor,
  } = useEntityEditor<Project>();

  const membersById = useMemo(() => indexById(members), [members]);
  const metricsByProjectId = useMemo(
    () => calculateProjectMetrics(projects, tasks),
    [projects, tasks],
  );

  const summary = useMemo(
    () => summarizeProjects(allProjects, projectTotal, taskTotal),
    [allProjects, projectTotal, taskTotal],
  );

  const isProjectEditable = useCallback(
    (project: Project) => getProjectPermissions(project, currentUser.memberId).canEditProject,
    [currentUser.memberId],
  );

  const openProjectDetail = useCallback(
    (project: Project) => navigate(`/projects/${project.id}`),
    [navigate],
  );

  const handleOpenCreate = useCallback(() => {
    openCreate();
  }, [openCreate]);

  useEffect(() => {
    if (loading || searchParams.get("create") !== "1") return;

    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      handleOpenCreate();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("create");
      setSearchParams(nextParams, { replace: true });
    });
    return () => {
      active = false;
    };
  }, [handleOpenCreate, loading, searchParams, setSearchParams]);

  const filteredProjects = useMemo(
    () => filterProjects(projects, filters, membersById, sort),
    [filters, membersById, projects, sort],
  );
  const handleProjectSaved = useCallback(
    (savedProject: Project) => {
      setData((current) => {
        const projectExists = current.projects.some((project) => project.id === savedProject.id);
        const nextProjects = projectExists
          ? current.projects.map((project) =>
              project.id === savedProject.id ? savedProject : project,
            )
          : [savedProject, ...current.projects];
        return {
          ...current,
          projectTotal: projectExists ? current.projectTotal : current.projectTotal + 1,
          projects: nextProjects,
          allProjects: projectExists
            ? current.allProjects.map((project) =>
                project.id === savedProject.id ? savedProject : project,
              )
            : [savedProject, ...current.allProjects],
        };
      });
    },
    [setData],
  );

  const handleToggleFavorite = useCallback(
    async (project: Project) => {
      if (!isProjectEditable(project)) {
        message.error(PERMISSION_DENIED.editProject);
        return;
      }
      if (favoriteBusyId) return;

      setFavoriteBusyId(project.id);
      try {
        const savedProject = await updateProject(project.id, {
          favorite: !project.favorite,
        });
        handleProjectSaved(savedProject);
        message.success(
          savedProject.favorite
            ? t("projectsPage.messages.favorited")
            : t("projectsPage.messages.unfavorited"),
        );
      } catch (requestError) {
        message.error(getApiErrorMessage(requestError, t("projectsPage.messages.favoriteFailed")));
      } finally {
        setFavoriteBusyId(undefined);
      }
    },
    [favoriteBusyId, handleProjectSaved, isProjectEditable, message, t],
  );

  const projectPagination = useMemo(
    () => ({
      current: page,
      pageSize,
      total: projectTotal,
      hideOnSinglePage: true,
      showSizeChanger: false,
      showTotal: (total: number) => t("projectsPage.paginationTotal", { count: total }),
      onChange: handlePageChange,
    }),
    [handlePageChange, page, pageSize, projectTotal, t],
  );

  const projectContent =
    view === "card" ? (
      <ProjectBoard
        projects={filteredProjects}
        membersById={membersById}
        metricsByProjectId={metricsByProjectId}
        emptyDescription={
          projects.length ? t("projectsPage.states.noMatch") : t("projectsPage.states.empty")
        }
        favoriteBusyId={favoriteBusyId}
        canEdit={isProjectEditable}
        onEdit={openEdit}
        onOpenDetail={openProjectDetail}
        onToggleFavorite={(project) => void handleToggleFavorite(project)}
      />
    ) : (
      <div className="project-table-panel">
        <ProjectList
          projects={filteredProjects}
          membersById={membersById}
          metricsByProjectId={metricsByProjectId}
          pagination={projectPagination}
          canEdit={isProjectEditable}
          onEdit={openEdit}
          onOpenDetail={openProjectDetail}
        />
      </div>
    );
  const projectCardPagination =
    view === "card" ? (
      <div className="project-card-pagination">
        <Pagination {...projectPagination} />
      </div>
    ) : null;

  return (
    <div className="page-container projects-workspace-page">
      <PageHeader
        title={t("projectsPage.header.title")}
        description={t("projectsPage.header.description")}
        actions={
          <Space>
            <Tooltip title={t("projectsPage.actions.refreshData")}>
              <Button
                icon={<ReloadOutlined spin={refreshing} />}
                disabled={loading || refreshing}
                onClick={() => void refresh()}
              >
                {t("projectsPage.actions.refresh")}
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={loading}
              onClick={handleOpenCreate}
            >
              {t("projectsPage.actions.create")}
            </Button>
          </Space>
        }
      />

      <section
        className="workspace-summary project-workspace-summary"
        aria-label={t("projectsPage.summary.label")}
      >
        <article>
          <span>
            <ProjectOutlined />
          </span>
          <small>{t("projectsPage.summary.allProjects")}</small>
          <strong>{summary.total}</strong>
          <em>
            {t("projectsPage.summary.activeCount", {
              count: summary.active,
            })}
          </em>
        </article>
        <article>
          <span>
            <FlagOutlined />
          </span>
          <small>{t("projectsPage.summary.favorites")}</small>
          <strong>{summary.favorites}</strong>
          <em>{t("projectsPage.summary.favoritesNote")}</em>
        </article>
        <article>
          <span>
            <CalendarOutlined />
          </span>
          <small>{t("projectsPage.summary.allTasks")}</small>
          <strong>{summary.tasks}</strong>
          <em>{t("projectsPage.summary.allTasksNote")}</em>
        </article>
        <article className={summary.risks ? "risk" : undefined}>
          <span>
            <WarningFilled />
          </span>
          <small>{t("projectsPage.summary.overdue")}</small>
          <strong>{summary.risks}</strong>
          <em>
            {summary.risks
              ? t("projectsPage.summary.riskNote")
              : t("projectsPage.summary.healthyNote")}
          </em>
        </article>
      </section>

      <ProjectControls
        filters={filters}
        onFiltersChange={updateFilters}
        view={view}
        onViewChange={setView}
        sort={sort}
        onSortChange={setSort}
        members={members}
        filteredCount={filteredProjects.length}
        totalCount={projectTotal}
        favoriteCount={summary.favorites}
      />

      <PageState
        loading={loading}
        error={error}
        empty={!filteredProjects.length && projectTotal === 0}
        loadingDescription={t("projectsPage.states.loading")}
        errorTitle={t("projectsPage.states.errorTitle")}
        emptyDescription={
          projects.length ? t("projectsPage.states.noMatch") : t("projectsPage.states.empty")
        }
        onRetry={reload}
        emptyAction={
          projects.length ? (
            <Button onClick={() => updateFilters({})}>
              {t("projectsPage.actions.clearFilters")}
            </Button>
          ) : (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              {t("projectsPage.actions.createFirst")}
            </Button>
          )
        }
      >
        {projectContent}
        {projectCardPagination}
      </PageState>

      <ProjectFormDrawer
        open={drawerOpen}
        project={editingProject}
        members={members}
        currentMemberId={currentUser.memberId}
        onClose={closeEditor}
        onSaved={handleProjectSaved}
      />
    </div>
  );
}
