import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  ProfileData,
  ProjectData,
  ExperienceData,
  SkillCategoryData,
} from "../types/portfolio";

export const SUPABASE_CONFIG_KEY = "portfolio_supabase_config_v2";

export interface SupabaseConfigCredentials {
  url: string;
  anonKey: string;
  source: "env" | "custom" | "none";
}

/**
 * Membaca kredensial Supabase dari localStorage atau fallback ke .env
 */
export function getStoredSupabaseConfig(): SupabaseConfigCredentials {
  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url.trim(),
          anonKey: parsed.anonKey.trim(),
          source: "custom",
        };
      }
    }
  } catch (err) {
    console.warn("Failed to read Supabase config from storage:", err);
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

  if (envUrl && envKey && !envUrl.includes("your-project-id")) {
    return {
      url: envUrl,
      anonKey: envKey,
      source: "env",
    };
  }

  return {
    url: "",
    anonKey: "",
    source: "none",
  };
}

let activeClient: SupabaseClient | null = null;

function validateConfig(url: string, key: string): boolean {
  return (
    typeof url === "string" &&
    url.startsWith("https://") &&
    url.includes("supabase.co") &&
    typeof key === "string" &&
    key.length > 20
  );
}

export function isSupabaseConfigured(): boolean {
  const cfg = getStoredSupabaseConfig();
  return validateConfig(cfg.url, cfg.anonKey);
}

export function initSupabaseClient(custom?: { url: string; anonKey: string }): SupabaseClient | null {
  const cfg = custom || getStoredSupabaseConfig();
  if (validateConfig(cfg.url, cfg.anonKey)) {
    try {
      activeClient = createClient(cfg.url, cfg.anonKey);
      return activeClient;
    } catch (e) {
      console.error("Failed to initialize Supabase client:", e);
      activeClient = null;
      return null;
    }
  }
  activeClient = null;
  return null;
}

// Initial client initialization
initSupabaseClient();

export function getSupabase(): SupabaseClient | null {
  if (!activeClient) {
    initSupabaseClient();
  }
  return activeClient;
}

/**
 * Proxy object export agar pemanggilan `supabase.from(...)` selalu merujuk ke activeClient
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) return undefined;
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Menyimpan konfigurasi Supabase kustom ke localStorage
 */
export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    const trimmedUrl = url.trim();
    const trimmedKey = anonKey.trim();
    localStorage.setItem(
      SUPABASE_CONFIG_KEY,
      JSON.stringify({ url: trimmedUrl, anonKey: trimmedKey })
    );
    const client = initSupabaseClient({ url: trimmedUrl, anonKey: trimmedKey });
    return client !== null;
  } catch (err) {
    console.error("Gagal menyimpan konfigurasi Supabase:", err);
    return false;
  }
}

/**
 * Menghapus konfigurasi Supabase kustom
 */
export function clearSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
  initSupabaseClient();
}

/**
 * Menguji koneksi live ke Supabase
 */
