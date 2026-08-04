import { describe, expect, it } from "vitest";
import { fetchAllPages } from "@/utils/pagination";

describe("分页加载", () => {
  it("使用服务端页大小加载全部页面并保持项目顺序", async () => {
    const calls: Array<[number, number]> = [];

    const result = await fetchAllPages(async (page, pageSize) => {
      calls.push([page, pageSize]);
      const pages = new Map([
        [1, ["task-1", "task-2"]],
        [2, ["task-3", "task-4"]],
        [3, ["task-5"]],
      ]);
      return {
        items: pages.get(page) ?? [],
        total: 5,
        page,
        pageSize: 2,
      };
    }, 2.9);

    expect(calls).toEqual([
      [1, 2],
      [2, 2],
      [3, 2],
    ]);
    expect(result.items).toEqual(["task-1", "task-2", "task-3", "task-4", "task-5"]);
    expect(result.total).toBe(5);
  });

  it("第一页包含完整结果时不请求额外页面", async () => {
    let calls = 0;
    const result = await fetchAllPages(async (page, pageSize) => {
      calls += 1;
      return {
        items: ["only-item"],
        total: 1,
        page,
        pageSize,
      };
    });

    expect(calls).toBe(1);
    expect(result.items).toEqual(["only-item"]);
  });
});
