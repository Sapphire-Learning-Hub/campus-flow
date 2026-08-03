import type { Rule } from "antd/es/form";
import type { Dayjs } from "dayjs";

export type Translate = (key: string) => string;

export interface LoginValidationRules {
  username: Rule[];
  password: Rule[];
}

export interface RegisterValidationRules {
  name: Rule[];
  username: Rule[];
  email: Rule[];
  department: Rule[];
  password: Rule[];
  confirmPassword: Rule[];
  agreement: Rule[];
}

export interface ProjectValidationRules {
  name: Rule[];
  description: Rule[];
  status: Rule[];
  deadline: Rule[];
  color: Rule[];
}

export interface MemberValidationRules {
  memberId: Rule[];
  role: Rule[];
}

export interface TaskValidationRules {
  projectId: Rule[];
  title: Rule[];
  description: Rule[];
  workItemType: Rule[];
  stage: Rule[];
  status: Rule[];
  priority: Rule[];
  deadline: Rule[];
}

export interface ProfileValidationRules {
  username: Rule[];
  department: Rule[];
  email: Rule[];
}

export interface SecurityValidationRules {
  currentPassword: Rule[];
  newPassword: Rule[];
  confirmPassword: Rule[];
}

export function getLoginValidationRules(t: Translate): LoginValidationRules {
  return {
    username: [
      { required: true, message: t("auth.validation.usernameRequired") },
    ],
    password: [
      { required: true, message: t("auth.validation.passwordRequired") },
      { min: 6, message: t("auth.validation.passwordMin") },
    ],
  };
}

export function getRegisterValidationRules(
  t: Translate,
): RegisterValidationRules {
  return {
    name: [
      { required: true, message: t("auth.validation.nameRequired") },
      { min: 2, max: 20, message: t("auth.validation.nameLength") },
    ],
    username: [
      { required: true, message: t("auth.validation.usernameRequired") },
      {
        min: 3,
        max: 20,
        message: t("auth.validation.usernameLength"),
      },
      {
        pattern: /^[A-Za-z0-9_]+$/,
        message: t("auth.validation.usernamePattern"),
      },
    ],
    email: [
      { required: true, message: t("auth.validation.emailRequired") },
      { type: "email", message: t("auth.validation.emailInvalid") },
    ],
    department: [
      {
        required: true,
        message: t("auth.validation.departmentRequired"),
      },
      {
        max: 40,
        message: t("auth.validation.departmentLength"),
      },
    ],
    password: [
      { required: true, message: t("auth.validation.passwordRequired") },
      {
        min: 8,
        max: 72,
        message: t("auth.validation.passwordLength"),
      },
    ],
    confirmPassword: [
      {
        required: true,
        message: t("auth.validation.confirmPasswordRequired"),
      },
      ({ getFieldValue }) => ({
        validator(_, value?: string) {
          return !value || getFieldValue("password") === value
            ? Promise.resolve()
            : Promise.reject(new Error(t("auth.validation.passwordMismatch")));
        },
      }),
    ],
    agreement: [
      {
        validator(_, checked?: boolean) {
          return checked
            ? Promise.resolve()
            : Promise.reject(new Error(t("auth.validation.agreementRequired")));
        },
      },
    ],
  };
}

export function getProjectValidationRules(
  t: Translate,
): ProjectValidationRules {
  return {
    name: [
      {
        required: true,
        message: t("projectForm.validation.nameRequired"),
      },
      {
        min: 2,
        max: 50,
        message: t("projectForm.validation.nameLength"),
      },
    ],
    description: [
      {
        required: true,
        message: t("projectForm.validation.descriptionRequired"),
      },
      {
        max: 300,
        message: t("projectForm.validation.descriptionLength"),
      },
    ],
    status: [
      {
        required: true,
        message: t("projectForm.validation.statusRequired"),
      },
    ],
    deadline: [
      {
        required: true,
        message: t("projectForm.validation.deadlineRequired"),
      },
    ],
    color: [
      {
        required: true,
        message: t("projectForm.validation.colorRequired"),
      },
    ],
  };
}

