import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();

  return (
    <Link
      className="brand-mark"
      to="/dashboard"
      aria-label={t("brand.dashboard")}
    >
      <span className="brand-symbol" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {compact ? null : <span>CampusFlow</span>}
    </Link>
  );
}
