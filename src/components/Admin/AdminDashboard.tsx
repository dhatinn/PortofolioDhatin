import React, { useState, useEffect, useRef } from "react";
import {
  FiUser,
  FiBriefcase,
  FiClock,
  FiCpu,
  FiSettings,
  FiX,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiSave,
  FiLogOut,
  FiExternalLink,
  FiCheck,
  FiArrowUp,
  FiArrowDown,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiAlertTriangle,
  FiImage,
  FiEye,
  FiLayers,
  FiGrid,
  FiSearch,
} from "react-icons/fi";
import { usePortfolio } from "../../context/PortfolioContext";
import { ProjectData, ExperienceData, ProfileData } from "../../types/portfolio";
import { drawLanyardCard } from "../Lanyard/cardTexture";
import "./styles/Admin.css";

type TabKey = "lanyard" | "profile" | "services" | "projects" | "experience" | "skills" | "settings";

import { uploadImageToSupabaseStorage } from "../../lib/supabase";

const ACCENT_COLORS = [
  { name: "Solar Orange (Hero)", value: "#ff7a00" },
  { name: "Golden Amber", value: "#f59e0b" },
  { name: "Neon Purple", value: "#a855f7" },
  { name: "Cyber Cyan", value: "#06b6d4" },
  { name: "Emerald Tech", value: "#10b981" },
  { name: "Sunset Pink", value: "#ec4899" },
  { name: "Electric Blue", value: "#3b82f6" },
];

