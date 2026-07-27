import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  ROLE_OPTIONS,
  TASK_STAGE_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_TYPE_OPTIONS,
} from "@/constants/options";

export function useLocalizedOptions() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      projectStatusOptions: PROJECT_STATUS_OPTIONS.map((option) => ({
        ...option,
        label: t(`options.projectStatus.${option.value}`),
      })),
      taskStatusOptions: TASK_STATUS_OPTIONS.map((option) => ({
        ...option,
        label: t(`options.taskStatus.${option.value}`),
      })),
      taskTypeOptions: TASK_TYPE_OPTIONS.map((option) => ({
        ...option,
        label: t(`options.taskType.${option.value}`),
      })),
      taskStageOptions: TASK_STAGE_OPTIONS.map((option) => ({
        ...option,
        label: t(`options.taskStage.${option.value}`),
      })),
      priorityOptions: PRIORITY_OPTIONS.map((option) => ({
        ...option,
        label: t(`options.priority.${option.value}`),
      })),
      roleOptions: ROLE_OPTIONS.map((option) => ({
        ...option,
        label: t(`options.role.${option.value}`),
      })),
    }),
    [t],
  );
}
