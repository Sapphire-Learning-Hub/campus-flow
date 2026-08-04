import { Alert, App, Button, DatePicker, Drawer, Form, Input, Select, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedOptions } from "@/hooks/useLocalizedOptions";
import { getApiErrorMessage } from "@/services/client";
import { createTask, deleteTask, updateTask } from "@/services/tasks";
import type { Member } from "@/types/member";
import type { Project } from "@/types/project";
import type { Task, TaskFormValues } from "@/types/task";
import { DATE_FORMAT } from "@/utils/date";
import {
  canDeleteTask,
  canEditTask,
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/Permissions.ts";
import { getTaskValidationRules } from "@/utils/formRules";
import { DEFAULT_TASK_STAGE, DEFAULT_TASK_TYPE } from "@/utils/task";

type TaskFormModel = Omit<TaskFormValues, "deadline" | "startDate"> & {
  deadline?: Dayjs;
  startDate?: Dayjs;
};

interface TaskFormDrawerProps {
  open: boolean;
  projects: Project[];
  members: Member[];
  currentMemberId: string;
  initial?: Task;
  defaultProjectId?: string;
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted: (taskId: string) => void;
}

export function TaskFormDrawer({
  open,
  projects,
  members,
  currentMemberId,
  initial,
  defaultProjectId,
  onClose,
  onSaved,
  onDeleted,
}: TaskFormDrawerProps) {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const { priorityOptions, taskStageOptions, taskStatusOptions, taskTypeOptions } =
    useLocalizedOptions();
  const [form] = Form.useForm<TaskFormModel>();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const validationRules = getTaskValidationRules(t);
  const projectId = Form.useWatch("projectId", form);
  const startDate = Form.useWatch("startDate", form);
  const project = projects.find((item) => item.id === projectId);
  const permissions = getProjectPermissions(project, currentMemberId);
  const readOnly = initial ? !canEditTask(project, currentMemberId, initial) : false;
  const canDeleteCurrentTask = initial ? canDeleteTask(project, currentMemberId) : false;

  const creatableProjects = useMemo(
    () =>
      projects.filter(
        (item) =>
          item.status !== "archived" && getProjectPermissions(item, currentMemberId).canCreateTask,
      ),
    [currentMemberId, projects],
  );

  const allowedMembers = useMemo(() => {
    const projectMemberIds = new Set(project?.members.map((item) => item.memberId) ?? []);
    return members.filter((member) => projectMemberIds.has(member.id));
  }, [members, project]);

  const assigneeOptions = useMemo(() => {
    const assignableMembers = permissions.canManageAllTasks
      ? allowedMembers
      : allowedMembers.filter((member) => member.id === currentMemberId);
    const options = assignableMembers.map((member) => ({
      label: member.name,
      value: member.id,
    }));
    const currentAssignee = initial?.assigneeId
      ? members.find((member) => member.id === initial.assigneeId)
      : undefined;

    if (initial?.assigneeId && !allowedMembers.some((member) => member.id === initial.assigneeId)) {
      options.push({
        label: t("taskForm.removedAssignee", {
          name: currentAssignee?.name ?? t("taskForm.previousAssignee"),
        }),
        value: initial.assigneeId,
      });
    }
    return options;
  }, [allowedMembers, currentMemberId, initial, members, permissions.canManageAllTasks, t]);

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    if (initial) {
      form.setFieldsValue({
        ...initial,
        workItemType: initial.workItemType ?? DEFAULT_TASK_TYPE,
        stage: initial.stage ?? DEFAULT_TASK_STAGE,
        startDate: initial.startDate ? dayjs(initial.startDate) : undefined,
        deadline: initial.deadline ? dayjs(initial.deadline) : undefined,
      });
      return;
    }

    const initialProjectId = creatableProjects.some((item) => item.id === defaultProjectId)
      ? defaultProjectId
      : creatableProjects[0]?.id;
    const initialProject = creatableProjects.find((item) => item.id === initialProjectId);
    const initialPermissions = getProjectPermissions(initialProject, currentMemberId);
    form.setFieldsValue({
      projectId: initialProjectId,
      assigneeId: initialPermissions.role === "member" ? currentMemberId : undefined,
      workItemType: DEFAULT_TASK_TYPE,
      stage: DEFAULT_TASK_STAGE,
      status: "pending",
      priority: "medium",
      tags: [],
      startDate: dayjs(),
      deadline: dayjs().add(7, "day"),
    });
  }, [creatableProjects, currentMemberId, defaultProjectId, form, initial, open]);

  const close = () => {
    if (submitting || deleting) return;
    if (!form.isFieldsTouched()) {
      form.resetFields();
      onClose();
      return;
    }
    modal.confirm({
      title: t("common.discard.title"),
      content: t("common.discard.confirm"),
      okText: t("common.discard.ok"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true },
      onOk() {
        form.resetFields();
        onClose();
      },
    });
  };

  const handleSubmit = async (values: TaskFormModel) => {
    if (submitting || deleting) return;
    const selectedProject = projects.find((item) => item.id === values.projectId);
    const selectedPermissions = getProjectPermissions(selectedProject, currentMemberId);
    if (
      (initial && !canEditTask(selectedProject, currentMemberId, initial)) ||
      (!initial && !selectedPermissions.canCreateTask)
    ) {
      message.error(initial ? PERMISSION_DENIED.editTask : PERMISSION_DENIED.createTask);
      return;
    }
    setSubmitting(true);

    const formValues: TaskFormValues = {
      ...values,
      assigneeId: selectedPermissions.role === "member" ? currentMemberId : values.assigneeId,
      startDate: values.startDate?.format(DATE_FORMAT),
      deadline: values.deadline?.format(DATE_FORMAT),
    };

    try {
      let savedTask: Task;
      if (initial) {
        const { projectId: unchangedProjectId, ...patch } = formValues;
        void unchangedProjectId;
        savedTask = await updateTask(initial.id, patch);
        message.success(t("taskForm.messages.updated"));
      } else {
        savedTask = await createTask(formValues);
        message.success(t("taskForm.messages.created"));
      }

      onSaved(savedTask);
      form.resetFields();
      onClose();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, t("taskForm.messages.saveFailed")));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () => {
    if (!initial || submitting || deleting) return;
    if (!canDeleteCurrentTask) {
      message.error(PERMISSION_DENIED.deleteTask);
      return;
    }

    modal.confirm({
      title: t("taskForm.delete.title"),
      content: t("taskForm.delete.confirm", { title: initial.title }),
      okText: t("taskForm.actions.delete"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      async onOk() {
        setDeleting(true);
        try {
          await deleteTask(initial.id);
          message.success(t("taskForm.messages.deleted"));
          onDeleted(initial.id);
          form.resetFields();
          onClose();
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, t("taskForm.messages.deleteFailed")));
          throw requestError;
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  return (
    <Drawer
      title={
        initial
          ? readOnly
            ? t("taskForm.title.view")
            : t("taskForm.title.edit")
          : t("taskForm.title.create")
      }
      size={540}
      open={open}
      onClose={close}
      keyboard={!submitting && !deleting}
      footer={
        <div className="entity-form-footer">
          <div>
            {initial && canDeleteCurrentTask ? (
              <Button danger disabled={submitting} loading={deleting} onClick={confirmDelete}>
                {t("taskForm.actions.delete")}
              </Button>
            ) : null}
          </div>
          {readOnly ? (
            <Button onClick={close}>{t("common.close")}</Button>
          ) : (
            <Space>
              <Button
                disabled={submitting || deleting}
                onClick={() => {
                  close();
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="primary"
                loading={submitting}
                disabled={deleting}
                onClick={() => form.submit()}
              >
                {initial ? t("taskForm.actions.save") : t("taskForm.actions.create")}
              </Button>
            </Space>
          )}
        </div>
      }
    >
      {readOnly ? (
        <Alert
          showIcon
          type="warning"
          title={t("taskForm.readOnlyTitle")}
          description={PERMISSION_DENIED.editTask}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        disabled={submitting || deleting || readOnly}
        onFinish={(values) => void handleSubmit(values)}
      >
        <Form.Item
          name="projectId"
          label={t("taskForm.fields.project")}
          rules={validationRules.projectId}
        >
          <Select
            placeholder={t("taskForm.placeholders.project")}
            options={(initial ? projects : creatableProjects).map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            disabled={Boolean(initial) || submitting || deleting}
            onChange={(nextProjectId) => {
              alert("你确认吗");
              const nextProject = projects.find((item) => item.id === nextProjectId);
              const nextPermissions = getProjectPermissions(nextProject, currentMemberId);
              form.setFieldValue(
                "assigneeId",
                nextPermissions.role === "member" ? currentMemberId : undefined,
              );
            }}
          />
        </Form.Item>
        <Form.Item name="title" label={t("taskForm.fields.title")} rules={validationRules.title}>
          <Input placeholder={t("taskForm.placeholders.title")} showCount maxLength={80} />
        </Form.Item>
        <Form.Item
          name="description"
          label={t("taskForm.fields.description")}
          rules={validationRules.description}
        >
          <Input.TextArea
            rows={4}
            showCount
            maxLength={500}
            placeholder={t("taskForm.placeholders.description")}
          />
        </Form.Item>
        <div className="form-grid-2">
          <Form.Item
            name="workItemType"
            label={t("taskForm.fields.type")}
            rules={validationRules.workItemType}
          >
            <Select options={taskTypeOptions} />
          </Form.Item>
          <Form.Item name="stage" label={t("taskForm.fields.stage")} rules={validationRules.stage}>
            <Select options={taskStageOptions} />
          </Form.Item>
        </div>
        <div className="form-grid-2">
          <Form.Item
            name="status"
            label={t("taskForm.fields.status")}
            rules={validationRules.status}
          >
            <Select options={taskStatusOptions} />
          </Form.Item>
          <Form.Item
            name="priority"
            label={t("taskForm.fields.priority")}
            rules={validationRules.priority}
          >
            <Select options={priorityOptions} />
          </Form.Item>
        </div>
        <Form.Item name="assigneeId" label={t("taskForm.fields.assignee")}>
          <Select
            allowClear
            placeholder={t("taskForm.placeholders.assignee")}
            options={assigneeOptions}
            disabled={readOnly || permissions.role === "member"}
          />
        </Form.Item>
        <div className="form-grid-2">
          <Form.Item name="startDate" label={t("taskForm.fields.startDate")}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="deadline"
            label={t("taskForm.fields.deadline")}
            dependencies={["startDate"]}
            rules={validationRules.deadline}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(current) => Boolean(startDate && current.isBefore(startDate, "day"))}
            />
          </Form.Item>
        </div>
        <Form.Item name="tags" label={t("taskForm.fields.tags")}>
          <Select
            mode="tags"
            tokenSeparators={[",", "，"]}
            placeholder={t("taskForm.placeholders.tags")}
            maxCount={5}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