export function getMemberValidationRules(t: Translate): MemberValidationRules {
  return {
    memberId: [
      {
        required: true,
        message: t("memberForm.validation.memberRequired"),
      },
    ],
    role: [
      {
        required: true,
        message: t("memberForm.validation.roleRequired"),
      },
    ],
  };
}

export function getTaskValidationRules(t: Translate): TaskValidationRules {
  return {
    projectId: [
      {
        required: true,
        message: t("taskForm.validation.projectRequired"),
      },
    ],
    title: [
      {
        required: true,
        message: t("taskForm.validation.titleRequired"),
      },
      {
        min: 2,
        max: 80,
        message: t("taskForm.validation.titleLength"),
      },
    ],
    description: [
      {
        required: true,
        message: t("taskForm.validation.descriptionRequired"),
      },
      {
        max: 500,
        message: t("taskForm.validation.descriptionLength"),
      },
    ],
    workItemType: [
      {
        required: true,
        message: t("taskForm.validation.typeRequired"),
      },
    ],
    stage: [
      {
        required: true,
        message: t("taskForm.validation.stageRequired"),
      },
    ],
    status: [
      {
        required: true,
        message: t("taskForm.validation.statusRequired"),
      },
    ],
    priority: [
      {
        required: true,
        message: t("taskForm.validation.priorityRequired"),
      },
    ],
    deadline: [getTaskDeadlineValidationRule(t)],
  };
}

export function getProfileValidationRules(
  t: Translate,
): ProfileValidationRules {
  return {
    username: [
      {
        required: true,
        message: t("settings.profile.validation.usernameRequired"),
      },
      {
        pattern: /^[a-zA-Z0-9_]{3,20}$/,
        message: t("settings.profile.validation.usernamePattern"),
      },
    ],
    department: [
      {
        required: true,
        message: t("settings.profile.validation.departmentRequired"),
      },
      {
        max: 30,
        message: t("settings.profile.validation.departmentLength"),
      },
    ],
    email: [
      {
        required: true,
        message: t("settings.profile.validation.emailRequired"),
      },
      {
        type: "email",
        message: t("settings.profile.validation.emailInvalid"),
      },
    ],
  };
}

export function getSecurityValidationRules(
  t: Translate,
): SecurityValidationRules {
  return {
    currentPassword: [
      {
        required: true,
        message: t("settings.security.validation.currentRequired"),
      },
    ],
    newPassword: [
      {
        required: true,
        message: t("settings.security.validation.newRequired"),
      },
      {
        min: 6,
        max: 32,
        message: t("settings.security.validation.newLength"),
      },
      ({ getFieldValue }) => ({
        validator(_, value?: string) {
          if (!value || value !== getFieldValue("currentPassword")) {
            return Promise.resolve();
          }
          return Promise.reject(
            new Error(t("settings.security.validation.samePassword")),
          );
        },
      }),
    ],
    confirmPassword: [
      {
        required: true,
        message: t("settings.security.validation.confirmRequired"),
      },
      ({ getFieldValue }) => ({
        validator(_, value?: string) {
          if (!value || value === getFieldValue("newPassword")) {
            return Promise.resolve();
          }
          return Promise.reject(
            new Error(t("settings.security.validation.mismatch")),
          );
        },
      }),
    ],
  };
}

export function getTaskDeadlineValidationRule(t: Translate): Rule {
  return ({ getFieldValue }) => ({
    validator(_, value?: Dayjs) {
      const start = getFieldValue("startDate") as Dayjs | undefined;
      if (!start || !value || !value.isBefore(start, "day")) {
        return Promise.resolve();
      }
      return Promise.reject(new Error(t("taskForm.validation.deadlineOrder")));
    },
  });
}
