import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { profile as defaultProfile } from "../data/profile";
import { experience as defaultExperience } from "../data/experience";
import { projects as defaultProjects } from "../data/projects";
import { skills as defaultSkills } from "../data/skills";
import {
  ProfileData,
  ProjectData,
  ExperienceData,
  SkillCategoryData,
  PortfolioConfig,
} from "../types/portfolio";
import { buildConfig } from "../config";
import {
  isSupabaseConfigured,
  fetchPortfolioFromSupabase,
  syncProfileToSupabase,
  syncProjectsToSupabase,
  deleteProjectFromSupabase,
  syncExperiencesToSupabase,
  syncSkillsToSupabase,
  syncAllToSupabase,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  isPortfolioAdmin,
  onSupabaseAuthStateChange,
  signInAdmin,
  signOutAdmin,
  updateAdminPassword,
  SupabaseConfigCredentials,
} from "../lib/supabase";


interface PortfolioContextType {
  profile: ProfileData;
  projects: ProjectData[];
  experience: ExperienceData[];
  skills: SkillCategoryData[];
  config: PortfolioConfig;

  // Supabase Status, Config & Sync
  isSupabaseConnected: boolean;
  supabaseConfig: SupabaseConfigCredentials;
  saveSupabaseSettings: (url: string, key: string) => boolean;
  clearSupabaseSettings: () => void;
  testSupabase: (url?: string, key?: string) => Promise<{ success: boolean; message: string }>;
  syncWithSupabase: () => Promise<boolean>;

  // Profile CRUD
  updateProfile: (data: Partial<ProfileData>) => void;

  // Projects CRUD
  addProject: (project: ProjectData) => Promise<boolean>;
  updateProject: (index: number, project: ProjectData) => Promise<boolean>;
  deleteProject: (index: number) => void;
  reorderProjects: (startIndex: number, endIndex: number) => void;

  // Experience CRUD
  addExperience: (exp: ExperienceData) => void;
  updateExperience: (index: number, exp: ExperienceData) => void;
  deleteExperience: (index: number) => void;

  // Skills CRUD
  addSkill: (categoryIndex: number, item: string) => void;
  removeSkill: (categoryIndex: number, itemIndex: number) => void;
  addSkillCategory: (categoryEn: string, categoryId: string) => void;
  removeSkillCategory: (categoryIndex: number) => void;

  // Backup & Reset
  resetToDefaults: () => void;
  exportJSON: () => string;
  importJSON: (jsonStr: string) => boolean;

  // Auth
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (pass: string) => Promise<void>;

  // Modal / UI controls
  isLoginOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isAdminOpen: boolean;
  openAdminDrawer: () => void;
  closeAdminDrawer: () => void;

  // Theme & Language
  theme: "dark" | "light";
  toggleTheme: () => void;
  setTheme: (t: "dark" | "light") => void;
  language: "id" | "en";
  toggleLanguage: () => void;
  setLanguage: (l: "id" | "en") => void;
}

const STORAGE_KEYS = {
  PROFILE: "portfolio_profile_v2",
  PROJECTS: "portfolio_projects_v2",
  EXPERIENCE: "portfolio_experience_v2",
  SKILLS: "portfolio_skills_v2",
  THEME: "portfolio_theme_v1",
  LANGUAGE: "portfolio_language_v1",
};

// ---------------------------------------------------------------------------
// Login brute-force protection (in-memory, resets on page reload)
// ---------------------------------------------------------------------------
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes
let loginAttemptCount = 0;
let loginLockoutUntil = 0;

const PortfolioContext = createContext<PortfolioContextType | null>(null);

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn(`Failed to parse localStorage key "${key}":`, err);
  }
  return defaultValue;
}

// ---------------------------------------------------------------------------
// Safe localStorage writers (never throw, so the app can't crash on quota)
// ---------------------------------------------------------------------------
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`Gagal menyimpan "${key}" ke localStorage:`, err);
    return false;
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// Replaces very large inline data URIs (e.g. base64 images) with an empty string.
function stripLargeDataUris(_key: string, value: unknown): unknown {
  if (
    typeof value === "string" &&
    value.startsWith("data:") &&
    value.length > 1000
  ) {
    return "";
  }
  return value;
}

