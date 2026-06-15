// hooks/useBookmarks.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type BookmarkItem = {
  type: "book" | "quiz";
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  data: any;
  savedAt: number;
};

const KEY = "@bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) setBookmarks(JSON.parse(raw));
      else setBookmarks([]);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, []);

  const persist = async (items: BookmarkItem[]) => {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(items));
      setBookmarks(items);
    } catch {}
  };

  const isBookmarked = useCallback(
    (type: "book" | "quiz", id: string | number) =>
      bookmarks.some((b) => b.type === type && b.id === String(id)),
    [bookmarks],
  );

  const addBookmark = useCallback(
    async (item: BookmarkItem) => {
      const next = [
        item,
        ...bookmarks.filter(
          (b) => !(b.type === item.type && b.id === item.id),
        ),
      ];
      await persist(next);
    },
    [bookmarks],
  );

  const removeBookmark = useCallback(
    async (type: "book" | "quiz", id: string | number) => {
      const next = bookmarks.filter(
        (b) => !(b.type === type && b.id === String(id)),
      );
      await persist(next);
    },
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    async (item: BookmarkItem) => {
      if (isBookmarked(item.type, item.id)) {
        await removeBookmark(item.type, item.id);
      } else {
        await addBookmark(item);
      }
    },
    [isBookmarked, addBookmark, removeBookmark],
  );

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark, reload: load };
}
