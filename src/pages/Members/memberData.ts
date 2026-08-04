import type { Member, ProjectRole } from "@/types/member";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import { listMembers } from "@/services/members";
import { listProjects } from "@/services/projects";
import { listTasks } from "@/services/tasks";
import { fetchAllPages } from "@/utils/pagination";

export interface MembersPageData {
  tasks: Task[];
  projects: Project[];
  members: Member[];
}

export interface MemberFilters {
  keyword?: string;
  projectId?: string;
  role?: ProjectRole;
}

export interface MemberRow {
  key: string;
  projectId: string;
  projectName: string;
  member: Member;
  role: ProjectRole;
  addedAt: string;
  taskCount: number;
}

export async function loadMembersPageData(pageSize: number): Promise<MembersPageData> {
  const [taskResult, projectResult, members] = await Promise.all([
    fetchAllPages((page, pageSize) => listTasks({ page, pageSize }), pageSize),
    fetchAllPages((page, pageSize) => listProjects({ page, pageSize }), pageSize),
    listMembers(),
  ]);

  return {
    tasks: taskResult.items,
    projects: projectResult.items,
    members,
  };
}

export function buildMemberRows(
  projects: ReadonlyArray<Project>,
  members: ReadonlyArray<Member>,
  tasks: ReadonlyArray<Task>,
): MemberRow[] {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const taskCountsByMembership = new Map<string, number>();

  for (const task of tasks) {
    if (!task.assigneeId) continue;
    const key = `${task.projectId}:${task.assigneeId}`;
    taskCountsByMembership.set(key, (taskCountsByMembership.get(key) ?? 0) + 1);
  }

  const rows: MemberRow[] = [];
  for (const project of projects) {
    for (const projectMember of project.members) {
      const member = membersById.get(projectMember.memberId);
      if (!member) continue;

      const key = `${project.id}:${member.id}`;
      rows.push({
        key,
        projectId: project.id,
        projectName: project.name,
        member,
        role: projectMember.role,
        addedAt: projectMember.addedAt,
        taskCount: taskCountsByMembership.get(key) ?? 0,
      });
    }
  }
  return rows;
}

export function filterMemberRows(
  rows: ReadonlyArray<MemberRow>,
  filters: MemberFilters,
): MemberRow[] {
  const keyword = filters.keyword?.trim().toLowerCase();
  return rows.filter((row) => {
    const searchableText = [
      row.member.name,
      row.member.email,
      row.member.department,
      row.projectName,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!keyword || searchableText.includes(keyword)) &&
      (!filters.projectId || row.projectId === filters.projectId) &&
      (!filters.role || row.role === filters.role)
    );
  });
}
