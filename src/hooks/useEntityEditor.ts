import { useCallback, useState } from "react";

export function useEntityEditor<T>() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T>();

  const openCreate = useCallback(() => {
    setEditingItem(undefined);
    setOpen(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setEditingItem(item);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setEditingItem(undefined);
  }, []);

  return {
    open,
    editingItem,
    openCreate,
    openEdit,
    close,
  };
}
