import {
  Alert,
  App,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Select,
  Space,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { PROJECT_STATUS_OPTIONS } from "@/constants/options";
import { getApiErrorMessage } from "@/services/client";
import { createProject, updateProject } from "@/services/projects";
import type { Member } from "@/types/member";
import type { Project, ProjectFormValues, ProjectPatch } from "@/types/project";
import { DATE_FORMAT } from "@/utils/date";
import {
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/Permissions.ts";

type ProjectFormModel = Pick<
  Project,
  "name" | "description" | "status" | "color"
> & {
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
  const { message } = App.useApp();
  const [form] = Form.useForm<ProjectFormModel>();
  const [submitting, setSubmitting] = useState(false);
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
      deadline: project?.deadline
        ? dayjs(project.deadline)
        : dayjs().add(30, "day"),
      color: project?.color ?? "#1d5eff",
      memberIds: [],
    });
  }, [form, open, project]);

  const close = () => {
    if (submitting) return;
    form.resetFields();
    onClose();
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
        message.success("项目信息已更新");
      } else {
        savedProject = await createProject({
          ...baseValues,
          leaderId: currentMemberId,
          memberIds: values.memberIds ?? [],
        } as ProjectFormValues);
        message.success("项目已创建");
      }
      onSaved(savedProject);
      form.resetFields();
      onClose();
    } catch (requestError) {
      message.error(
        getApiErrorMessage(
          requestError,
          project ? "项目更新失败" : "项目创建失败",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={project ? (canEditProject ? "编辑项目" : "查看项目") : "创建项目"}
      size={500}
      open={open}
      onClose={close}
      footer={
        <div className="entity-form-footer">
          <span />
          <Space>
            <Button disabled={submitting} onClick={close}>
              取消
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={!canEditProject}
              onClick={() => form.submit()}
            >
              {project ? "保存修改" : "创建项目"}
            </Button>
          </Space>
        </div>
      }
    >
      {!canEditProject ? (
        <Alert
          showIcon
          type="warning"
          title="权限不足"
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
        <Form.Item
          name="name"
          label="项目名称"
          rules={[
            { required: true, message: "请输入项目名称" },
            { min: 2, max: 50, message: "项目名称应为 2–50 个字符" },
          ]}
        >
          <Input maxLength={50} showCount />
        </Form.Item>
        <Form.Item
          name="description"
          label="项目描述"
          rules={[
            { required: true, message: "请输入项目描述" },
            { max: 300, message: "项目描述不能超过 300 个字符" },
          ]}
        >
          <Input.TextArea rows={4} maxLength={300} showCount />
        </Form.Item>
        <Form.Item
          name="status"
          label="项目状态"
          rules={[{ required: true, message: "请选择项目状态" }]}
        >
          <Select options={[...PROJECT_STATUS_OPTIONS]} />
        </Form.Item>
        <Form.Item
          name="deadline"
          label="截止日期"
          rules={[{ required: true, message: "请选择截止日期" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="color"
          label="项目颜色"
          rules={[{ required: true, message: "请输入项目颜色" }]}
        >
          <Input type="color" style={{ width: 72 }} />
        </Form.Item>
        {!project ? (
          <Form.Item name="memberIds" label="初始成员">
            <Select
              mode="multiple"
              allowClear
              placeholder="可选，创建后仍可继续添加"
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
