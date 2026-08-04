import { GlobalOutlined } from "@ant-design/icons";
import { App, Button, Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLanguage, type SupportedLanguage } from "@/i18n";

function LanguageSwitcher() {
  const { message } = App.useApp();
  const { i18n, t } = useTranslation();
  const [switching, setSwitching] = useState(false);
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage);
  const targetLanguage: SupportedLanguage = currentLanguage === "zh-CN" ? "en" : "zh-CN";
  const accessibleLabel =
    targetLanguage === "zh-CN" ? t("language.switchToChinese") : t("language.switchToEnglish");

  async function handleLanguageChange() {
    setSwitching(true);
    try {
      await i18n.changeLanguage(targetLanguage);
    } catch {
      message.error(t("language.switchFailed"));
    } finally {
      setSwitching(false);
    }
  }

  return (
    <Tooltip title={accessibleLabel}>
      <Button
        className="header-icon-btn header-language-btn"
        type="text"
        icon={<GlobalOutlined />}
        loading={switching}
        aria-label={accessibleLabel}
        onClick={() => void handleLanguageChange()}
      >
        {targetLanguage === "zh-CN" ? "中" : "EN"}
      </Button>
    </Tooltip>
  );
}

export default LanguageSwitcher;
