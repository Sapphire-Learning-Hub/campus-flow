import type {
  PageSize,
  ProjectView,
  SettingsFormValues,
  TaskView,
} from "@/types/settings.ts";
import { useTranslation } from "react-i18next";
import { Button, Form, Select } from "antd";
import { useEffect, useMemo } from "react";

export function PreferencesSettingsContent({
  initialValues,
  onSave,
}: {
  initialValues: Pick<
    SettingsFormValues,
    "pageSize" | "defaultProjectView" | "defaultTaskView"
  >;
  onSave: (values: SettingsFormValues) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm<SettingsFormValues>();
  const { pageSize, defaultProjectView, defaultTaskView } = initialValues;
  const pageSizeOptions = useMemo(
    () =>
      ([5, 10, 20, 50] as PageSize[]).map((value) => ({
        label: t("settings.preferences.rowsPerPage", { count: value }),
        value,
      })),
    [t],
  );
  const viewOptions = useMemo<
    Array<{ label: string; value: ProjectView | TaskView }>
  >(
    () => [
      { label: t("settings.preferences.cardView"), value: "card" },
      { label: t("settings.preferences.listView"), value: "list" },
    ],
    [t],
  );

  useEffect(() => {
    form.setFieldsValue({ pageSize, defaultProjectView, defaultTaskView });
  }, [defaultProjectView, defaultTaskView, form, pageSize]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={initialValues}
      onFinish={(values) => void onSave(values)}
    >
      <div className="settings-form-grid">
        <Form.Item
          label={t("settings.preferences.defaultPageSize")}
          name="pageSize"
        >
          <Select options={pageSizeOptions} />
        </Form.Item>
        <Form.Item
          label={t("settings.preferences.defaultProjectView")}
          name="defaultProjectView"
        >
          <Select options={viewOptions} />
        </Form.Item>
        <Form.Item
          label={t("settings.preferences.defaultTaskView")}
          name="defaultTaskView"
        >
          <Select options={viewOptions} />
        </Form.Item>
      </div>
      <div className="settings-actions settings-actions-end">
        <Button type="primary" htmlType="submit">
          {t("settings.preferences.save")}
        </Button>
      </div>
    </Form>
  );
}
