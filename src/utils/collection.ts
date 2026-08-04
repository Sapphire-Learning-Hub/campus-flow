export function indexById<Item extends { id: PropertyKey }>(
  items: readonly Item[],
): Map<Item["id"], Item> {
  return new Map(items.map((item) => [item.id, item]));
}

export function countActiveFilters(filters: object): number {
  return Object.values(filters).filter(
    (value) => value !== undefined && value !== null && value !== "" && value !== false,
  ).length;
}
