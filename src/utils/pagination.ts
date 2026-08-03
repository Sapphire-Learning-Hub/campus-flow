import type { PaginatedResult } from "@/types/common";

export const DEFAULT_API_PAGE_SIZE = 20;

export async function fetchAllPages<T>(
  loadPage: (page: number, pageSize: number) => Promise<PaginatedResult<T>>,
  pageSize = DEFAULT_API_PAGE_SIZE,
): Promise<PaginatedResult<T>> {
  const requestedPageSize = Math.max(1, Math.floor(pageSize));
  const firstPage = await loadPage(1, requestedPageSize);
  const resolvedPageSize = Math.max(1, firstPage.pageSize || requestedPageSize);
  const totalPages = Math.ceil(firstPage.total / resolvedPageSize);

  if (totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      loadPage(index + 2, resolvedPageSize),
    ),
  );

  return {
    ...firstPage,
    items: [firstPage, ...remainingPages]
      .flatMap((result) => result.items)
      .slice(0, firstPage.total),
  };
}
