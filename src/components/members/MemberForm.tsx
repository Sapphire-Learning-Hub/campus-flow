import { Alert, App, Button, Drawer, Form, Select, Space } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedOptions } from "@/hooks/useLocalizedOptions";
import { getApiErrorMessage } from "@/services/client";
import { addProjectMember, removeProjectMember, updateProjectMember } from "@/services/members";
import type { Member, ProjectMember, ProjectMemberInput } from "@/types/member";
import type { Project } from "@/types/project";
import { getProjectPermissions, PERMISSION_DENIED } from "@/utils/Permissions.ts";
import { getMemberValidationRules } from "@/utils/formRules";

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
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const { roleOptions } = useLocalizedOptions();
  const manageableRoleOptions = useMemo(
    () => roleOptions.filter((option) => option.value !== "owner"),
    [roleOptions],
  );
  const [form] = Form.useForm<ProjectMemberInput>();
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const validationRules = getMemberValidationRules(t);
  const canManageMembers = getProjectPermissions(project, currentMemberId).canManageMembers;

  const memberOptions = useMemo(() => {
    const existingMemberIds = new Set(project?.members.map((item) => item.memberId) ?? []);
    return members
      .filter((member) => member.id === initial?.memberId || !existingMemberIds.has(member.id))
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
      message.success(
        initial ? t("memberForm.messages.roleUpdated") : t("memberForm.messages.added"),
      );
      onSaved(savedProject);
      close();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, t("memberForm.messages.saveFailed")));
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
      t("memberForm.fallbackMember");
    modal.confirm({
      title: t("memberForm.remove.title"),
      content: t("memberForm.remove.confirm", {
        member: memberName,
        project: project.name,
      }),
      okText: t("memberForm.actions.remove"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      async onOk() {
        setRemoving(true);
        try {
          const savedProject = await removeProjectMember(project.id, initial.memberId);
          message.success(t("memberForm.messages.removed"));
          onSaved(savedProject);
          form.resetFields();
          onClose();
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, t("memberForm.messages.removeFailed")));
          throw requestError;
        } finally {
          setRemoving(false);
        }
      },
    });
  };

  const permissionDescription = !project
    ? t("memberForm.selectProjectFirst")
    : PERMISSION_DENIED.manageMembers;

  return (
    <Drawer
      title={initial ? t("memberForm.title.manage") : t("memberForm.title.add")}
      size={440}
      open={open}
      onClose={close}
      footer={
        <div className="entity-form-footer">
          <div>
            {initial && initial.role !== "owner" && canManageMembers ? (
              <Button danger loading={removing} disabled={submitting} onClick={confirmRemove}>
                {t("memberForm.actions.remove")}
              </Button>
            ) : null}
          </div>
          <Space>
            <Button disabled={submitting || removing} onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={!project || !canManageMembers || removing}
              onClick={() => form.submit()}
            >
              {initial ? t("memberForm.actions.saveRole") : t("memberForm.actions.add")}
            </Button>
          </Space>
        </div>
      }
    >
      {!project || !canManageMembers ? (
        <Alert
          showIcon
          type="warning"
          title={!project ? t("memberForm.noProject") : t("common.permissionDenied")}
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
          label={t("memberForm.fields.member")}
          rules={validationRules.memberId}
        >
          <Select
            showSearch={{ optionFilterProp: "label" }}

            placeholder={t("memberForm.placeholders.member")}
            options={memberOptions}
            disabled={Boolean(initial)}
          />
        </Form.Item>
        <Form.Item name="role" label={t("memberForm.fields.role")} rules={validationRules.role}>
          <Select options={manageableRoleOptions} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