function persistJSON(key: string, data: unknown): void {
  let json: string;
  try {
    json = JSON.stringify(data);
  } catch (err) {
    console.warn(`Gagal serialisasi "${key}":`, err);
    return;
  }
  safeSetItem(key, json);
}

function persistProjects(projects: ProjectData[]): void {
  // 1) Try saving everything as-is.
  if (safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))) return;

  // 2) Too big: retry without large base64 images.
  const slim = JSON.stringify(projects, stripLargeDataUris);
  if (safeSetItem(STORAGE_KEYS.PROJECTS, slim)) return;

  // 3) Still failing: drop the cached copy so we don't keep stale data.
  safeRemoveItem(STORAGE_KEYS.PROJECTS);
}

function loadProfileFromStorage(): ProfileData {
  const loaded = loadFromStorage(STORAGE_KEYS.PROFILE, defaultProfile as ProfileData);
  return {
    ...defaultProfile,
    ...loaded,
    photo: loaded.photo || defaultProfile.photo || "/images/lanyard_photo.jpg",
    phone: loaded.phone && loaded.phone.includes("851-4215-6672") ? "" : (loaded.phone || ""),
    whatsapp:
      loaded.whatsapp &&
        (loaded.whatsapp.includes("85142156672") || loaded.whatsapp.includes("851-4215-6672"))
        ? ""
        : (loaded.whatsapp || ""),
    about: {
      en: loaded.about?.en && loaded.about.en.includes("**") ? loaded.about.en : defaultProfile.about.en,
      id: loaded.about?.id && loaded.about.id.includes("**") ? loaded.about.id : defaultProfile.about.id,
    },
    badge: {
      ...defaultProfile.badge,
      ...(loaded.badge || {}),
      photo: loaded.badge?.photo || defaultProfile.badge?.photo || "/images/lanyard_photo.jpg",
      accentColor: loaded.badge?.accentColor || defaultProfile.badge?.accentColor || "#ff7a00",
    },
  };
}

