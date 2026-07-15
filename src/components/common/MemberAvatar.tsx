import { Avatar, Tooltip } from "antd";
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
        <span>{member?.name ?? "未分配"}</span>
      </span>
    );
  return <Tooltip title={member?.name ?? "未分配"}>{avatar}</Tooltip>;
}