const AdminDashboard: React.FC = () => {
  const {
    profile,
    projects,
    experience,
    skills,
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
    logout,
    changeCredentials,
    isAdminOpen,
    closeAdminDrawer,
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState<TabKey>("lanyard");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Supabase Configuration Local State
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseConfig.url || "");
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(supabaseConfig.anonKey || "");
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [supabaseTestMsg, setSupabaseTestMsg] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setSupabaseUrlInput(supabaseConfig.url || "");
    setSupabaseKeyInput(supabaseConfig.anonKey || "");
  }, [supabaseConfig]);

  // Profile Form Local State
  const [profileForm, setProfileForm] = useState<ProfileData>(profile);
  const [newTagline, setNewTagline] = useState("");
  const [previewFace, setPreviewFace] = useState<"front" | "back">("front");
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Sync profileForm when profile changes externally
  useEffect(() => {
    setProfileForm(profile);
  }, [profile]);

  // Canvas Reference for Live 3D Card Preview
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-draw Preview Canvas whenever photo, badge, or profile details change
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Render on an offscreen 1024x1024 canvas then scale onto preview canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = 1024;
    offscreen.height = 1024;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    const role =
      profileForm.badge?.badgeRole ||
      profileForm.taglines?.[0] ||
      "Full-Stack Developer";
    const name = profileForm.name || "Dhatin Nuril Arsandy";
    const initials =
      profileForm.badge?.initials ||
      name
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() ||
      "DN";
    const photoUrl = profileForm.photo || "/images/lanyard_photo.jpg";
    const accentColor = profileForm.badge?.accentColor || "#ff7a00";
    const badgeId = profileForm.badge?.badgeId || "DEV ID • VERIFIED";
    const subText = profileForm.badge?.subText || "ID: 2026-DHATIN-DEV-SECURE";

    const updateDisplay = (img?: HTMLImageElement) => {
      drawLanyardCard(
        offCtx,
        {
          photoUrl,
          name,
          role,
          initials,
          badgeId,
          subText,
          accentColor,
        },
        img
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (previewFace === "front") {
        // Front face: X in [0..512], Y in [0..768]
        ctx.drawImage(offscreen, 0, 0, 512, 768, 0, 0, canvas.width, canvas.height);
      } else {
        // Back face: X in [512..1024], Y in [0..768]
        ctx.drawImage(offscreen, 512, 0, 512, 768, 0, 0, canvas.width, canvas.height);
      }
    };

    updateDisplay();

    if (photoUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => updateDisplay(img);
      img.onerror = () => {
        if (photoUrl !== "/images/lanyard_photo.jpg") {
          const fallback = new Image();
          fallback.crossOrigin = "anonymous";
          fallback.onload = () => updateDisplay(fallback);
          fallback.src = "/images/lanyard_photo.jpg";
        }
      };
      img.src = photoUrl;
    }
  }, [profileForm, previewFace]);

  // Project Modal State
  const [projectSearch, setProjectSearch] = useState("");
  const [projectCategoryFilter, setProjectCategoryFilter] = useState("All");
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectData>({
    slug: "",
    title: "",
    year: new Date().getFullYear(),
    category: "Web App",
    description: "",
    stack: [],
    thumbnail: "",
    demo: "",
    repo: "",
  });
  const [newStackTag, setNewStackTag] = useState("");

  // Experience Modal State
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [expForm, setExpForm] = useState<ExperienceData>({
    role: "",
    company: "",
    location: "Bandung, Indonesia",
    period: "2024 – Sekarang",
    highlights: [""],
    tags: [],
  });
  const [newExpTag, setNewExpTag] = useState("");

  // Skills input state per category
  const [skillInputs, setSkillInputs] = useState<{ [key: number]: string }>({});
  const [newCategoryEn, setNewCategoryEn] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");

  // Settings State
  const [newUsername, setNewUsername] = useState("admin");
  const [newPassword, setNewPassword] = useState("");
  const [importJsonText, setImportJsonText] = useState("");
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  if (!isAdminOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // --- Profile Handlers ---
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateProfile(profileForm);
    showToast("Profil & 3D Lanyard Card berhasil disimpan!");
  };

  const handlePhotoFileUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Harap pilih file gambar (PNG, JPG, WebP)");
      return;
    }

    if (isSupabaseConnected) {
      showToast("Mengunggah foto ke Supabase Storage...");
      const publicUrl = await uploadImageToSupabaseStorage(file);
      if (publicUrl) {
        setProfileForm((prev) => ({ ...prev, photo: publicUrl }));
        updateProfile({ ...profileForm, photo: publicUrl });
        showToast("Foto berhasil diunggah ke Supabase Storage & diterapkan!");
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setProfileForm((prev) => ({ ...prev, photo: dataUrl }));
      updateProfile({ ...profileForm, photo: dataUrl });
      showToast("Foto baru berhasil dimuat & langsung diterapkan!");
    };
    reader.readAsDataURL(file);
  };

  const handleAddTagline = () => {
    if (!newTagline.trim()) return;
    setProfileForm((prev) => ({
      ...prev,
      taglines: [...(prev.taglines || []), newTagline.trim()],
    }));
    setNewTagline("");
  };

  const handleRemoveTagline = (index: number) => {
    setProfileForm((prev) => ({
      ...prev,
      taglines: prev.taglines.filter((_, i) => i !== index),
    }));
  };

  // --- Project Handlers ---
  const handleOpenAddProject = () => {
    setEditingProjectIndex(null);
    setProjectForm({
      slug: "",
      title: "",
      year: new Date().getFullYear(),
      category: "Web App",
      description: "",
      stack: ["React.js", "TypeScript"],
      thumbnail: "/images/mypicnbg.png",
      demo: "",
      repo: "",
    });
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (index: number) => {
    setEditingProjectIndex(index);
    setProjectForm({ ...projects[index] });
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) {
      showToast("Judul proyek tidak boleh kosong");
      return;
    }

    if (editingProjectIndex !== null) {
      updateProject(editingProjectIndex, projectForm);
      showToast("Proyek berhasil diperbarui!");
    } else {
      addProject(projectForm);
      showToast("Proyek baru berhasil ditambahkan!");
    }
    setIsProjectModalOpen(false);
  };

  const handleProjectThumbUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProjectForm((prev) => ({
        ...prev,
        thumbnail: ev.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddStackTag = (tagToAdd?: string) => {
    const val = tagToAdd || newStackTag.trim();
    if (!val) return;
    if (projectForm.stack.includes(val)) return;
    setProjectForm((prev) => ({
      ...prev,
      stack: [...(prev.stack || []), val],
    }));
    setNewStackTag("");
  };

  const handleRemoveStackTag = (idx: number) => {
    setProjectForm((prev) => ({
      ...prev,
      stack: prev.stack.filter((_, i) => i !== idx),
    }));
  };

  // --- Experience Handlers ---
  const handleOpenAddExp = () => {
    setEditingExpIndex(null);
    setExpForm({
      role: "",
      company: "",
      location: "Bandung, Indonesia",
      period: "2024 – Sekarang",
      highlights: [""],
      tags: [],
    });
    setIsExpModalOpen(true);
  };

  const handleOpenEditExp = (index: number) => {
    setEditingExpIndex(index);
    setExpForm({ ...experience[index] });
    setIsExpModalOpen(true);
  };

  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.role.trim() || !expForm.company.trim()) return;

    const cleaned = {
      ...expForm,
      highlights: expForm.highlights.filter((h) => h.trim() !== ""),
    };

    if (editingExpIndex !== null) {
      updateExperience(editingExpIndex, cleaned);
      showToast("Pengalaman berhasil diperbarui!");
    } else {
      addExperience(cleaned);
      showToast("Pengalaman baru berhasil ditambahkan!");
    }
    setIsExpModalOpen(false);
  };

  const handleAddHighlightLine = () => {
    setExpForm((prev) => ({
      ...prev,
      highlights: [...prev.highlights, ""],
    }));
  };

  const handleUpdateHighlightLine = (idx: number, val: string) => {
    setExpForm((prev) => {
      const copy = [...prev.highlights];
      copy[idx] = val;
      return { ...prev, highlights: copy };
    });
  };

  const handleRemoveHighlightLine = (idx: number) => {
    setExpForm((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== idx),
    }));
  };

  const handleAddExpTag = () => {
    if (!newExpTag.trim()) return;
    setExpForm((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), newExpTag.trim()],
    }));
    setNewExpTag("");
  };

  const handleRemoveExpTag = (idx: number) => {
    setExpForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== idx),
    }));
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.stack.some((s) => s.toLowerCase().includes(projectSearch.toLowerCase()));
    const matchCategory =
      projectCategoryFilter === "All" || p.category === projectCategoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="admin-drawer-container">
      {/* Topbar */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <div className="admin-badge-logo">DN</div>
          <div className="admin-topbar-title">
            <h1>
              Portfolio Studio & Control Center
              <span className="admin-sync-pill">Live Mode</span>
              {isSupabaseConnected ? (
                <span
                  className="admin-sync-pill"
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    borderColor: "rgba(16, 185, 129, 0.35)",
                  }}
                  title="Terkoneksi langsung ke database Supabase"
                >
                  🟢 Supabase Connected
                </span>
              ) : (
                <span
                  className="admin-sync-pill"
                  style={{
                    background: "rgba(245, 158, 11, 0.12)",
                    color: "#f59e0b",
                    borderColor: "rgba(245, 158, 11, 0.3)",
                  }}
                  title="Menggunakan local storage (Atur .env untuk menghubungkan Supabase)"
                >
                  🟡 Mode Lokal (Offline)
                </span>
              )}
              <span className="admin-pill-hot">3D Lanyard Active</span>
            </h1>
            <span className="subtitle">
              Kelola foto 3D lanyard, biografi, proyek, karir, dan keahlian secara fleksibel
            </span>
          </div>
        </div>

        <div className="admin-topbar-right">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={closeAdminDrawer}
            title="Tutup dashboard dan lihat portofolio langsung di browser"
          >
            <FiEye />
            <span>Lihat Website</span>
          </button>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => handleSaveProfile()}
          >
            <FiSave />
            <span>Simpan Semua</span>
          </button>
          <button
            type="button"
            className="admin-btn-danger"
            onClick={logout}
            title="Keluar dari sesi admin"
          >
            <FiLogOut />
            <span>Keluar</span>
          </button>
          <button
            type="button"
            className="admin-close-btn"
            style={{ position: "static" }}
            onClick={closeAdminDrawer}
            title="Tutup (Esc)"
          >
            <FiX />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="admin-body">
        {/* Sidebar Nav */}
        <div className="admin-sidebar">
          <div className="admin-sidebar-section-title">Visual & 3D</div>
          <button
            className={`admin-tab-btn ${activeTab === "lanyard" ? "active" : ""}`}
            onClick={() => setActiveTab("lanyard")}
          >
            <FiImage className="admin-tab-icon" />
            <span>3D Card & Foto</span>
            <span className="admin-tab-count" style={{ background: "#ff7a00", color: "#fff" }}>
              3D
            </span>
          </button>

          <div className="admin-sidebar-section-title">Konten Portofolio</div>
          <button
            className={`admin-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <FiUser className="admin-tab-icon" />
            <span>Profil & Bio</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "services" ? "active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            <FiGrid className="admin-tab-icon" />
            <span>Layanan / What I Do</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "projects" ? "active" : ""}`}
            onClick={() => setActiveTab("projects")}
          >
            <FiBriefcase className="admin-tab-icon" />
            <span>Proyek Portofolio</span>
            <span className="admin-tab-count">{projects.length}</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "experience" ? "active" : ""}`}
            onClick={() => setActiveTab("experience")}
          >
            <FiClock className="admin-tab-icon" />
            <span>Pengalaman Karir</span>
            <span className="admin-tab-count">{experience.length}</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "skills" ? "active" : ""}`}
            onClick={() => setActiveTab("skills")}
          >
            <FiCpu className="admin-tab-icon" />
            <span>Keahlian & Tools</span>
            <span className="admin-tab-count">{skills.length}</span>
          </button>

          <div className="admin-sidebar-section-title">Sistem & Keamanan</div>
          <button
            className={`admin-tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <FiSettings className="admin-tab-icon" />
            <span>Akun & Backup</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="admin-main-content">
          {/* =========================================================================
              TAB: 3D CARD & FOTO PROFIL (HERO FEATURE)
             ========================================================================= */}
          {activeTab === "lanyard" && (
            <div>
              <div className="admin-tab-header">
                <div>
                  <h2>Kustomisasi 3D Lanyard ID Card & Foto Profil</h2>
                  <p>
                    Ganti foto profil dengan mengunggah gambar dari komputer atau link. Sesuaikan tema warna, inisial badge, dan teks kartu 3D secara instan.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => handleSaveProfile()}
                >
                  <FiSave />
                  <span>Terapkan Perubahan</span>
                </button>
              </div>

              {/* Quick Stats Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div
                    className="admin-stat-icon-wrap"
                    style={{ background: "rgba(255, 122, 0, 0.15)", color: "#ff9f43" }}
                  >
                    <FiImage />
                  </div>
                  <div className="admin-stat-info">
                    <h4>Status Foto 3D</h4>
                    <div className="value" style={{ fontSize: "16px", color: "#34d399" }}>
                      Aktif & Terpasang
                    </div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div
                    className="admin-stat-icon-wrap"
                    style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
                  >
                    <FiLayers />
                  </div>
                  <div className="admin-stat-info">
                    <h4>Fisika Rapier</h4>
                    <div className="value" style={{ fontSize: "16px", color: "#60a5fa" }}>
                      Interactive Rope
                    </div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div
                    className="admin-stat-icon-wrap"
                    style={{ background: "rgba(236, 72, 153, 0.15)", color: "#f472b6" }}
                  >
                    <FiEye />
                  </div>
                  <div className="admin-stat-info">
                    <h4>Resolusi Tekstur</h4>
                    <div className="value" style={{ fontSize: "16px" }}>1024 x 1024 HD</div>
                  </div>
                </div>
              </div>

              {/* Main Customizer Grid */}
              <div className="admin-card-customizer-grid">
                {/* Column 1: Live Interactive Card Preview */}
                <div className="admin-card-preview-wrapper">
                  <div className="admin-card-badge-strap"></div>
                  <div className="admin-card-canvas-frame">
                    <canvas
                      ref={previewCanvasRef}
                      width={260}
                      height={390}
                      style={{ width: "100%", height: "100%", display: "block" }}
                    />
                  </div>

                  <div className="admin-card-preview-controls">
                    <button
                      type="button"
                      className={`admin-preview-flip-btn ${previewFace === "front" ? "active" : ""}`}
                      onClick={() => setPreviewFace("front")}
                    >
                      <FiEye />
                      <span>Tampak Depan</span>
                    </button>
                    <button
                      type="button"
                      className={`admin-preview-flip-btn ${previewFace === "back" ? "active" : ""}`}
                      onClick={() => setPreviewFace("back")}
                    >
                      <FiLayers />
                      <span>Tampak Belakang</span>
                    </button>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.45)",
                      marginTop: "12px",
                      textAlign: "center",
                    }}
                  >
                    Preview kartu 3D berayun di halaman Hero
                  </span>
                </div>

                {/* Column 2: Upload Controls & Customizer */}
                <div>
                  {/* Photo Upload Section */}
                  <div className="admin-card">
                    <div className="admin-card-title">
                      <FiUpload style={{ color: "#ff7a00" }} />
                      Upload Foto Profil
                    </div>

                    {/* Drag and Drop Box */}
                    <div
                      className={`admin-upload-dropzone ${isDraggingPhoto ? "dragging" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingPhoto(true);
                      }}
                      onDragLeave={() => setIsDraggingPhoto(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingPhoto(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handlePhotoFileUpload(file);
                      }}
                      onClick={() => {
                        document.getElementById("admin-photo-input")?.click();
                      }}
                    >
                      <FiUpload className="admin-upload-dropzone-icon" />
                      <h4>Tarik & Jatuhkan Foto ke Sini, atau Klik untuk Memilih</h4>
                      <p>Mendukung PNG (transparan disarankan), JPG, WebP hingga 10MB</p>
                      <input
                        id="admin-photo-input"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoFileUpload(file);
                        }}
                      />
                    </div>

                    {/* Direct URL Input */}
                    <div className="admin-form-group" style={{ marginTop: "18px" }}>
                      <label>Atau Gunakan URL / Path Foto</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="Contoh: /images/mypicnbg.png atau https://..."
                        value={profileForm.photo}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProfileForm({ ...profileForm, photo: val });
                          updateProfile({ ...profileForm, photo: val });
                        }}
                      />
                    </div>

                    {/* Preset Photos Grid */}
                    <div style={{ marginTop: "14px" }}>
                      <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                        Foto Preset Portofolio:
                      </label>
                      <div className="admin-preset-photos-grid">
                        <button
                          type="button"
                          className="admin-preset-btn"
                          onClick={() => {
                            setProfileForm((prev) => ({
                              ...prev,
                              photo: "/images/lanyard_photo.jpg",
                              badge: {
                                ...(prev.badge || {}),
                                photo: "/images/lanyard_photo.jpg",
                              },
                            }));
                            updateProfile({
                              ...profileForm,
                              photo: "/images/lanyard_photo.jpg",
                              badge: {
                                ...(profileForm.badge || {}),
                                photo: "/images/lanyard_photo.jpg",
                              },
                            });
                            showToast("Foto Lanyard Asli Dhatin dipilih!");
                          }}
                        >
                          <img src="/images/lanyard_photo.jpg" alt="Dhatin Lanyard" />
                          <span>Dhatin (IMG_1199 Asli)</span>
                        </button>

                        <button
                          type="button"
                          className="admin-preset-btn"
                          onClick={() => {
                            setProfileForm((prev) => ({
                              ...prev,
                              photo: "/images/mypicnbg.png",
                            }));
                            updateProfile({ ...profileForm, photo: "/images/mypicnbg.png" });
                            showToast("Foto Dhatin (Tanpa Background) dipilih!");
                          }}
                        >
                          <img src="/images/mypicnbg.png" alt="Dhatin" />
                          <span>Dhatin (Transparan)</span>
                        </button>

                        <button
                          type="button"
                          className="admin-preset-btn"
                          onClick={() => {
                            setProfileForm((prev) => ({
                              ...prev,
                              photo: "/images/profile.jpg",
                            }));
                            updateProfile({ ...profileForm, photo: "/images/profile.jpg" });
                            showToast("Foto Profil Asli dipilih!");
                          }}
                        >
                          <img src="/images/profile.jpg" alt="Profile" />
                          <span>Foto Profil Formal</span>
                        </button>

                        <button
                          type="button"
                          className="admin-preset-btn"
                          onClick={() => {
                            setProfileForm((prev) => ({
                              ...prev,
                              photo: "/assets/images/extracted_card_base.png",
                            }));
                            updateProfile({
                              ...profileForm,
                              photo: "/assets/images/extracted_card_base.png",
                            });
                            showToast("Foto Bawaan Lanyard dipilih!");
                          }}
                        >
                          <img src="/assets/images/extracted_card_base.png" alt="Lanyard" />
                          <span>Lanyard Default</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Styling & Text Customizer */}
                  <div className="admin-card">
                    <div className="admin-card-title">
                      <FiSettings style={{ color: "#ff7a00" }} />
                      Kustomisasi Tampilan Kartu 3D
                    </div>

                    {/* Accent Color Picker */}
                    <div className="admin-form-group">
                      <label>Warna Aksen Kartu & Neon Glow</label>
                      <div className="admin-color-swatches">
                        {ACCENT_COLORS.map((item) => (
                          <div
                            key={item.value}
                            className={`admin-color-swatch ${
                              (profileForm.badge?.accentColor || "#ff7a00") === item.value
                                ? "active"
                                : ""
                            }`}
                            style={{ backgroundColor: item.value }}
                            title={item.name}
                            onClick={() => {
                              setProfileForm((prev) => ({
                                ...prev,
                                badge: {
                                  ...prev.badge,
                                  accentColor: item.value,
                                },
                              }));
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="admin-grid-2">
                      <div className="admin-form-group">
                        <label>Inisial Badge Depan</label>
                        <input
                          type="text"
                          maxLength={3}
                          className="admin-input"
                          placeholder="DN"
                          value={profileForm.badge?.initials || "DN"}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              badge: {
                                ...profileForm.badge,
                                initials: e.target.value.toUpperCase(),
                              },
                            })
                          }
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Role / Jabatan di Kartu</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="FULL-STACK DEV"
                          value={profileForm.badge?.badgeRole || "FULL-STACK DEV"}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              badge: {
                                ...profileForm.badge,
                                badgeRole: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="admin-grid-2">
                      <div className="admin-form-group">
                        <label>Label Verifikasi ID (Bawah Foto)</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="DEV ID • VERIFIED"
                          value={profileForm.badge?.badgeId || "DEV ID • VERIFIED"}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              badge: {
                                ...profileForm.badge,
                                badgeId: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Kode Barcode Digital (Belakang)</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="ID: 2026-DHATIN-DEV-SECURE"
                          value={
                            profileForm.badge?.subText ||
                            "ID: 2026-DHATIN-DEV-SECURE"
                          }
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              badge: {
                                ...profileForm.badge,
                                subText: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: PROFIL & BIO
             ========================================================================= */}
          {activeTab === "profile" && (
            <div>
              <div className="admin-tab-header">
                <div>
                  <h2>Informasi Profil & Bio Diri</h2>
                  <p>Sesuaikan nama, kontak, headline, biografi bilingual, dan tautan sosial media</p>
                </div>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => handleSaveProfile()}
                >
                  <FiSave />
                  <span>Simpan Profil</span>
                </button>
              </div>

              <form onSubmit={handleSaveProfile}>
                {/* Identitas */}
                <div className="admin-card">
                  <div className="admin-card-title">Identitas Utama</div>
                  <div className="admin-grid-2">
                    <div className="admin-form-group">
                      <label>Nama Lengkap</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Lokasi Domisili</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.location || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            location: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="admin-grid-2">
                    <div className="admin-form-group">
                      <label>Headline Title (Bahasa Inggris)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.title?.en || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            title: { ...profileForm.title, en: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Headline Title (Bahasa Indonesia)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.title?.id || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            title: { ...profileForm.title, id: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Taglines */}
                  <div className="admin-form-group">
                    <label>Taglines / Keahlian Utama (Tampil Berputar di Hero)</label>
                    <div className="admin-chips-container">
                      {(profileForm.taglines || []).map((tag, idx) => (
                        <span className="admin-chip" key={idx}>
                          {tag}
                          <button
                            type="button"
                            className="admin-chip-remove"
                            onClick={() => handleRemoveTagline(idx)}
                          >
                            <FiX />
                          </button>
                        </span>
                      ))}
                      <div className="admin-chip-add-wrap">
                        <input
                          type="text"
                          placeholder="+ Tambah tagline"
                          className="admin-chip-input"
                          value={newTagline}
                          onChange={(e) => setNewTagline(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTagline();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{ padding: "6px 10px" }}
                          onClick={handleAddTagline}
                        >
                          <FiPlus />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio / Tentang Saya */}
                <div className="admin-card">
                  <div className="admin-card-title">Tentang Saya & Bio</div>
                  <div className="admin-form-group">
                    <label>Bio Paragraf (English)</label>
                    <textarea
                      rows={4}
                      className="admin-textarea"
                      value={profileForm.about?.en || ""}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          about: { ...profileForm.about, en: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Bio Paragraf (Bahasa Indonesia)</label>
                    <textarea
                      rows={4}
                      className="admin-textarea"
                      value={profileForm.about?.id || ""}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          about: { ...profileForm.about, id: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Kontak & Media Sosial */}
                <div className="admin-card">
                  <div className="admin-card-title">Kontak & Media Sosial</div>
                  <div className="admin-grid-3">
                    <div className="admin-form-group">
                      <label>Email Utama</label>
                      <input
                        type="email"
                        className="admin-input"
                        value={profileForm.email || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Nomor WhatsApp (Format: 628...)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.whatsapp || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            whatsapp: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Nomor Telepon</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.phone || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="admin-grid-3">
                    <div className="admin-form-group">
                      <label>GitHub Profile URL</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.github || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            github: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>LinkedIn Profile URL</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.linkedin || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            linkedin: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Path / URL File CV PDF</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.cv || ""}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, cv: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Pendidikan & Status Ketersediaan */}
                <div className="admin-card">
                  <div className="admin-card-title">Pendidikan & Status Kerja</div>
                  <div className="admin-grid-2">
                    <div className="admin-form-group">
                      <label>Status Ketersediaan (English)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.available?.en || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            available: {
                              ...profileForm.available,
                              en: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Status Ketersediaan (Indonesia)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.available?.id || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            available: {
                              ...profileForm.available,
                              id: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="admin-grid-3">
                    <div className="admin-form-group">
                      <label>Institusi / Kampus</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.education?.school || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            education: {
                              ...profileForm.education,
                              school: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Program Studi & Gelar</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={profileForm.education?.degree || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            education: {
                              ...profileForm.education,
                              degree: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Semester Saat Ini</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={profileForm.education?.semester || 6}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            education: {
                              ...profileForm.education,
                              semester: parseInt(e.target.value) || 6,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* =========================================================================
              TAB: SERVICES / WHAT I DO
             ========================================================================= */}
          {activeTab === "services" && (
            <div>
              <div className="admin-tab-header">
                <div>
                  <h2>Layanan & Bidang "What I Do"</h2>
                  <p>Sesuaikan pilar keahlian yang ditampilkan pada bagian WHAT I DO di landing page</p>
                </div>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => handleSaveProfile()}
                >
                  <FiSave />
                  <span>Simpan Layanan</span>
                </button>
              </div>

              {(profileForm.services || []).map((service, index) => (
                <div className="admin-card" key={index}>
                  <div className="admin-card-title">
                    <span className="badge">Layanan {index + 1}</span>
                    {service.title || `Bidang ${index + 1}`}
                  </div>

                  <div className="admin-grid-2">
                    <div className="admin-form-group">
                      <label>Nama Bidang Layanan</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={service.title}
                        onChange={(e) => {
                          const copy = [...(profileForm.services || [])];
                          copy[index] = { ...copy[index], title: e.target.value };
                          setProfileForm({ ...profileForm, services: copy });
                        }}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Deskripsi Singkat (Headline)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={service.desc}
                        onChange={(e) => {
                          const copy = [...(profileForm.services || [])];
                          copy[index] = { ...copy[index], desc: e.target.value };
                          setProfileForm({ ...profileForm, services: copy });
                        }}
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Deskripsi Detail (Paragraf lengkap yang tampil saat hover)</label>
                    <textarea
                      rows={3}
                      className="admin-textarea"
                      value={service.details || ""}
                      placeholder="Jelaskan workflow, integrasi, dan keunggulan solusi yang Anda tawarkan..."
                      onChange={(e) => {
                        const copy = [...(profileForm.services || [])];
                        copy[index] = { ...copy[index], details: e.target.value };
                        setProfileForm({ ...profileForm, services: copy });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* =========================================================================
              TAB: PROJECTS / PORTOFOLIO
             ========================================================================= */}
          {activeTab === "projects" && (
            <div>
              <div className="admin-tab-header">
                <div>
                  <h2>Proyek & Portofolio ({projects.length})</h2>
                  <p>Tambah, edit, hapus, dan atur urutan tampilan proyek unggulan Anda</p>
                </div>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={handleOpenAddProject}
                >
                  <FiPlus />
                  <span>Tambah Proyek Baru</span>
                </button>
              </div>

              {/* Search & Category Filter Bar */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "center",
                  marginBottom: "24px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    flex: "1",
                    minWidth: "240px",
                  }}
                >
                  <FiSearch
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  />
                  <input
                    type="text"
                    className="admin-input"
                    style={{ paddingLeft: "40px" }}
                    placeholder="Cari judul proyek, kategori, atau teknologi..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {["All", "Web App", "UI/UX", "Mobile App", "Graphic Design", "Video"].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`admin-btn-secondary ${
                          projectCategoryFilter === cat ? "active" : ""
                        }`}
                        style={{
                          background:
                            projectCategoryFilter === cat
                              ? "rgba(255, 122, 0, 0.22)"
                              : undefined,
                          borderColor:
                            projectCategoryFilter === cat
                              ? "#ff7a00"
                              : undefined,
                        }}
                        onClick={() => setProjectCategoryFilter(cat)}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Projects Grid */}
              <div className="admin-projects-grid">
                {filteredProjects.map((proj, idx) => (
                  <div className="admin-project-card" key={proj.slug || idx}>
                    <div className="admin-project-thumb">
                      <img
                        src={proj.thumbnail || "/images/mypicnbg.png"}
                        alt={proj.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/mypicnbg.png";
                        }}
                      />
                      <span className="admin-project-category-badge">{proj.category}</span>
                      <span className="admin-project-year-badge">{proj.year}</span>
                    </div>

                    <div className="admin-project-content">
                      <h3 className="admin-project-title">{proj.title}</h3>
                      <p className="admin-project-desc">{proj.description}</p>

                      <div className="admin-project-tags">
                        {(proj.stack || []).slice(0, 4).map((tech, sIdx) => (
                          <span className="admin-project-tag" key={sIdx}>
                            {tech}
                          </span>
                        ))}
                        {(proj.stack || []).length > 4 && (
                          <span className="admin-project-tag">
                            +{(proj.stack || []).length - 4}
                          </span>
                        )}
                      </div>

                      <div className="admin-project-actions">
                        <div className="admin-icon-btn-group">
                          <button
                            type="button"
                            className="admin-icon-btn"
                            disabled={idx === 0}
                            onClick={() => reorderProjects(idx, idx - 1)}
                            title="Pindah ke Atas"
                          >
                            <FiArrowUp />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            disabled={idx === projects.length - 1}
                            onClick={() => reorderProjects(idx, idx + 1)}
                            title="Pindah ke Bawah"
                          >
                            <FiArrowDown />
                          </button>
                        </div>

                        <div className="admin-icon-btn-group">
                          {proj.demo && (
                            <a
                              href={proj.demo}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-icon-btn"
                              title="Buka Demo"
                            >
                              <FiExternalLink />
                            </a>
                          )}
                          <button
                            type="button"
                            className="admin-icon-btn"
                            onClick={() => handleOpenEditProject(idx)}
                            title="Edit Proyek"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn danger"
                            onClick={() => {
                              if (confirm(`Hapus proyek "${proj.title}"?`)) {
                                deleteProject(idx);
                                showToast("Proyek berhasil dihapus");
                              }
                            }}
                            title="Hapus Proyek"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: EXPERIENCE / KARIR
             ========================================================================= */}
          {activeTab === "experience" && (
            <div>
              <div className="admin-tab-header">
                <div>
                  <h2>Pengalaman & Rekam Karir ({experience.length})</h2>
                  <p>Kelola perjalanan karir, posisi, perusahaan, dan pencapaian profesional Anda</p>
                </div>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={handleOpenAddExp}
                >
                  <FiPlus />
                  <span>Tambah Pengalaman</span>
                </button>
              </div>

              <div className="admin-exp-list">
                {experience.map((exp, idx) => (
                  <div className="admin-exp-card" key={idx}>
                    <div style={{ flex: 1 }}>
                      <h3 className="admin-exp-role">{exp.role}</h3>
                      <div className="admin-exp-company">{exp.company}</div>
                      <div className="admin-exp-meta">
                        <span>🗓️ {exp.period}</span>
                        <span>📍 {exp.location}</span>
                      </div>

                      <ul className="admin-exp-highlights">
                        {(exp.highlights || []).map((h, hIdx) => (
                          <li key={hIdx}>{h}</li>
                        ))}
                      </ul>

                      <div className="admin-chips-container" style={{ minHeight: "auto" }}>
                        {(exp.tags || []).map((tag, tIdx) => (
                          <span className="admin-chip" key={tIdx}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="admin-icon-btn-group" style={{ alignSelf: "flex-start" }}>
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => handleOpenEditExp(idx)}
                        title="Edit Pengalaman"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn danger"
                        onClick={() => {
                          if (confirm(`Hapus pengalaman di "${exp.company}"?`)) {
                            deleteExperience(idx);
                            showToast("Pengalaman dihapus");
                          }
                        }}
                        title="Hapus Pengalaman"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: SKILLS & TOOLS
             ========================================================================= */}
          {activeTab === "skills" && (
            <div>
              <div className="admin-tab-header">
                <div>
                  <h2>Keahlian, Framework & Tools ({skills.length} Kategori)</h2>
                  <p>Atur kategori keahlian dan tambahkan tag tools yang Anda kuasai</p>
                </div>
              </div>

              {/* Add New Category Box */}
              <div className="admin-card">
                <div className="admin-card-title">Tambah Kategori Keahlian Baru</div>
                <div className="admin-grid-2">
                  <div className="admin-form-group">
                    <label>Nama Kategori (English)</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g. AI & Machine Learning"
                      value={newCategoryEn}
                      onChange={(e) => setNewCategoryEn(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Nama Kategori (Bahasa Indonesia)</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g. AI & Pembelajaran Mesin"
                      value={newCategoryId}
                      onChange={(e) => setNewCategoryId(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    if (!newCategoryEn.trim()) return;
                    addSkillCategory(newCategoryEn, newCategoryId || newCategoryEn);
                    setNewCategoryEn("");
                    setNewCategoryId("");
                    showToast("Kategori baru ditambahkan!");
                  }}
                >
                  <FiPlus />
                  <span>Tambahkan Kategori</span>
                </button>
              </div>

              {/* Existing Categories */}
              {skills.map((category, catIdx) => (
                <div className="admin-card" key={catIdx}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <div className="admin-card-title" style={{ margin: 0 }}>
                      <span className="badge">Kategori {catIdx + 1}</span>
                      {category.category?.en} / {category.category?.id}
                    </div>

                    <button
                      type="button"
                      className="admin-btn-danger"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => {
                        if (
                          confirm(
                            `Hapus seluruh kategori "${category.category?.en}"?`
                          )
                        ) {
                          removeSkillCategory(catIdx);
                          showToast("Kategori berhasil dihapus");
                        }
                      }}
                    >
                      <FiTrash2 />
                      <span>Hapus Kategori</span>
                    </button>
                  </div>

                  <div className="admin-chips-container">
                    {(category.items || []).map((skill, sIdx) => (
                      <span className="admin-chip" key={sIdx}>
                        {skill}
                        <button
                          type="button"
                          className="admin-chip-remove"
                          onClick={() => removeSkill(catIdx, sIdx)}
                        >
                          <FiX />
                        </button>
                      </span>
                    ))}

                    <div className="admin-chip-add-wrap">
                      <input
                        type="text"
                        placeholder="+ Tambah skill"
                        className="admin-chip-input"
                        value={skillInputs[catIdx] || ""}
                        onChange={(e) =>
                          setSkillInputs({
                            ...skillInputs,
                            [catIdx]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = skillInputs[catIdx]?.trim();
                            if (val) {
                              addSkill(catIdx, val);
                              setSkillInputs({ ...skillInputs, [catIdx]: "" });
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ padding: "6px 10px" }}
                        onClick={() => {
                          const val = skillInputs[catIdx]?.trim();
                          if (val) {
                            addSkill(catIdx, val);
                            setSkillInputs({ ...skillInputs, [catIdx]: "" });
                          }
                        }}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* =========================================================================
              TAB: SETTINGS & BACKUP
             ========================================================================= */}
          {activeTab === "settings" && (
            <div>
              <div className="admin-tab-header">
                <div>
                  <h2>Akun, Keamanan & Backup Data</h2>
                  <p>Ekspor seluruh data portofolio ke file JSON, pulihkan cadangan, dan amankan akun admin</p>
                </div>
              </div>

              {/* Supabase Backend Integration */}
              <div
                className="admin-card"
                style={{
                  borderColor: isSupabaseConnected
                    ? "rgba(16, 185, 129, 0.4)"
                    : "rgba(255, 140, 20, 0.3)",
                }}
              >
                <div className="admin-card-title">
                  <FiLayers
                    style={{
                      color: isSupabaseConnected ? "#10b981" : "#ff7a00",
                    }}
                  />
                  Integrasi Backend Database Supabase
                  {isSupabaseConnected ? (
                    <span
                      className="badge"
                      style={{
                        background: "rgba(16, 185, 129, 0.2)",
                        color: "#34d399",
                      }}
                    >
                      ● Terkoneksi
                    </span>
                  ) : (
                    <span
                      className="badge"
                      style={{
                        background: "rgba(245, 158, 11, 0.2)",
                        color: "#fbbf24",
                      }}
                    >
                      Mode Offline / Lokal
                    </span>
                  )}
                </div>

                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    marginBottom: "16px",
                  }}
                >
                  Portofolio ini mendukung sinkronisasi cloud dengan <strong>Supabase</strong> (Database PostgreSQL, Storage Bucket, dan sinkronisasi real-time). Anda dapat memasukkan URL dan API Key langsung di bawah ini tanpa perlu mengedit file secara manual.
                </p>

                {/* Form Input URL & Anon Key */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: "20px",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    marginBottom: "16px",
                  }}
                >
                  <div className="admin-grid-2">
                    <div className="admin-form-group">
                      <label>Supabase Project URL</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="Contoh: https://xyzcompany.supabase.co"
                        value={supabaseUrlInput}
                        onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Supabase Anon Public Key</label>
                      <input
                        type="password"
                        className="admin-input"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={supabaseKeyInput}
                        onChange={(e) => setSupabaseKeyInput(e.target.value)}
                      />
                    </div>
                  </div>

                  {supabaseTestMsg && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        fontSize: "12.5px",
                        marginBottom: "14px",
                        background: supabaseTestMsg.success
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                        border: `1px solid ${
                          supabaseTestMsg.success
                            ? "rgba(16, 185, 129, 0.3)"
                            : "rgba(239, 68, 68, 0.3)"
                        }`,
                        color: supabaseTestMsg.success ? "#6ee7b7" : "#fca5a5",
                      }}
                    >
                      {supabaseTestMsg.message}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => {
                        if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
                          showToast("Harap isi Project URL dan Anon Key Supabase.");
                          return;
                        }
                        const ok = saveSupabaseSettings(supabaseUrlInput, supabaseKeyInput);
                        if (ok) {
                          showToast("Kredensial Supabase berhasil disimpan!");
                          testSupabase(supabaseUrlInput, supabaseKeyInput).then((res) => {
                            setSupabaseTestMsg(res);
                          });
                        } else {
                          showToast("Format URL atau Anon Key Supabase tidak valid.");
                        }
                      }}
                    >
                      <FiSave />
                      <span>Simpan Kredensial Supabase</span>
                    </button>

                    <button
                      type="button"
                      className="admin-btn-secondary"
                      disabled={isTestingSupabase}
                      onClick={async () => {
                        setIsTestingSupabase(true);
                        setSupabaseTestMsg(null);
                        const res = await testSupabase(supabaseUrlInput, supabaseKeyInput);
                        setIsTestingSupabase(false);
                        setSupabaseTestMsg(res);
                        showToast(res.message);
                      }}
                    >
                      <FiRefreshCw className={isTestingSupabase ? "admin-spin" : ""} />
                      <span>{isTestingSupabase ? "Menguji..." : "Tes Koneksi"}</span>
                    </button>

                    {supabaseConfig.source === "custom" && (
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                        onClick={() => {
                          clearSupabaseSettings();
                          setSupabaseUrlInput("");
                          setSupabaseKeyInput("");
                          setSupabaseTestMsg(null);
                          showToast("Kredensial Supabase kustom dihapus.");
                        }}
                      >
                        <FiTrash2 />
                        <span>Hapus Kredensial</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tombol Sinkronisasi Seluruh Data */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      borderColor: "rgba(16, 185, 129, 0.4)",
                    }}
                    disabled={isSyncingSupabase}
                    onClick={async () => {
                      setIsSyncingSupabase(true);
                      showToast("Menyinkronkan Profil, Proyek, Pengalaman, dan Skill ke Supabase...");
                      const success = await syncWithSupabase();
                      setIsSyncingSupabase(false);
                      if (success) {
                        showToast("Sinkronisasi database Supabase berhasil!");
                      } else {
                        showToast("Gagal sinkronisasi. Pastikan kredensial Supabase valid dan tabel sudah dibuat.");
                      }
                    }}
                  >
                    <FiRefreshCw className={isSyncingSupabase ? "admin-spin" : ""} />
                    <span>
                      {isSyncingSupabase
                        ? "Menyinkronkan..."
                        : "Sinkronkan Seluruh Data (Profil, Proyek, Karir, Skill)"}
                    </span>
                  </button>
                </div>

                <div
                  style={{
                    background: "rgba(0,0,0,0.35)",
                    padding: "16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: "16px",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 8px",
                      fontSize: "13px",
                      color: "#c084fc",
                    }}
                  >
                    Panduan Setup Database Supabase:
                  </h4>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: "18px",
                      fontSize: "12.5px",
                      color: "rgba(255,255,255,0.75)",
                      lineHeight: "1.7",
                    }}
                  >
                    <li>Buat akun dan project baru secara gratis di <strong>supabase.com</strong>.</li>
                    <li>Buka menu <strong>SQL Editor</strong> di dashboard Supabase Anda.</li>
                    <li>Jalankan skrip <code>supabase_schema.sql</code> yang sudah disiapkan di root folder proyek ini.</li>
                    <li>Salin <strong>Project URL</strong> dan <strong>Anon Public Key</strong> dari menu <em>Project Settings → API</em>.</li>
                    <li>Tempelkan ke form input di atas dan klik <strong>Simpan Kredensial Supabase</strong>.</li>
                  </ol>
                </div>
              </div>

              {/* Backup & Restore */}
              <div className="admin-card">
                <div className="admin-card-title">
                  <FiDownload style={{ color: "#ff7a00" }} />
                  Ekspor & Cadangkan Data Portofolio
                </div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "16px" }}>
                  Unduh seluruh konfigurasi portofolio Anda (Profil, Proyek, Pengalaman, Skill, dan Pengaturan 3D Lanyard) ke dalam satu file JSON untuk disimpan dengan aman.
                </p>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    const json = exportJSON();
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `backup-portofolio-dhatin-${new Date()
                      .toISOString()
                      .slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast("File backup berhasil diunduh!");
                  }}
                >
                  <FiDownload />
                  <span>Download Backup Portofolio (.json)</span>
                </button>
              </div>

              {/* Import Restore */}
              <div className="admin-card">
                <div className="admin-card-title">
                  <FiUpload style={{ color: "#3b82f6" }} />
                  Pulihkan dari File Backup JSON
                </div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "16px" }}>
                  Unggah file JSON cadangan atau tempel teks JSON untuk memulihkan seluruh data portofolio.
                </p>

                <div className="admin-form-group">
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const content = ev.target?.result as string;
                        const success = importJSON(content);
                        if (success) {
                          showToast("Data portofolio berhasil dipulihkan!");
                        } else {
                          showToast("Gagal mengimpor file JSON, format tidak valid");
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </div>

                <div className="admin-form-group" style={{ marginTop: "12px" }}>
                  <label>Atau Tempel JSON Di Sini:</label>
                  <textarea
                    rows={4}
                    className="admin-textarea"
                    placeholder="Tempel format JSON portofolio Anda di sini..."
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={!importJsonText.trim()}
                  onClick={() => {
                    const success = importJSON(importJsonText);
                    if (success) {
                      setImportJsonText("");
                      showToast("Data berhasil diimpor!");
                    } else {
                      showToast("Format JSON tidak valid!");
                    }
                  }}
                >
                  <FiUpload />
                  <span>Terapkan JSON</span>
                </button>
              </div>

              {/* Credentials */}
              <div className="admin-card">
                <div className="admin-card-title">
                  <FiSettings style={{ color: "#10b981" }} />
                  Kredensial Login Admin
                </div>
                <div className="admin-grid-2">
                  <div className="admin-form-group">
                    <label>Username Baru</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Password Baru</label>
                    <input
                      type="password"
                      className="admin-input"
                      placeholder="Masukkan password baru"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    if (!newUsername.trim() || !newPassword) {
                      showToast("Username dan password tidak boleh kosong");
                      return;
                    }
                    changeCredentials(newUsername, newPassword);
                    setNewPassword("");
                    showToast("Kredensial admin berhasil diperbarui!");
                  }}
                >
                  <FiSave />
                  <span>Simpan Kredensial Baru</span>
                </button>
              </div>

              {/* Reset to Factory Defaults */}
              <div
                className="admin-card"
                style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}
              >
                <div className="admin-card-title" style={{ color: "#f87171" }}>
                  <FiAlertTriangle />
                  Reset ke Data Asli (Default)
                </div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "16px" }}>
                  Tindakan ini akan mengembalikan data profil, foto, proyek, dan karir ke data bawaan awal repositori.
                </p>

                {isResetConfirmOpen ? (
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      type="button"
                      className="admin-btn-danger"
                      onClick={() => {
                        resetToDefaults();
                        setIsResetConfirmOpen(false);
                        showToast("Data portofolio telah direset ke default!");
                      }}
                    >
                      <FiRefreshCw />
                      <span>Ya, Hapus dan Reset Sekarang</span>
                    </button>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => setIsResetConfirmOpen(false)}
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={() => setIsResetConfirmOpen(true)}
                  >
                    <FiRefreshCw />
                    <span>Reset Data Portofolio ke Default</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Add/Edit Modal */}
      {isProjectModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={() => setIsProjectModalOpen(false)}
        >
          <div
            className="admin-login-card"
            style={{ maxWidth: "650px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="admin-close-btn"
              onClick={() => setIsProjectModalOpen(false)}
            >
              <FiX />
            </button>

            <div className="admin-login-header" style={{ textAlign: "left", marginBottom: "20px" }}>
              <h3>{editingProjectIndex !== null ? "Edit Proyek" : "Tambah Proyek Baru"}</h3>
              <p>Lengkapi informasi proyek untuk ditampilkan di portofolio</p>
            </div>

            <form onSubmit={handleSaveProject}>
              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label>Judul Proyek</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Contoh: PPDB Online System"
                    value={projectForm.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      const slug = val
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "");
                      setProjectForm({
                        ...projectForm,
                        title: val,
                        slug: projectForm.slug || slug,
                      });
                    }}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Slug URL</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={projectForm.slug}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, slug: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label>Kategori</label>
                  <select
                    className="admin-input"
                    value={projectForm.category}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, category: e.target.value })
                    }
                  >
                    <option value="Web App">Web App</option>
                    <option value="UI/UX">UI/UX Design</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Graphic Design">Graphic Design</option>
                    <option value="Video">Video Editing</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Tahun Rilis</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={projectForm.year}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        year: parseInt(e.target.value) || new Date().getFullYear(),
                      })
                    }
                  />
                </div>
              </div>

              {/* Thumbnail with Upload & Preview */}
              <div className="admin-form-group">
                <label>Thumbnail / Cover Proyek</label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
                  {projectForm.thumbnail && (
                    <img
                      src={projectForm.thumbnail}
                      alt="Thumbnail Preview"
                      style={{
                        width: "60px",
                        height: "45px",
                        borderRadius: "8px",
                        objectFit: "cover",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    />
                  )}
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="URL gambar atau /images/..."
                    value={projectForm.thumbnail}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, thumbnail: e.target.value })
                    }
                  />
                  <label
                    className="admin-btn-secondary"
                    style={{ cursor: "pointer", flexShrink: 0 }}
                  >
                    <FiUpload />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProjectThumbUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label>Demo Link (Live Website)</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="https://..."
                    value={projectForm.demo}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, demo: e.target.value })
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label>Repository GitHub</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="https://github.com/..."
                    value={projectForm.repo}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, repo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Deskripsi Lengkap Proyek</label>
                <textarea
                  rows={3}
                  className="admin-textarea"
                  placeholder="Jelaskan tujuan proyek, masalah yang diselesaikan, dan dampak fitur..."
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, description: e.target.value })
                  }
                />
              </div>

              {/* Tech Stack Chips */}
              <div className="admin-form-group">
                <label>Tech Stack & Tools yang Digunakan</label>
                <div className="admin-chips-container">
                  {(projectForm.stack || []).map((tag, idx) => (
                    <span className="admin-chip" key={idx}>
                      {tag}
                      <button
                        type="button"
                        className="admin-chip-remove"
                        onClick={() => handleRemoveStackTag(idx)}
                      >
                        <FiX />
                      </button>
                    </span>
                  ))}
                  <div className="admin-chip-add-wrap">
                    <input
                      type="text"
                      placeholder="+ Tambah tech"
                      className="admin-chip-input"
                      value={newStackTag}
                      onChange={(e) => setNewStackTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddStackTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ padding: "6px 10px" }}
                      onClick={() => handleAddStackTag()}
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>

                {/* Quick Tech Suggestions */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                  {["React.js", "TypeScript", "Node.js", "Tailwind", "Supabase", "PHP", "MySQL", "Figma", "Premiere Pro"].map(
                    (tech) => (
                      <button
                        key={tech}
                        type="button"
                        className="admin-preset-btn"
                        style={{ padding: "4px 8px", fontSize: "11px" }}
                        onClick={() => handleAddStackTag(tech)}
                      >
                        +{tech}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button type="submit" className="admin-btn-primary" style={{ flex: 1 }}>
                  <FiCheck />
                  <span>Simpan Proyek</span>
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setIsProjectModalOpen(false)}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Experience Add/Edit Modal */}
      {isExpModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={() => setIsExpModalOpen(false)}
        >
          <div
            className="admin-login-card"
            style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="admin-close-btn"
              onClick={() => setIsExpModalOpen(false)}
            >
              <FiX />
            </button>

            <div className="admin-login-header" style={{ textAlign: "left", marginBottom: "20px" }}>
              <h3>{editingExpIndex !== null ? "Edit Pengalaman" : "Tambah Pengalaman Baru"}</h3>
              <p>Tambahkan peran kerja, institusi, dan pencapaian Anda</p>
            </div>

            <form onSubmit={handleSaveExp}>
              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label>Posisi / Role</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Contoh: Web Developer Intern"
                    value={expForm.role}
                    onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Perusahaan / Klien</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Contoh: Diskominfo Kota Bandung"
                    value={expForm.company}
                    onChange={(e) =>
                      setExpForm({ ...expForm, company: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label>Periode Waktu</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Contoh: 2024 – Sekarang"
                    value={expForm.period}
                    onChange={(e) =>
                      setExpForm({ ...expForm, period: e.target.value })
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label>Lokasi</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Contoh: Bandung, Indonesia"
                    value={expForm.location}
                    onChange={(e) =>
                      setExpForm({ ...expForm, location: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Highlights Multi-line */}
              <div className="admin-form-group">
                <label>Poin-poin Tanggung Jawab & Pencapaian</label>
                {(expForm.highlights || []).map((h, idx) => (
                  <div
                    key={idx}
                    style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
                  >
                    <input
                      type="text"
                      className="admin-input"
                      placeholder={`Poin pencapaian ${idx + 1}`}
                      value={h}
                      onChange={(e) =>
                        handleUpdateHighlightLine(idx, e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="admin-icon-btn danger"
                      onClick={() => handleRemoveHighlightLine(idx)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="admin-btn-secondary"
                  style={{ marginTop: "6px" }}
                  onClick={handleAddHighlightLine}
                >
                  <FiPlus />
                  <span>Tambah Baris Poin</span>
                </button>
              </div>

              {/* Tags */}
              <div className="admin-form-group">
                <label>Tags Teknologi / Keahlian</label>
                <div className="admin-chips-container">
                  {(expForm.tags || []).map((tag, idx) => (
                    <span className="admin-chip" key={idx}>
                      {tag}
                      <button
                        type="button"
                        className="admin-chip-remove"
                        onClick={() => handleRemoveExpTag(idx)}
                      >
                        <FiX />
                      </button>
                    </span>
                  ))}
                  <div className="admin-chip-add-wrap">
                    <input
                      type="text"
                      placeholder="+ Tambah tag"
                      className="admin-chip-input"
                      value={newExpTag}
                      onChange={(e) => setNewExpTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddExpTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ padding: "6px 10px" }}
                      onClick={handleAddExpTag}
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button type="submit" className="admin-btn-primary" style={{ flex: 1 }}>
                  <FiCheck />
                  <span>Simpan Pengalaman</span>
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setIsExpModalOpen(false)}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="admin-toast success">
          <FiCheck />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
