import {
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
import { useEffect, useMemo, useState } from "react";
import {
  PRIORITY_OPTIONS,
  TASK_STAGE_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_TYPE_OPTIONS,
} from "@/constants/options";
import { getApiErrorMessage } from "@/services/client";
import { createTask, deleteTask, updateTask } from "@/services/tasks";
import type { Member } from "@/types/member";
import type { Project } from "@/types/project";
import type { Task, TaskFormValues } from "@/types/task";
import { DATE_FORMAT } from "@/utils/date";
import { DEFAULT_TASK_STAGE, DEFAULT_TASK_TYPE } from "@/utils/task";

type TaskFormModel = Omit<TaskFormValues, "deadline" | "startDate"> & {
  deadline?: Dayjs;
  startDate?: Dayjs;
};

interface TaskFormDrawerProps {
  open: boolean;
  projects: Project[];
  members: Member[];
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
  initial,
  defaultProjectId,
  onClose,
  onSaved,
  onDeleted,
}: TaskFormDrawerProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<TaskFormModel>();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const projectId = Form.useWatch("projectId", form);
  const startDate = Form.useWatch("startDate", form);
  const project = projects.find((item) => item.id === projectId);

  const allowedMembers = useMemo(() => {
    const projectMemberIds = new Set(
      project?.members.map((item) => item.memberId) ?? [],
    );
    return members.filter((member) => projectMemberIds.has(member.id));
  }, [members, project]);

  const assigneeOptions = useMemo(() => {
    const options = allowedMembers.map((member) => ({
      label: member.name,
      value: member.id,
    }));
    const currentAssignee = initial?.assigneeId
      ? members.find((member) => member.id === initial.assigneeId)
      : undefined;

    if (
      initial?.assigneeId &&
      !allowedMembers.some((member) => member.id === initial.assigneeId)
    ) {
      options.push({
        label: `${currentAssignee?.name ?? "原负责人"}（已移出项目）`,
        value: initial.assigneeId,
      });
    }
    return options;
  }, [allowedMembers, initial, members]);

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

    form.setFieldsValue({
      projectId: defaultProjectId,
      workItemType: DEFAULT_TASK_TYPE,
      stage: DEFAULT_TASK_STAGE,
      status: "pending",
      priority: "medium",
      tags: [],
      startDate: dayjs(),
      deadline: dayjs().add(7, "day"),
    });
  }, [defaultProjectId, form, initial, open]);

  const close = () => {
    if (submitting || deleting) return;
    form.resetFields();
    onClose();
  };

  const handleSubmit = async (values: TaskFormModel) => {
    if (submitting || deleting) return;
    setSubmitting(true);

    const formValues: TaskFormValues = {
      ...values,
      startDate: values.startDate?.format(DATE_FORMAT),
      deadline: values.deadline?.format(DATE_FORMAT),
    };

    try {
      let savedTask: Task;
      if (initial) {
        const { projectId: unchangedProjectId, ...patch } = formValues;
        void unchangedProjectId;
        savedTask = await updateTask(initial.id, patch);
        message.success("工作项已更新");
      } else {
        savedTask = await createTask(formValues);
        message.success("工作项已创建");
      }

      onSaved(savedTask);
      form.resetFields();
      onClose();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, "保存工作项失败"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () => {
    if (!initial || submitting || deleting) return;

    modal.confirm({
      title: "删除工作项",
      content: `确定删除“${initial.title}”吗？此操作无法撤销。`,
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      async onOk() {
        setDeleting(true);
        try {
          await deleteTask(initial.id);
          message.success("工作项已删除");
          onDeleted(initial.id);
          form.resetFields();
          onClose();
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, "删除工作项失败"));
          throw requestError;
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  return (
    <Drawer
      title={initial ? "编辑工作项" : "创建工作项"}
      size={540}
      open={open}
      onClose={close}
      keyboard={!submitting && !deleting}
      footer={
        <div className="task-form-footer">
          <div>
            {initial ? (
              <Button
                danger
                disabled={submitting}
                loading={deleting}
                onClick={confirmDelete}
              >
                删除工作项
              </Button>
            ) : null}
          </div>
          <Space>
            <Button disabled={submitting || deleting} onClick={close}>
              取消
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={deleting}
              onClick={() => form.submit()}
            >
              {initial ? "保存修改" : "创建工作项"}
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        disabled={submitting || deleting}
        onFinish={(values) => void handleSubmit(values)}
      >
        <Form.Item
          name="projectId"
          label="所属项目"
          rules={[{ required: true, message: "请选择所属项目" }]}
        >
          <Select
            placeholder="选择项目"
            options={projects
              .filter((item) => item.status !== "archived")
              .map((item) => ({ label: item.name, value: item.id }))}
            disabled={Boolean(initial) || submitting || deleting}
            onChange={() => form.setFieldValue("assigneeId", undefined)}
          />
        </Form.Item>
        <Form.Item
          name="title"
          label="工作项标题"
          rules={[
            { required: true, message: "请输入工作项标题" },
            { min: 2, max: 80, message: "标题应为 2–80 个字符" },
          ]}
        >
          <Input
            placeholder="明确描述一个可交付工作项"
            showCount
            maxLength={80}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label="工作项描述"
          rules={[
            { required: true, message: "请输入工作项描述" },
            { max: 500, message: "描述不能超过 500 个字符" },
          ]}
        >
          <Input.TextArea
            rows={4}
            showCount
            maxLength={500}
            placeholder="补充背景、验收标准和相关说明"
          />
        </Form.Item>
        <div className="form-grid-2">
          <Form.Item
            name="workItemType"
            label="工作项类型"
            rules={[{ required: true, message: "请选择工作项类型" }]}
          >
            <Select options={[...TASK_TYPE_OPTIONS]} />
          </Form.Item>
          <Form.Item
            name="stage"
            label="项目阶段"
            rules={[{ required: true, message: "请选择项目阶段" }]}
          >
            <Select options={[...TASK_STAGE_OPTIONS]} />
          </Form.Item>
        </div>
        <div className="form-grid-2">
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: "请选择状态" }]}
          >
            <Select options={[...TASK_STATUS_OPTIONS]} />
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: "请选择优先级" }]}
          >
            <Select options={[...PRIORITY_OPTIONS]} />
          </Form.Item>
        </div>
        <Form.Item name="assigneeId" label="负责人">
          <Select
            allowClear
            placeholder="暂不分配"
            options={assigneeOptions}
          />
        </Form.Item>
        <div className="form-grid-2">
          <Form.Item name="startDate" label="开始日期">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="deadline"
            label="截止日期"
            dependencies={["startDate"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value?: Dayjs) {
                  const start = getFieldValue("startDate") as Dayjs | undefined;
                  if (!start || !value || !value.isBefore(start, "day")) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("截止日期不能早于开始日期"));
                },
              }),
            ]}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(current) =>
                Boolean(startDate && current.isBefore(startDate, "day"))
              }
            />
          </Form.Item>
        </div>
        <Form.Item name="tags" label="标签">
          <Select
            mode="tags"
            tokenSeparators={[",", "，"]}
            placeholder="输入后回车添加标签"
            maxCount={5}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
