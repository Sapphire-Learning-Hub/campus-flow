import { Alert, App, Button, Drawer, Form, Select, Space } from "antd";
import { useEffect, useMemo, useState } from "react";
import { ROLE_OPTIONS } from "@/constants/options";
import { getApiErrorMessage } from "@/services/client";
import {
  addProjectMember,
  removeProjectMember,
  updateProjectMember,
} from "@/services/members";
import type {
  ManageableProjectRole,
  Member,
  ProjectMember,
  ProjectMemberInput,
} from "@/types/member";
import type { Project } from "@/types/project";
import {
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/projectPermissions";

const MANAGEABLE_ROLE_OPTIONS = ROLE_OPTIONS.filter(
  (option): option is { label: string; value: ManageableProjectRole } =>
    option.value !== "owner",
);

interface MemberFormDrawerProps {
  open: boolean;
  project?: Project;
  members: Member[];
  currentMemberId: string;
  initial?: ProjectMember;
  onClose: () => void;
  onSaved: (project: Project) => void;
}

export function MemberFormDrawer({
  open,
  project,
  members,
  currentMemberId,
  initial,
  onClose,
  onSaved,
}: MemberFormDrawerProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<ProjectMemberInput>();
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const canManageMembers = getProjectPermissions(
    project,
    currentMemberId,
  ).canManageMembers;

  const memberOptions = useMemo(() => {
    const existingMemberIds = new Set(
      project?.members.map((item) => item.memberId) ?? [],
    );
    return members
      .filter(
        (member) =>
          member.id === initial?.memberId || !existingMemberIds.has(member.id),
      )
      .map((member) => ({
        label: `${member.name} · ${member.department}`,
        value: member.id,
      }));
  }, [initial?.memberId, members, project]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      memberId: initial?.memberId,
      role: initial && initial.role !== "owner" ? initial.role : "member",
    });
  }, [form, initial, open]);

  const close = () => {
    if (submitting || removing) return;
    form.resetFields();
    onClose();
  };

  const handleSubmit = async (values: ProjectMemberInput) => {
    if (!project || submitting || removing) return;
    if (!canManageMembers) {
      message.error(PERMISSION_DENIED.manageMembers);
      return;
    }

    setSubmitting(true);
    try {
      const savedProject = initial
        ? await updateProjectMember(project.id, initial.memberId, {
            role: values.role,
          })
        : await addProjectMember(project.id, values);
      message.success(initial ? "成员角色已更新" : "成员已添加");
      onSaved(savedProject);
      close();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, "成员保存失败"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemove = () => {
    if (!project || !initial || submitting || removing) return;
    if (!canManageMembers) {
      message.error(PERMISSION_DENIED.manageMembers);
      return;
    }

    const memberName =
      members.find((member) => member.id === initial.memberId)?.name ??
      "该成员";
    modal.confirm({
      title: "移除项目成员",
      content: `确定将“${memberName}”移出“${project.name}”吗？其负责任务会变为未分配。`,
      okText: "移除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      async onOk() {
        setRemoving(true);
        try {
          const savedProject = await removeProjectMember(
            project.id,
            initial.memberId,
          );
          message.success("成员已移出项目");
          onSaved(savedProject);
          form.resetFields();
          onClose();
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, "移除成员失败"));
          throw requestError;
        } finally {
          setRemoving(false);
        }
      },
    });
  };

  const permissionDescription = !project
    ? "请先选择需要管理成员的项目"
    : PERMISSION_DENIED.manageMembers;

  return (
    <Drawer
      title={initial ? "管理项目成员" : "添加项目成员"}
      size={440}
      open={open}
      onClose={close}
      footer={
        <div className="entity-form-footer">
          <div>
            {initial && initial.role !== "owner" && canManageMembers ? (
              <Button
                danger
                loading={removing}
                disabled={submitting}
                onClick={confirmRemove}
              >
                移出项目
              </Button>
            ) : null}
          </div>
          <Space>
            <Button disabled={submitting || removing} onClick={close}>
              取消
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={!project || !canManageMembers || removing}
              onClick={() => form.submit()}
            >
              {initial ? "保存角色" : "添加成员"}
            </Button>
          </Space>
        </div>
      }
    >
      {!project || !canManageMembers ? (
        <Alert
          showIcon
          type="warning"
          title={!project ? "未选择项目" : "权限不足"}
          description={permissionDescription}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Form
        form={form}
        layout="vertical"
        disabled={submitting || removing || !project || !canManageMembers}
        onFinish={(values) => void handleSubmit(values)}
      >
        <Form.Item
          name="memberId"
          label="成员"
          rules={[{ required: true, message: "请选择成员" }]}
        >
          <Select
            showSearch={{ optionFilterProp: "label" }}

            placeholder="选择要加入项目的成员"
            options={memberOptions}
            disabled={Boolean(initial)}
          />
        </Form.Item>
        <Form.Item
          name="role"
          label="项目角色"
          rules={[{ required: true, message: "请选择项目角色" }]}
        >
          <Select options={MANAGEABLE_ROLE_OPTIONS} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
