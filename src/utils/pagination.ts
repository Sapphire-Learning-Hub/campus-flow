import type { PaginatedResult } from "@/types/common";

export const DEFAULT_API_PAGE_SIZE = 20;

export async function fetchAllPages<T>(
  loadPage: (page: number, pageSize: number, signal?: AbortSignal) => Promise<PaginatedResult<T>>,
  pageSize = DEFAULT_API_PAGE_SIZE,
  signal?: AbortSignal,
): Promise<PaginatedResult<T>> {
  if (signal?.aborted) {
    const error = new Error("操作已终止");
    error.name = "AbortError";
    throw error;
  }

  const requestedPageSize = Math.max(1, Math.floor(pageSize));
  const firstPage = await loadPage(1, requestedPageSize, signal);
  const resolvedPageSize = Math.max(1, firstPage.pageSize || requestedPageSize);
  const totalPages = Math.ceil(firstPage.total / resolvedPageSize);

  if (totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      loadPage(index + 2, resolvedPageSize, signal),
    ),
  );

  return {
    ...firstPage,
    items: [firstPage, ...remainingPages]
      .flatMap((result) => result.items)
      .slice(0, firstPage.total),
  };
}
