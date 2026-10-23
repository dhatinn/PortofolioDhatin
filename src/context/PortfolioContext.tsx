import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
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
  SupabaseConfigCredentials,
} from "../lib/supabase";

interface AdminCredentials {
  username: string;
  passwordHash: string; // Base64 or plain for local dev
}

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
  addProject: (project: ProjectData) => void;
  updateProject: (index: number, project: ProjectData) => void;
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
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  changeCredentials: (user: string, pass: string) => void;

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
  CREDENTIALS: "portfolio_admin_credentials_v2",
  AUTH_SESSION: "portfolio_admin_session_v2",
  THEME: "portfolio_theme_v1",
  LANGUAGE: "portfolio_language_v1",
};

const DEFAULT_CREDENTIALS: AdminCredentials = {
  username: "admin",
  passwordHash: "admin123",
};

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

function loadProfileFromStorage(): ProfileData {
  const loaded = loadFromStorage(STORAGE_KEYS.PROFILE, defaultProfile as ProfileData);
  return {
    ...defaultProfile,
    ...loaded,
    photo: loaded.photo || defaultProfile.photo || "/images/lanyard_photo.jpg",
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

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<ProfileData>(loadProfileFromStorage);
  const [projects, setProjects] = useState<ProjectData[]>(() =>
    loadFromStorage(STORAGE_KEYS.PROJECTS, defaultProjects as ProjectData[])
  );
  const [experience, setExperience] = useState<ExperienceData[]>(() =>
    loadFromStorage(STORAGE_KEYS.EXPERIENCE, defaultExperience as ExperienceData[])
  );
  const [skills, setSkills] = useState<SkillCategoryData[]>(() =>
    loadFromStorage(STORAGE_KEYS.SKILLS, defaultSkills as SkillCategoryData[])
  );

  // Authentication State
  const [credentials, setCredentials] = useState<AdminCredentials>(() =>
    loadFromStorage(STORAGE_KEYS.CREDENTIALS, DEFAULT_CREDENTIALS)
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.AUTH_SESSION, false)
  );

  // Supabase Connection & Configuration State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfigCredentials>(getStoredSupabaseConfig);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // UI state for Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  // Persist Projects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  // Persist Experience
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPERIENCE, JSON.stringify(experience));
  }, [experience]);

  // Persist Skills
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(skills));
  }, [skills]);

  // Persist Credentials
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
  }, [credentials]);

  // Persist Auth Session
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

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
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {}
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
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch {}
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
  const login = useCallback(
    (user: string, pass: string): boolean => {
      const cleanUser = user.trim().toLowerCase();
      const validUser =
        cleanUser === credentials.username.toLowerCase() ||
        cleanUser === profile.email.toLowerCase();
      const validPass = pass === credentials.passwordHash;

      if (validUser && validPass) {
        setIsAuthenticated(true);
        setIsLoginOpen(false);
        setIsAdminOpen(true);
        return true;
      }
      return false;
    },
    [credentials, profile.email]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setIsAdminOpen(false);
  }, []);

  const changeCredentials = useCallback((user: string, pass: string) => {
    setCredentials({
      username: user.trim() || "admin",
      passwordHash: pass,
    });
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
  const addProject = useCallback((project: ProjectData) => {
    setProjects((prev) => {
      const next = [
        {
          ...project,
          id: Date.now(),
          slug:
            project.slug ||
            project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        },
        ...prev,
      ];
      if (isSupabaseConfigured()) {
        syncProjectsToSupabase(next);
      }
      return next;
    });
  }, []);

  const updateProject = useCallback((index: number, project: ProjectData) => {
    setProjects((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...project };
      if (isSupabaseConfigured()) {
        syncProjectsToSupabase(copy);
      }
      return copy;
    });
  }, []);

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
    setCredentials(DEFAULT_CREDENTIALS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.EXPERIENCE);
    localStorage.removeItem(STORAGE_KEYS.SKILLS);
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

  // Import JSON
  const importJSON = useCallback((jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profile) setProfile(data.profile);
      if (Array.isArray(data.projects)) setProjects(data.projects);
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
    login,
    logout,
    changeCredentials,
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
      clearSupabaseSettings: () => {},
      testSupabase: async () => ({ success: false, message: "" }),
      syncWithSupabase: async () => false,
      updateProfile: () => {},
      addProject: () => {},
      updateProject: () => {},
      deleteProject: () => {},
      reorderProjects: () => {},
      addExperience: () => {},
      updateExperience: () => {},
      deleteExperience: () => {},
      addSkill: () => {},
      removeSkill: () => {},
      addSkillCategory: () => {},
      removeSkillCategory: () => {},
      resetToDefaults: () => {},
      exportJSON: () => "{}",
      importJSON: () => false,
      isAuthenticated: false,
      login: () => false,
      logout: () => {},
      changeCredentials: () => {},
      isLoginOpen: false,
      openLoginModal: () => {},
      closeLoginModal: () => {},
      isAdminOpen: false,
      openAdminDrawer: () => {},
      closeAdminDrawer: () => {},
      theme: "dark",
      toggleTheme: () => {},
      setTheme: () => {},
      language: "id",
      toggleLanguage: () => {},
      setLanguage: () => {},
    };
  }
  return context;
};
