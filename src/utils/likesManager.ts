// ============================================================================
// LIKES MANAGER UTILITY
// Mengelola status 'Like' dan jumlah like tiap proyek dengan persistensi
// ============================================================================

import { isSupabaseConfigured, getSupabase } from "../lib/supabase";

const STORAGE_KEY_LIKED_PROJECTS = "portfolio_user_liked_projects_v1";
const STORAGE_KEY_LIKES_MAP = "portfolio_project_likes_counts_v1";

// Seed hash function untuk memberikan base likes awal yang konsisten
function getDeterministicBaseLikes(slugOrId: string): number {
  let hash = 0;
  for (let i = 0; i < slugOrId.length; i++) {
    hash = (hash << 5) - hash + slugOrId.charCodeAt(i);
    hash |= 0;
  }
  // Menghasilkan angka like alami antara 18 s.d. 88
  return Math.abs(hash % 71) + 18;
}

export function getUserLikedSlugs(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIKED_PROJECTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isProjectLiked(slugOrId: string): boolean {
  if (!slugOrId) return false;
  const list = getUserLikedSlugs();
  return list.includes(slugOrId);
}

export function getProjectLikesMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIKES_MAP);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getProjectLikes(slugOrId: string, initialBase?: number): number {
  if (!slugOrId) return 0;
  const map = getProjectLikesMap();
  if (typeof map[slugOrId] === "number") {
    return map[slugOrId];
  }
  // Gunakan initialBase dari database jika ada, jika tidak gunakan seed alami
  const base = initialBase && initialBase > 0 ? initialBase : getDeterministicBaseLikes(slugOrId);
  map[slugOrId] = base;
  try {
    localStorage.setItem(STORAGE_KEY_LIKES_MAP, JSON.stringify(map));
  } catch {}
  return base;
}

export function toggleProjectLike(
  slugOrId: string,
  currentCount?: number
): { liked: boolean; count: number } {
  if (!slugOrId) return { liked: false, count: 0 };

  const likedList = getUserLikedSlugs();
  const currentlyLiked = likedList.includes(slugOrId);
  const nextLiked = !currentlyLiked;

  // 1. Update user liked list
  let nextLikedList: string[];
  if (nextLiked) {
    nextLikedList = [...likedList, slugOrId];
  } else {
    nextLikedList = likedList.filter((s) => s !== slugOrId);
  }
  try {
    localStorage.setItem(STORAGE_KEY_LIKED_PROJECTS, JSON.stringify(nextLikedList));
  } catch {}

  // 2. Update count
  const baseCount = currentCount !== undefined ? currentCount : getProjectLikes(slugOrId);
  const nextCount = Math.max(0, baseCount + (nextLiked ? 1 : -1));

  const map = getProjectLikesMap();
  map[slugOrId] = nextCount;
  try {
    localStorage.setItem(STORAGE_KEY_LIKES_MAP, JSON.stringify(map));
  } catch {}

  // 3. Dispatch window event agar semua komponen sinkron secara real-time
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("portfolio_like_changed", {
        detail: { slug: slugOrId, liked: nextLiked, count: nextCount },
      })
    );
  }

  // 4. Sinkronisasi ke Supabase di background jika kolom 'likes' tersedia
  if (isSupabaseConfigured()) {
    const client = getSupabase();
    if (client) {
      Promise.resolve(
        client
          .from("portfolio_projects")
          .update({ likes: nextCount })
          .eq("slug", slugOrId)
      )
        .then((res: any) => {
          if (res?.error) {
            console.debug("Supabase like update notice:", res.error.message);
          }
        })
        .catch(() => {});
    }
  }

  return { liked: nextLiked, count: nextCount };
}
