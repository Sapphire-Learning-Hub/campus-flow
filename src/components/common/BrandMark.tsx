import { Link } from "react-router";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand-mark" to="/dashboard" aria-label="CampusFlow 工作台">
      <span className="brand-symbol" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {compact ? null : <span>CampusFlow</span>}
    </Link>
  );
}