function loadProjectsFromStorage(): ProjectData[] {
  const loaded = loadFromStorage(STORAGE_KEYS.PROJECTS, defaultProjects as ProjectData[]);
  return (loaded || []).map((p) => ({
    ...p,
    thumbnail:
      p.thumbnail === "/images/mypicnbg.png" ||
        p.thumbnail?.startsWith("/images/projects/")
        ? ""
        : (p.thumbnail || ""),
  }));
}

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<ProfileData>(loadProfileFromStorage);
  const [projects, setProjects] = useState<ProjectData[]>(loadProjectsFromStorage);
  const [experience, setExperience] = useState<ExperienceData[]>(() =>
    loadFromStorage(STORAGE_KEYS.EXPERIENCE, defaultExperience as ExperienceData[])
  );
  const [skills, setSkills] = useState<SkillCategoryData[]>(() =>
    loadFromStorage(STORAGE_KEYS.SKILLS, defaultSkills as SkillCategoryData[])
  );

  // Authentication state is derived only from the Supabase Auth session.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const isLoginInProgress = useRef(false);

  // Supabase Connection & Configuration State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfigCredentials>(getStoredSupabaseConfig);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // UI state for Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    safeRemoveItem("portfolio_admin_credentials_v2");
    safeRemoveItem("portfolio_admin_session_v2");
    let authRevision = 0;
    let active = true;
    const verificationTimers: number[] = [];

    const verifyAdminSession = async (
      hasUser: boolean,
      revision: number
    ): Promise<void> => {
      if (!hasUser) {
        if (!active || revision !== authRevision) return;
        setIsAuthenticated(false);
        setIsAdminOpen(false);
        setAuthError(null);
        setIsAuthLoading(false);
        return;
      }

      try {
        const isAdmin = await isPortfolioAdmin();
        if (!active || revision !== authRevision) return;
        if (!isAdmin) {
          await signOutAdmin();
          if (!active || revision !== authRevision) return;
        }
        setIsAuthenticated(isAdmin);
        if (!isAdmin) setIsAdminOpen(false);
        setAuthError(null);
        setIsAuthLoading(false);
      } catch (error) {
        if (!active || revision !== authRevision) return;
        console.error("Gagal memverifikasi sesi admin Supabase:", error);
        setIsAuthenticated(false);
        setAuthError(
          error instanceof Error
            ? `Tidak dapat memverifikasi sesi admin: ${error.message}`
            : "Tidak dapat memverifikasi sesi admin."
        );
        setIsAuthLoading(false);
      }
    };

    const unsubscribe = onSupabaseAuthStateChange((event, session) => {
      if (!active) return;

      // INITIAL_SESSION is the primary auth init event in Supabase v2
      if (event === "INITIAL_SESSION") {
        const revision = ++authRevision;
        void verifyAdminSession(Boolean(session?.user), revision);
        return;
      }

      if (event !== "SIGNED_OUT" && event !== "SIGNED_IN") return;
      if (event === "SIGNED_IN" && isLoginInProgress.current) return;

      if (event === "SIGNED_OUT") {
        const revision = ++authRevision;
        void verifyAdminSession(false, revision);
        return;
      }

      if (session?.user) {
        const revision = ++authRevision;
        setIsAuthLoading(true);
        setAuthError(null);
        const timer = window.setTimeout(() => {
          void verifyAdminSession(true, revision);
        }, 0);
        verificationTimers.push(timer);
      }
    });

    if (!unsubscribe) {
      // Supabase not configured — show login form immediately, no error
      setIsAuthenticated(false);
      setAuthError(null);
      setIsAuthLoading(false);
    } else {
      // Safety timeout: prevent blank/stuck loading if auth never resolves
      const safetyTimer = window.setTimeout(() => {
        if (!active) return;
        setIsAuthLoading((prev) => {
          if (prev) {
            console.warn("Auth loading timed out after 8s, resetting.");
            setIsAuthenticated(false);
          }
          return false;
        });
      }, 8000);
      verificationTimers.push(safetyTimer);
    }

    return () => {
      active = false;
      authRevision++;
      verificationTimers.forEach((timer) => window.clearTimeout(timer));
      unsubscribe?.();
    };
  }, []);

  // Initial Sync from Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      testSupabaseConnection().then((res) => {
        setIsSupabaseConnected(res.success);
        if (res.success) {
          fetchPortfolioFromSupabase().then((data) => {
            if (data) {
              if (data.profile) setProfile((prev) => ({ ...prev, ...data.profile }));
              if (data.projects && data.projects.length > 0) setProjects(data.projects);
              if (data.experience && data.experience.length > 0) setExperience(data.experience);
              if (data.skills && data.skills.length > 0) setSkills(data.skills);
            }
          });
        }
      });
    }
  }, []);

  const saveSupabaseSettings = useCallback((url: string, key: string) => {
    const ok = saveSupabaseConfig(url, key);
    const updated = getStoredSupabaseConfig();
    setSupabaseConfig(updated);
    if (ok) {
      testSupabaseConnection().then((res) => setIsSupabaseConnected(res.success));
    } else {
      setIsSupabaseConnected(false);
    }
    return ok;
  }, []);

  const clearSupabaseSettings = useCallback(() => {
    clearSupabaseConfig();
    setSupabaseConfig(getStoredSupabaseConfig());
    setIsSupabaseConnected(false);
  }, []);

  const testSupabase = useCallback(async (url?: string, key?: string) => {
    const res = await testSupabaseConnection(
      url && key ? { url, anonKey: key } : undefined
    );
    setIsSupabaseConnected(res.success);
    return res;
  }, []);

  // Manual Trigger to Sync with Supabase
  const syncWithSupabase = useCallback(async (): Promise<boolean> => {
    const res = await syncAllToSupabase(profile, projects, experience, skills);
    setIsSupabaseConnected(res.success);
    return res.success;
  }, [profile, projects, experience, skills]);

  // Persist Profile
  useEffect(() => {
    persistJSON(STORAGE_KEYS.PROFILE, profile);
  }, [profile]);

  // Persist Projects
  useEffect(() => {
    persistProjects(projects);
  }, [projects]);

  // Persist Experience
  useEffect(() => {
    persistJSON(STORAGE_KEYS.EXPERIENCE, experience);
  }, [experience]);

  // Persist Skills
  useEffect(() => {
    persistJSON(STORAGE_KEYS.SKILLS, skills);
  }, [skills]);

  // Theme state & persistence
  const [theme, setThemeState] = useState<"dark" | "light">(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === "light" || saved === "dark") return saved;
      return "dark";
    } catch {
      return "dark";
    }
  });

  // Language state & persistence
  const [language, setLanguageState] = useState<"id" | "en">(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
      if (saved === "id" || saved === "en") return saved;
      return "id";
    } catch {
      return "id";
    }
  });

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "light") {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    } else {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    }
  }, [theme]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.LANGUAGE, language);
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setTheme = useCallback((t: "dark" | "light") => {
    setThemeState(t);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "id" ? "en" : "id"));
  }, []);

  const setLanguage = useCallback((l: "id" | "en") => {
    setLanguageState(l);
  }, []);

  // Reactive Config
  const config = useMemo(() => {
    return buildConfig(profile, experience, projects, skills, language);
  }, [profile, experience, projects, skills, language]);

  // Keyboard shortcut listener: Ctrl+Shift+A or Cmd+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        window.location.href = "/ghchgctydytceycj";
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated]);

  // Auth Handlers
  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    // Brute-force check
    const now = Date.now();
    if (now < loginLockoutUntil) {
      const remainingMin = Math.ceil((loginLockoutUntil - now) / 60000);
      setAuthError(
        `Terlalu banyak percobaan login. Coba lagi dalam ${remainingMin} menit.`
      );
      return;
    }

    isLoginInProgress.current = true;
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await signInAdmin(email, pass);
      // Reset counter on successful login
      loginAttemptCount = 0;
      loginLockoutUntil = 0;
      setIsAuthenticated(true);
      setIsLoginOpen(false);
      setIsAdminOpen(true);
    } catch (err) {
      loginAttemptCount++;
      if (loginAttemptCount >= MAX_LOGIN_ATTEMPTS) {
        loginLockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
        loginAttemptCount = 0;
        setAuthError(
          `Terlalu banyak percobaan. Login diblokir selama 10 menit.`
        );
      } else {
        const message = err instanceof Error ? err.message : 'Login failed';
        const remaining = MAX_LOGIN_ATTEMPTS - loginAttemptCount;
        setAuthError(`${message} (${remaining} percobaan tersisa)`
        );
      }
      setIsAuthenticated(false);
    } finally {
      isLoginInProgress.current = false;
      setIsAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await signOutAdmin();
    setIsAdminOpen(false);
  }, []);

  const changePassword = useCallback(async (pass: string): Promise<void> => {
    await updateAdminPassword(pass);
  }, []);

  const openLoginModal = useCallback(() => {
    if (isAuthenticated) {
      setIsAdminOpen(true);
    } else {
      setIsLoginOpen(true);
    }
  }, [isAuthenticated]);

  const closeLoginModal = useCallback(() => {
    setIsLoginOpen(false);
  }, []);

  const openAdminDrawer = useCallback(() => {
    setIsAdminOpen(true);
  }, []);

  const closeAdminDrawer = useCallback(() => {
    setIsAdminOpen(false);
  }, []);

  // Profile CRUD
  const updateProfile = useCallback((data: Partial<ProfileData>) => {
    setProfile((prev) => {
      const next = {
        ...prev,
        ...data,
        title: { ...prev.title, ...(data.title || {}) },
        available: { ...prev.available, ...(data.available || {}) },
        about: { ...prev.about, ...(data.about || {}) },
        education: { ...prev.education, ...(data.education || {}) },
      };
      if (isSupabaseConfigured()) {
        syncProfileToSupabase(next);
      }
      return next;
    });
  }, []);

  // Projects CRUD
  const addProject = useCallback(async (project: ProjectData): Promise<boolean> => {
    const newProject = {
      ...project,
      id: Date.now(),
      slug:
        project.slug ||
        project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    };
    const next = [newProject, ...projects];

    if (isSupabaseConfigured() && !(await syncProjectsToSupabase(next))) {
      return false;
    }

    setProjects(next);
    return true;
  }, [projects]);

  const updateProject = useCallback(async (
    index: number,
    project: ProjectData
  ): Promise<boolean> => {
    if (!projects[index]) return false;

    const next = [...projects];
    next[index] = { ...next[index], ...project };
    if (isSupabaseConfigured() && !(await syncProjectsToSupabase(next))) {
      return false;
    }

    setProjects(next);
    return true;
  }, [projects]);

  const deleteProject = useCallback((index: number) => {
    setProjects((prev) => {
      const projectToDelete = prev[index];
      const next = prev.filter((_, i) => i !== index);
      if (isSupabaseConfigured() && projectToDelete?.slug) {
        deleteProjectFromSupabase(projectToDelete.slug);
      }
      return next;
    });
  }, []);

  const reorderProjects = useCallback((startIndex: number, endIndex: number) => {
    setProjects((prev) => {
      const result = [...prev];
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      if (isSupabaseConfigured()) {
        syncProjectsToSupabase(result);
      }
      return result;
    });
  }, []);

  // Experience CRUD
  const addExperience = useCallback((exp: ExperienceData) => {
    setExperience((prev) => {
      const next = [exp, ...prev];
      if (isSupabaseConfigured()) {
        syncExperiencesToSupabase(next);
      }
      return next;
    });
  }, []);

  const updateExperience = useCallback((index: number, exp: ExperienceData) => {
    setExperience((prev) => {
      const copy = [...prev];
      copy[index] = exp;
      if (isSupabaseConfigured()) {
        syncExperiencesToSupabase(copy);
      }
      return copy;
    });
  }, []);

  const deleteExperience = useCallback((index: number) => {
    setExperience((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (isSupabaseConfigured()) {
        syncExperiencesToSupabase(next);
      }
      return next;
    });
  }, []);

  // Skills CRUD
  const addSkill = useCallback((categoryIndex: number, item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    setSkills((prev) => {
      const copy = [...prev];
      if (copy[categoryIndex] && !copy[categoryIndex].items.includes(trimmed)) {
        copy[categoryIndex] = {
          ...copy[categoryIndex],
          items: [...copy[categoryIndex].items, trimmed],
        };
        if (isSupabaseConfigured()) {
          syncSkillsToSupabase(copy);
        }
      }
      return copy;
    });
  }, []);

  const removeSkill = useCallback(
    (categoryIndex: number, itemIndex: number) => {
      setSkills((prev) => {
        const copy = [...prev];
        if (copy[categoryIndex]) {
          copy[categoryIndex] = {
            ...copy[categoryIndex],
            items: copy[categoryIndex].items.filter((_, i) => i !== itemIndex),
          };
          if (isSupabaseConfigured()) {
            syncSkillsToSupabase(copy);
          }
        }
        return copy;
      });
    },
    []
  );

  const addSkillCategory = useCallback((categoryEn: string, categoryId: string) => {
    const en = categoryEn.trim();
    if (!en) return;
    setSkills((prev) => {
      const next = [
        ...prev,
        {
          category: { en, id: categoryId.trim() || en },
          items: [],
        },
      ];
      if (isSupabaseConfigured()) {
        syncSkillsToSupabase(next);
      }
      return next;
    });
  }, []);

  const removeSkillCategory = useCallback((categoryIndex: number) => {
    setSkills((prev) => {
      const next = prev.filter((_, i) => i !== categoryIndex);
      if (isSupabaseConfigured()) {
        syncSkillsToSupabase(next);
      }
      return next;
    });
  }, []);

  // Reset to Defaults
  const resetToDefaults = useCallback(() => {
    setProfile(defaultProfile as ProfileData);
    setProjects(defaultProjects as ProjectData[]);
    setExperience(defaultExperience as ExperienceData[]);
    setSkills(defaultSkills as SkillCategoryData[]);
    safeRemoveItem(STORAGE_KEYS.PROFILE);
    safeRemoveItem(STORAGE_KEYS.PROJECTS);
    safeRemoveItem(STORAGE_KEYS.EXPERIENCE);
    safeRemoveItem(STORAGE_KEYS.SKILLS);
  }, []);

  // Export JSON
  const exportJSON = useCallback(() => {
    return JSON.stringify(
      {
        profile,
        projects,
        experience,
        skills,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }, [profile, projects, experience, skills]);

  // Import JSON — with schema validation
  const importJSON = useCallback((jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (typeof data !== "object" || data === null || Array.isArray(data)) {
        console.error("importJSON: data bukan objek");
        return false;
      }

      // Validate profile shape
      if (data.profile !== undefined) {
        if (typeof data.profile !== "object" || Array.isArray(data.profile)) {
          console.error("importJSON: profile tidak valid");
          return false;
        }
        setProfile(data.profile);
      }

      // Validate projects shape
      if (data.projects !== undefined) {
        if (!Array.isArray(data.projects)) {
          console.error("importJSON: projects harus berupa array");
          return false;
        }
        // Each project must have at minimum a title string
        const valid = data.projects.every(
          (p: unknown) =>
            typeof p === "object" &&
            p !== null &&
            typeof (p as Record<string, unknown>).title === "string"
        );
        if (!valid) {
          console.error("importJSON: projects berisi item tidak valid");
          return false;
        }
        setProjects(data.projects);
      }

      if (Array.isArray(data.experience)) setExperience(data.experience);
      if (Array.isArray(data.skills)) setSkills(data.skills);
      return true;
    } catch (e) {
      console.error("Failed to import JSON data:", e);
      return false;
    }
  }, []);

  const value = {
    profile,
    projects,
    experience,
    skills,
    config,
    isSupabaseConnected,
    supabaseConfig,
    saveSupabaseSettings,
    clearSupabaseSettings,
    testSupabase,
    syncWithSupabase,
    updateProfile,
    addProject,
    updateProject,
    deleteProject,
    reorderProjects,
    addExperience,
    updateExperience,
    deleteExperience,
    addSkill,
    removeSkill,
    addSkillCategory,
    removeSkillCategory,
    resetToDefaults,
    exportJSON,
    importJSON,
    isAuthenticated,
    isAuthLoading,
    authError,
    login,
    logout,
    changePassword,
    isLoginOpen,
    openLoginModal,
    closeLoginModal,
    isAdminOpen,
    openAdminDrawer,
    closeAdminDrawer,
    theme,
    toggleTheme,
    setTheme,
    language,
    toggleLanguage,
    setLanguage,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (!context) {
    return {
      profile: defaultProfile as ProfileData,
      projects: defaultProjects as ProjectData[],
      experience: defaultExperience as ExperienceData[],
      skills: defaultSkills as SkillCategoryData[],
      config: buildConfig(),
      isSupabaseConnected: false,
      supabaseConfig: { url: "", anonKey: "", source: "none" },
      saveSupabaseSettings: () => false,
      clearSupabaseSettings: () => { },
      testSupabase: async () => ({ success: false, message: "" }),
      syncWithSupabase: async () => false,
      updateProfile: () => { },
      addProject: async () => false,
      updateProject: async () => false,
      deleteProject: () => { },
      reorderProjects: () => { },
      addExperience: () => { },
      updateExperience: () => { },
      deleteExperience: () => { },
      addSkill: () => { },
      removeSkill: () => { },
      addSkillCategory: () => { },
      removeSkillCategory: () => { },
      resetToDefaults: () => { },
      exportJSON: () => "{}",
      importJSON: () => false,
      isAuthenticated: false,
      isAuthLoading: false,
      authError: null,
      login: async () => { },
      logout: async () => { },
      changePassword: async () => { },
      isLoginOpen: false,
      openLoginModal: () => { },
      closeLoginModal: () => { },
      isAdminOpen: false,
      openAdminDrawer: () => { },
      closeAdminDrawer: () => { },
      theme: "dark",
      toggleTheme: () => { },
      setTheme: () => { },
      language: "id",
      toggleLanguage: () => { },
      setLanguage: () => { },
    };
  }
  return context;
};
