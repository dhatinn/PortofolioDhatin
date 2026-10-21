import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  ProfileData,
  ProjectData,
  ExperienceData,
  SkillCategoryData,
} from "../types/portfolio";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_URL.includes("supabase.co") &&
    typeof SUPABASE_ANON_KEY === "string" &&
    SUPABASE_ANON_KEY.length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

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
  if (!supabase) return null;

  try {
    const [profileRes, projectsRes, expRes, skillsRes] = await Promise.all([
      supabase.from("portfolio_profile").select("*").limit(1).maybeSingle(),
      supabase.from("portfolio_projects").select("*").order("display_order", { ascending: true }),
      supabase.from("portfolio_experiences").select("*").order("display_order", { ascending: true }),
      supabase.from("portfolio_skills").select("*").order("display_order", { ascending: true }),
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
        photo: profileRes.data.photo || "/images/mypicnbg.png",
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
        category: s.category,
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
  if (!supabase) return false;

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
      photo: profile.photo,
      cv: profile.cv,
      available: profile.available,
      about: profile.about,
      education: profile.education,
      badge: profile.badge,
      services: profile.services,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
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
  if (!supabase) return false;

  try {
    // Upsert project items
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      await supabase.from("portfolio_projects").upsert(
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
 * Mengunggah file gambar ke Supabase Storage (bucket: portfolio-media)
 */
export async function uploadImageToSupabaseStorage(
  file: File,
  folder = "photos"
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("portfolio-media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Upload ke Supabase storage gagal:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
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
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("portfolio_contacts").insert([contact]);
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
