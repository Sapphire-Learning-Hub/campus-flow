import { Alert, App, Button, DatePicker, Drawer, Form, Input, Select, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedOptions } from "@/hooks/useLocalizedOptions";
import { getApiErrorMessage } from "@/services/client";
import { createProject, updateProject } from "@/services/projects";
import type { Member } from "@/types/member";
import type { Project, ProjectFormValues, ProjectPatch } from "@/types/project";
import { DATE_FORMAT } from "@/utils/date";
import { getProjectPermissions, PERMISSION_DENIED } from "@/utils/Permissions.ts";
import { getProjectValidationRules } from "@/utils/formRules";

type ProjectFormModel = Pick<Project, "name" | "description" | "status" | "color"> & {
  deadline: Dayjs;
  memberIds?: string[];
};

interface ProjectFormDrawerProps {
  open: boolean;
  project?: Project;
  members?: Member[];
  currentMemberId: string;
  onClose: () => void;
  onSaved: (project: Project) => void;
}

export function ProjectFormDrawer({
  open,
  project,
  members = [],
  currentMemberId,
  onClose,
  onSaved,
}: ProjectFormDrawerProps) {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const { projectStatusOptions } = useLocalizedOptions();
  const [form] = Form.useForm<ProjectFormModel>();
  const [submitting, setSubmitting] = useState(false);
  const validationRules = getProjectValidationRules(t);
  const canEditProject = project
    ? getProjectPermissions(project, currentMemberId).canEditProject
    : true;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      name: project?.name ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "planning",
      deadline: project?.deadline ? dayjs(project.deadline) : dayjs().add(30, "day"),
      color: project?.color ?? "#1d5eff",
      memberIds: [],
    });
  }, [form, open, project]);

  const close = () => {
    if (submitting) return;
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

  const handleSubmit = async (values: ProjectFormModel) => {
    if (!canEditProject || submitting) {
      message.error(PERMISSION_DENIED.editProject);
      return;
    }

    setSubmitting(true);
    const baseValues = {
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
      deadline: values.deadline.format(DATE_FORMAT),
    };
    try {
      let savedProject: Project;
      if (project) {
        const patch: ProjectPatch = {
          name: baseValues.name,
          description: baseValues.description,
          status: baseValues.status,
          deadline: baseValues.deadline,
          color: baseValues.color,
        };
        savedProject = await updateProject(project.id, patch);
        message.success(t("projectForm.messages.updated"));
      } else {
        savedProject = await createProject({
          ...baseValues,
          leaderId: currentMemberId,
          memberIds: values.memberIds ?? [],
        } as ProjectFormValues);
        message.success(t("projectForm.messages.created"));
      }
      onSaved(savedProject);
      form.resetFields();
      onClose();
    } catch (requestError) {
      message.error(
        getApiErrorMessage(
          requestError,
          project ? t("projectForm.messages.updateFailed") : t("projectForm.messages.createFailed"),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={
        project
          ? canEditProject
            ? t("projectForm.title.edit")
            : t("projectForm.title.view")
          : t("projectForm.title.create")
      }
      size={500}
      open={open}
      onClose={close}
      footer={
        <div className="entity-form-footer">
          <span />
          <Space>
            <Button disabled={submitting} onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={!canEditProject}
              onClick={() => form.submit()}
            >
              {project ? t("projectForm.actions.save") : t("projectForm.actions.create")}
            </Button>
          </Space>
        </div>
      }
    >
      {!canEditProject ? (
        <Alert
          showIcon
          type="warning"
          title={t("common.permissionDenied")}
          description={PERMISSION_DENIED.editProject}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Form
        form={form}
        layout="vertical"
        disabled={submitting || !canEditProject}
        onFinish={(values) => void handleSubmit(values)}
      >
        <Form.Item name="name" label={t("projectForm.fields.name")} rules={validationRules.name}>
          <Input maxLength={50} showCount />
        </Form.Item>
        <Form.Item
          name="description"
          label={t("projectForm.fields.description")}
          rules={validationRules.description}
        >
          <Input.TextArea rows={4} maxLength={300} showCount />
        </Form.Item>
        <Form.Item
          name="status"
          label={t("projectForm.fields.status")}
          rules={validationRules.status}
        >
          <Select options={projectStatusOptions} />
        </Form.Item>
        <Form.Item
          name="deadline"
          label={t("projectForm.fields.deadline")}
          rules={validationRules.deadline}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="color" label={t("projectForm.fields.color")} rules={validationRules.color}>
          <Input type="color" style={{ width: 72 }} />
        </Form.Item>
        {!project ? (
          <Form.Item name="memberIds" label={t("projectForm.fields.initialMembers")}>
            <Select
              mode="multiple"
              allowClear
              placeholder={t("projectForm.placeholders.initialMembers")}
              options={members
                .filter((member) => member.id !== currentMemberId)
                .map((member) => ({
                  label: `${member.name} · ${member.department}`,
                  value: member.id,
                }))}
            />
          </Form.Item>
        ) : null}
      </Form>
    </Drawer>
  );
}
