import type { ThemeMode } from "@/types/settings.ts";
import { useTranslation } from "react-i18next";
import { ColorPicker, Radio } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";

const THEME_COLORS = [
  "#1d5eff",
  "#722ed1",
  "#13c2c2",
  "#52c41a",
  "#faad14",
  "#fa541c",
  "#f5222d",
  "#2f54eb",
];
export function AppearanceSettingsContent({
  themeMode,
  themeColor,
  onThemeModeChange,
  onThemeColorChange,
}: {
  themeMode: ThemeMode;
  themeColor: string;
  onThemeModeChange: (mode: ThemeMode) => void;
  onThemeColorChange: (color: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <section className="settings-section-block">
        <div className="settings-field-heading">
          <div>
            <b>{t("settings.appearance.themeMode")}</b>
            <span>{t("settings.appearance.themeModeDescription")}</span>
          </div>
          <small>{t("settings.appearance.autoSave")}</small>
        </div>
        <Radio.Group
          className="theme-mode-group"
          value={themeMode}
          onChange={(event) => onThemeModeChange(event.target.value as ThemeMode)}
        >
          <Radio.Button value="light">
            <div className="theme-card">
              <div className="theme-preview light">
                <i />
                <span />
              </div>
              <b>{t("settings.appearance.light")}</b>
            </div>
          </Radio.Button>
          <Radio.Button value="dark">
            <div className="theme-card">
              <div className="theme-preview dark">
                <i />
                <span />
              </div>
              <b>{t("settings.appearance.dark")}</b>
            </div>
          </Radio.Button>
          <Radio.Button value="system">
            <div className="theme-card">
              <div className="theme-preview system">
                <i />
                <span />
              </div>
              <b>{t("settings.appearance.system")}</b>
            </div>
          </Radio.Button>
        </Radio.Group>
      </section>

      <section className="settings-section-block settings-section-block-last">
        <div className="settings-field-heading">
          <div>
            <b>{t("settings.appearance.themeColor")}</b>
            <span>{t("settings.appearance.themeColorDescription")}</span>
          </div>
          <ColorPicker
            value={themeColor}
            showText
            onChangeComplete={(color) => onThemeColorChange(color.toHexString())}
          />
        </div>
        <div className="color-options" aria-label={t("settings.appearance.recommendedColors")}>
          {THEME_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`color-item ${themeColor === color ? "active" : ""}`}
              aria-label={t("settings.appearance.selectColor", { color })}
              title={color}
              style={{ backgroundColor: color }}
              onClick={() => onThemeColorChange(color)}
            >
              {themeColor === color ? <CheckCircleFilled /> : null}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
