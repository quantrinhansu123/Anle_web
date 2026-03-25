import { useState, useEffect } from 'react';

const STORAGE_KEY = 'anle_bookmarks';

export const useBookmarks = () => {
  const [bookmarkedPaths, setBookmarkedPaths] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBookmarkedPaths(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse bookmarks from storage', e);
      }
    }
  }, []);

  const saveBookmarks = (paths: string[]) => {
    setBookmarkedPaths(paths);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
    
    // Dispatch a custom event to sync across components
    window.dispatchEvent(new Event('bookmarksUpdated'));
  };

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBookmarkedPaths(JSON.parse(stored));
      }
    };

    window.addEventListener('bookmarksUpdated', handleUpdate);
    return () => window.removeEventListener('bookmarksUpdated', handleUpdate);
  }, []);

  const isBookmarked = (path: string) => bookmarkedPaths.includes(path);

  const toggleBookmark = (path: string) => {
    if (isBookmarked(path)) {
      saveBookmarks(bookmarkedPaths.filter((p) => p !== path));
    } else {
      saveBookmarks([...bookmarkedPaths, path]);
    }
  };

  return { isBookmarked, toggleBookmark, bookmarkedPaths };
};
