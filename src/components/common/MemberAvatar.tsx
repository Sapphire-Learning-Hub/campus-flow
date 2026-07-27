import { Avatar, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import type { Member } from "@/types/member.ts";

interface MemberAvatarProps {
  member?: Member;
  size?: number | "small" | "default" | "large";
  showName?: boolean;
}

export function MemberAvatar({
  member,
  size = "default",
  showName = false,
}: MemberAvatarProps) {
  const { t } = useTranslation();
  const displayName = member?.name ?? t("common.unassigned");
  const avatar = (
    <Avatar
      src={member?.avatar}
      size={size}
      style={{ background: member?.color ?? "#94a3b8", flexShrink: 0 }}
    >
      {member?.name.slice(0, 1) ?? "?"}
    </Avatar>
  );

  if (showName)
    return (
      <span className="member-inline">
        {avatar}
        <span>{displayName}</span>
      </span>
    );
  return <Tooltip title={displayName}>{avatar}</Tooltip>;
}
