import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import type { RuleObject } from "antd/es/form";
import {
  getLoginValidationRules,
  getMemberValidationRules,
  getProfileValidationRules,
  getProjectValidationRules,
  getRegisterValidationRules,
  getSecurityValidationRules,
  getTaskValidationRules,
  getTaskDeadlineValidationRule,
} from "@/utils/formRules";

const translate = (key: string) => key;

type MinimalForm = {
  getFieldValue: (name: string) => unknown;
};

function invokeValidator(
  validator: NonNullable<RuleObject["validator"]>,
  value: unknown,
) {
  return Reflect.apply(validator, undefined, [{} as RuleObject, value]);
}

function ruleObject(rule: RuleObject | ((...args: never[]) => RuleObject)) {
  if (typeof rule === "function") {
    throw new Error("应为具体规则对象");
  }
  return rule;
}

describe("表单校验规则", () => {
  it("保留注册表单的必填、长度、格式和邮箱约束", () => {
    const rules = getRegisterValidationRules(translate);
    const nameRule = ruleObject(rules.name[1] as RuleObject);
    const usernameLengthRule = ruleObject(rules.username[1] as RuleObject);
    const usernamePatternRule = ruleObject(rules.username[2] as RuleObject);
    const emailRule = ruleObject(rules.email[1] as RuleObject);
    const passwordRule = ruleObject(rules.password[1] as RuleObject);

    expect(ruleObject(rules.name[0] as RuleObject).required).toBe(true);
    expect(nameRule.min).toBe(2);
    expect(nameRule.max).toBe(20);
    expect(usernameLengthRule.min).toBe(3);
    expect(usernameLengthRule.max).toBe(20);
    expect(usernamePatternRule.pattern?.test("student_1")).toBe(true);
    expect(usernamePatternRule.pattern?.test("student-name")).toBe(false);
    expect(emailRule.type).toBe("email");
    expect(passwordRule.min).toBe(8);
    expect(passwordRule.max).toBe(72);
  });

  it("拒绝不匹配的确认密码和未勾选的协议", async () => {
    const rules = getRegisterValidationRules(translate);
    const confirmRule = rules.confirmPassword[1];
    if (typeof confirmRule !== "function") {
      throw new Error("确认密码规则应为动态规则");
    }
    const confirmValidator = (
      confirmRule as unknown as (form: MinimalForm) => RuleObject
    )({
      getFieldValue: () => "正确密码",
    }).validator;
    if (!confirmValidator) throw new Error("缺少确认密码校验器");

    await expect(invokeValidator(confirmValidator, "错误密码")).rejects.toThrow(
      "auth.validation.passwordMismatch",
    );
    await expect(
      invokeValidator(confirmValidator, "正确密码"),
    ).resolves.toBeUndefined();

    const agreementValidator = ruleObject(
      rules.agreement[0] as RuleObject,
    ).validator;
    if (!agreementValidator) throw new Error("缺少协议校验器");
    await expect(invokeValidator(agreementValidator, false)).rejects.toThrow(
      "auth.validation.agreementRequired",
    );
  });

  it("拒绝早于开始日期的任务截止日期", async () => {
    const rule = getTaskDeadlineValidationRule(translate);
    if (typeof rule !== "function") throw new Error("应为动态规则");
    const validator = (rule as unknown as (form: MinimalForm) => RuleObject)({
      getFieldValue: () => dayjs("2026-08-10"),
    }).validator;
    if (!validator) throw new Error("缺少截止日期校验器");

    await expect(
      invokeValidator(validator, dayjs("2026-08-09")),
    ).rejects.toThrow("taskForm.validation.deadlineOrder");
    await expect(
      invokeValidator(validator, dayjs("2026-08-10")),
    ).resolves.toBeUndefined();
  });

  it("为登录、项目、成员、任务、个人资料和安全表单提供规则", () => {
    const loginRules = getLoginValidationRules(translate);
    const projectRules = getProjectValidationRules(translate);
    const memberRules = getMemberValidationRules(translate);
    const taskRules = getTaskValidationRules(translate);
    const profileRules = getProfileValidationRules(translate);
    const securityRules = getSecurityValidationRules(translate);

    expect(Object.keys(loginRules)).toEqual(["username", "password"]);
    expect(ruleObject(loginRules.password[1] as RuleObject).min).toBe(6);

    expect(Object.keys(projectRules)).toEqual([
      "name",
      "description",
      "status",
      "deadline",
      "color",
    ]);
    expect(ruleObject(projectRules.name[1] as RuleObject).max).toBe(50);
    expect(ruleObject(projectRules.description[1] as RuleObject).max).toBe(300);

    expect(Object.keys(memberRules)).toEqual(["memberId", "role"]);
    expect(ruleObject(memberRules.memberId[0] as RuleObject).required).toBe(
      true,
    );

    expect(Object.keys(taskRules)).toEqual([
      "projectId",
      "title",
      "description",
      "workItemType",
      "stage",
      "status",
      "priority",
      "deadline",
    ]);
    expect(ruleObject(taskRules.title[1] as RuleObject).max).toBe(80);
    expect(typeof taskRules.deadline[0]).toBe("function");

    expect(Object.keys(profileRules)).toEqual([
      "username",
      "department",
      "email",
    ]);
    expect(
      ruleObject(profileRules.username[1] as RuleObject).pattern?.test(
        "valid_name",
      ),
    ).toBe(true);
    expect(
      ruleObject(profileRules.username[1] as RuleObject).pattern?.test(
        "invalid-name",
      ),
    ).toBe(false);

    expect(Object.keys(securityRules)).toEqual([
      "currentPassword",
      "newPassword",
      "confirmPassword",
    ]);
    expect(ruleObject(securityRules.newPassword[1] as RuleObject).min).toBe(6);
  });

  it("拒绝安全表单复用旧密码和不匹配的确认密码", async () => {
    const rules = getSecurityValidationRules(translate);
    const samePasswordRule = rules.newPassword[2];
    const confirmPasswordRule = rules.confirmPassword[1];
    if (
      typeof samePasswordRule !== "function" ||
      typeof confirmPasswordRule !== "function"
    ) {
      throw new Error("应为动态安全规则");
    }

    const form = {
      getFieldValue: (name: string) =>
        name === "currentPassword" ? "当前密码" : "新密码",
    };
    const samePasswordValidator = (
      samePasswordRule as unknown as (form: MinimalForm) => RuleObject
    )(form).validator;
    const confirmPasswordValidator = (
      confirmPasswordRule as unknown as (form: MinimalForm) => RuleObject
    )(form).validator;
    if (!samePasswordValidator || !confirmPasswordValidator) {
      throw new Error("缺少安全校验器");
    }

    await expect(
      invokeValidator(samePasswordValidator, "当前密码"),
    ).rejects.toThrow("settings.security.validation.samePassword");
    await expect(
      invokeValidator(confirmPasswordValidator, "错误确认"),
    ).rejects.toThrow("settings.security.validation.mismatch");
    await expect(
      invokeValidator(confirmPasswordValidator, "新密码"),
    ).resolves.toBeUndefined();
  });
});