export async function testSupabaseConnection(custom?: { url: string; anonKey: string }): Promise<{
  success: boolean;
  message: string;
}> {
  const client = custom ? initSupabaseClient(custom) : getSupabase();
  if (!client) {
    return {
      success: false,
      message: "Format URL atau Anon Key Supabase belum valid. Pastikan format https://[project-id].supabase.co dan key anon JWT.",
    };
  }

  try {
    const { error } = await client
      .from("portfolio_profile")
      .select("id")
      .limit(1);

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return {
          success: true,
          message: "Koneksi ke Supabase berhasil! (Catatan: Tabel database belum dibuat. Silakan jalankan script supabase_schema.sql di SQL Editor Supabase).",
        };
      }
      return {
        success: false,
        message: `Koneksi ditolak: ${error.message} (${error.code || "auth/permission error"})`,
      };
    }

    return {
      success: true,
      message: "Koneksi berhasil dan terhubung sempurna ke database Supabase!",
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi server Supabase: ${err.message || String(err)}`,
    };
  }
}

// ============================================================================
// DATA FETCHING & SYNC HELPERS
// ============================================================================

/**
 * Mengambil seluruh data portofolio dari tabel Supabase
 */
export async function fetchPortfolioFromSupabase(): Promise<{
  profile?: ProfileData;
  projects?: ProjectData[];
  experience?: ExperienceData[];
  skills?: SkillCategoryData[];
} | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const [profileRes, projectsRes, expRes, skillsRes] = await Promise.all([
      client.from("portfolio_profile").select("*").limit(1).maybeSingle(),
      client.from("portfolio_projects").select("*").order("display_order", { ascending: true }),
      client.from("portfolio_experiences").select("*").order("display_order", { ascending: true }),
      client.from("portfolio_skills").select("*").order("display_order", { ascending: true }),
    ]);

    const result: {
      profile?: ProfileData;
      projects?: ProjectData[];
      experience?: ExperienceData[];
      skills?: SkillCategoryData[];
    } = {};

    if (profileRes.data) {
      result.profile = {
        name: profileRes.data.name,
        taglines: profileRes.data.taglines || [],
        title: profileRes.data.title || { en: "", id: "" },
        location: profileRes.data.location || "",
        phone: profileRes.data.phone || "",
        whatsapp: profileRes.data.whatsapp || "",
        email: profileRes.data.email || "",
        github: profileRes.data.github || "",
        linkedin: profileRes.data.linkedin || "",
        photo: profileRes.data.photo || "/images/lanyard_photo.jpg",
        cv: profileRes.data.cv || "/cv.pdf",
        available: profileRes.data.available || { en: "", id: "" },
        about: profileRes.data.about || { en: "", id: "" },
        highlights: profileRes.data.highlights || [],
        education: profileRes.data.education || { school: "", degree: "", period: "", semester: 6 },
        languages: profileRes.data.languages || [],
        services: profileRes.data.services || [],
        badge: profileRes.data.badge || {},
      };
    }

    if (projectsRes.data && projectsRes.data.length > 0) {
      result.projects = projectsRes.data.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        year: p.year,
        category: p.category,
        description: p.description,
        stack: p.stack || [],
        thumbnail: p.thumbnail,
        demo: p.demo,
        repo: p.repo,
      }));
    }

    if (expRes.data && expRes.data.length > 0) {
      result.experience = expRes.data.map((e: any) => ({
        role: e.role,
        company: e.company,
        location: e.location,
        period: e.period,
        highlights: e.highlights || [],
        tags: e.tags || [],
      }));
    }

    if (skillsRes.data && skillsRes.data.length > 0) {
      result.skills = skillsRes.data.map((s: any) => ({
        category: s.category || { en: "", id: "" },
        items: s.items || [],
      }));
    }

    return result;
  } catch (err) {
    console.warn("Error fetching data from Supabase:", err);
    return null;
  }
}

/**
 * Menyimpan / Upsert data profil ke Supabase
 */
export async function syncProfileToSupabase(profile: ProfileData): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: "00000000-0000-0000-0000-000000000001",
      name: profile.name,
      taglines: profile.taglines,
      title: profile.title,
      location: profile.location,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      email: profile.email,
      github: profile.github,
      linkedin: profile.linkedin,
      photo: profile.photo || "/images/lanyard_photo.jpg",
      cv: profile.cv,
      available: profile.available,
      about: profile.about,
      education: profile.education,
      badge: profile.badge,
      services: profile.services,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from("portfolio_profile")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.error("Gagal sync profil ke Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase sync error:", err);
    return false;
  }
}

/**
 * Menyimpan seluruh proyek ke Supabase
 */
export async function syncProjectsToSupabase(projects: ProjectData[]): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      await client.from("portfolio_projects").upsert(
        {
          slug: p.slug,
          title: p.title,
          year: p.year,
          category: p.category,
          description: p.description,
          stack: p.stack,
          thumbnail: p.thumbnail,
          demo: p.demo,
          repo: p.repo,
          display_order: i + 1,
        },
        { onConflict: "slug" }
      );
    }
    return true;
  } catch (err) {
    console.error("Supabase projects sync error:", err);
    return false;
  }
}

/**
 * Menghapus proyek dari Supabase berdasarkan slug
 */
export async function deleteProjectFromSupabase(slug: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from("portfolio_projects").delete().eq("slug", slug);
    if (error) {
      console.error("Gagal menghapus proyek dari Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase delete project error:", err);
    return false;
  }
}

/**
 * Menyimpan riwayat pengalaman kerja ke Supabase
 */
export async function syncExperiencesToSupabase(experience: ExperienceData[]): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    for (let i = 0; i < experience.length; i++) {
      const exp = experience[i];
      await client.from("portfolio_experiences").upsert(
        {
          id: i + 1,
          role: exp.role,
          company: exp.company,
          location: exp.location,
          period: exp.period,
          highlights: exp.highlights,
          tags: exp.tags,
          display_order: i + 1,
        },
        { onConflict: "id" }
      );
    }
    return true;
  } catch (err) {
    console.error("Supabase experiences sync error:", err);
    return false;
  }
}

/**
 * Menyimpan kategori skill & tools ke Supabase
 */
export async function syncSkillsToSupabase(skills: SkillCategoryData[]): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    for (let i = 0; i < skills.length; i++) {
      const s = skills[i];
      await client.from("portfolio_skills").upsert(
        {
          id: i + 1,
          category: s.category,
          items: s.items,
          display_order: i + 1,
        },
        { onConflict: "id" }
      );
    }
    return true;
  } catch (err) {
    console.error("Supabase skills sync error:", err);
    return false;
  }
}

/**
 * Sinkronisasi menyeluruh (Profil, Proyek, Pengalaman, Skill)
 */
export async function syncAllToSupabase(
  profile: ProfileData,
  projects: ProjectData[],
  experience: ExperienceData[],
  skills: SkillCategoryData[]
): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: "Supabase belum terkonfigurasi. Silakan masukkan Project URL & Anon Key terlebih dahulu.",
    };
  }

  try {
    const [pOk, prjOk, expOk, sklOk] = await Promise.all([
      syncProfileToSupabase(profile),
      syncProjectsToSupabase(projects),
      syncExperiencesToSupabase(experience),
      syncSkillsToSupabase(skills),
    ]);

    if (pOk && prjOk && expOk && sklOk) {
      return {
        success: true,
        message: "Seluruh data portofolio (Profil, Proyek, Pengalaman, Skill) berhasil disinkronkan ke Supabase!",
      };
    }

    return {
      success: true,
      message: "Sinkronisasi selesai sebagian (beberapa tabel mungkin belum dibuat di Supabase).",
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal sinkronisasi: ${err.message || String(err)}`,
    };
  }
}

/**
 * Mengunggah file gambar ke Supabase Storage (bucket: portfolio-media)
 */
export async function uploadImageToSupabaseStorage(
  file: File,
  folder = "photos"
): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { data, error } = await client.storage
      .from("portfolio-media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Upload ke Supabase storage gagal:", error);
      return null;
    }

    const { data: publicUrlData } = client.storage
      .from("portfolio-media")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Supabase upload error:", err);
    return null;
  }
}

/**
 * Mengirim pesan kontak ke Supabase
 */
export async function submitContactMessage(contact: {
  name: string;
  email: string;
  message: string;
}): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from("portfolio_contacts").insert([contact]);
    if (error) {
      console.error("Gagal kirim pesan:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Gagal kirim pesan:", err);
    return false;
  }
}
