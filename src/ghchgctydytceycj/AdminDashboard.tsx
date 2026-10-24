import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFolder,
  FiUser,
  FiDatabase,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiGithub,
  FiArrowUp,
  FiArrowDown,
  FiSearch,
  FiX,
  FiCheck,
  FiUploadCloud,
  FiRefreshCw,
  FiLogOut,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { usePortfolio } from "../context/PortfolioContext";
import { ProjectData } from "../types/portfolio";
import { uploadImageToSupabaseStorage } from "../lib/supabase";
import "./styles/AdminSimple.css";

export interface AdminDashboardProps {
  isStandalonePage?: boolean;
}

type TabType = "projects" | "profile" | "database";

const CATEGORY_PRESETS = [
  "Web App",
  "Full-Stack",
  "UI/UX Design",
  "Graphic Design",
  "Mobile App",
  "Video Editing",
];

const STACK_PRESETS = [
  "React.js",
  "TypeScript",
  "Node.js",
  "Next.js",
  "Tailwind CSS",
  "Supabase",
  "Python",
  "Figma",
];

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const navigate = useNavigate();
  const {
    profile,
    projects,
    updateProfile,
    addProject,
    updateProject,
    deleteProject,
    reorderProjects,
    isSupabaseConnected,
    supabaseConfig,
    saveSupabaseSettings,
    clearSupabaseSettings,
    testSupabase,
    syncWithSupabase,
    logout,
  } = usePortfolio();

  // Active Tab: Default to "projects" as requested
  const [activeTab, setActiveTab] = useState<TabType>("projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Project Modal & Form State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [customStackInput, setCustomStackInput] = useState("");

  const [projectForm, setProjectForm] = useState<ProjectData>({
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

  // --- Profile Form State ---
  const [profileName, setProfileName] = useState(profile.name || "");
  const [profileRole, setProfileRole] = useState(
    profile.taglines?.[0] || profile.title?.en || "Full-Stack Developer"
  );
  const [profileAbout, setProfileAbout] = useState(
    profile.about?.id || profile.about?.en || ""
  );
  const [profileEmail, setProfileEmail] = useState(profile.email || "");
  const [profileLinkedin, setProfileLinkedin] = useState(profile.linkedin || "");
  const [profileGithub, setProfileGithub] = useState(profile.github || "");

  // --- Supabase Config State ---
  const [dbUrl, setDbUrl] = useState(supabaseConfig.url || "");
  const [dbKey, setDbKey] = useState(supabaseConfig.anonKey || "");
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // --- Project CRUD Operations ---
  const handleOpenAddProject = () => {
    setEditingIndex(null);
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
    setCustomStackInput("");
    setIsModalOpen(true);
  };

  const handleOpenEditProject = (index: number) => {
    setEditingIndex(index);
    setProjectForm({ ...projects[index] });
    setCustomStackInput("");
    setIsModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) {
      showToast("Judul proyek tidak boleh kosong!");
      return;
    }

    const payload: ProjectData = {
      ...projectForm,
      slug:
        projectForm.slug?.trim() ||
        projectForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      year: Number(projectForm.year) || new Date().getFullYear(),
    };

    if (editingIndex !== null) {
      updateProject(editingIndex, payload);
      showToast("Proyek berhasil diperbarui!");
    } else {
      addProject(payload);
      showToast("Proyek baru berhasil ditambahkan!");
    }

    setIsModalOpen(false);
  };

  const handleDeleteProject = (index: number, title: string) => {
    if (confirm(`Yakin ingin menghapus proyek "${title}"?`)) {
      deleteProject(index);
      showToast("Proyek telah dihapus!");
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderProjects(index, index - 1);
      showToast("Urutan proyek dipindahkan ke atas!");
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < projects.length - 1) {
      reorderProjects(index, index + 1);
      showToast("Urutan proyek dipindahkan ke bawah!");
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumb(true);
    try {
      // Coba upload ke Supabase Storage terlebih dahulu jika terhubung
      if (isSupabaseConnected) {
        const publicUrl = await uploadImageToSupabaseStorage(file, "projects");
        if (publicUrl) {
          setProjectForm((prev) => ({ ...prev, thumbnail: publicUrl }));
          showToast("Gambar berhasil diupload ke Supabase Storage!");
          setIsUploadingThumb(false);
          return;
        }
      }

      // Fallback ke FileReader lokal (Data URL) jika Supabase offline
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setProjectForm((prev) => ({ ...prev, thumbnail: dataUrl }));
        showToast("Gambar berhasil dimuat!");
        setIsUploadingThumb(false);
      };
      reader.readAsDataURL(file);
    } catch {
      showToast("Gagal memproses gambar!");
      setIsUploadingThumb(false);
    }
  };

  const handleAddStackTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (projectForm.stack.includes(trimmed)) return;
    setProjectForm((prev) => ({
      ...prev,
      stack: [...prev.stack, trimmed],
    }));
    setCustomStackInput("");
  };

  const handleRemoveStackTag = (idx: number) => {
    setProjectForm((prev) => ({
      ...prev,
      stack: prev.stack.filter((_, i) => i !== idx),
    }));
  };

  // --- Profile Save ---
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...profile,
      name: profileName.trim(),
      taglines: [profileRole.trim()],
      title: { en: profileRole.trim(), id: profileRole.trim() },
      about: { en: profileAbout, id: profileAbout },
      email: profileEmail.trim(),
      linkedin: profileLinkedin.trim(),
      github: profileGithub.trim(),
    });
    showToast("Data profil berhasil diperbarui!");
  };

  // --- Database Settings ---
  const handleTestAndSaveDb = async () => {
    if (!dbUrl.trim() || !dbKey.trim()) {
      showToast("URL dan Anon Key Supabase wajib diisi!");
      return;
    }
    setIsTestingDb(true);
    setDbStatusMsg(null);
    try {
      const ok = await testSupabase(dbUrl.trim(), dbKey.trim());
      setIsTestingDb(false);
      if (ok) {
        saveSupabaseSettings(dbUrl.trim(), dbKey.trim());
        setDbStatusMsg({
          success: true,
          text: "Koneksi berhasil! Pengaturan telah disimpan.",
        });
        showToast("Supabase terhubung dengan sukses!");
      } else {
        setDbStatusMsg({
          success: false,
          text: "Koneksi gagal. Periksa URL dan Anon Key Anda.",
        });
        showToast("Koneksi Supabase gagal!");
      }
    } catch {
      setIsTestingDb(false);
      setDbStatusMsg({
        success: false,
        text: "Terjadi error saat menghubungi Supabase.",
      });
    }
  };

  const handleSyncDb = async () => {
    setIsSyncingDb(true);
    try {
      await syncWithSupabase();
      setIsSyncingDb(false);
      showToast("Sinkronisasi database berhasil!");
    } catch {
      setIsSyncingDb(false);
      showToast("Sinkronisasi gagal. Coba lagi nanti.");
    }
  };

  const handleDisconnectDb = () => {
    if (confirm("Yakin ingin memutuskan koneksi Supabase? Data akan kembali ke mode lokal browser.")) {
      clearSupabaseSettings();
      setDbUrl("");
      setDbKey("");
      setDbStatusMsg(null);
      showToast("Koneksi database telah diputuskan.");
    }
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = p.title.toLowerCase().includes(q);
    const categoryMatch = p.category.toLowerCase().includes(q);
    const stackMatch = p.stack?.some((s) => s.toLowerCase().includes(q));
    return titleMatch || categoryMatch || stackMatch;
  });

  return (
    <div className="admin-simple-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast">
          <FiCheck className="toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="admin-topbar">
        <div className="admin-brand">
          <div className="brand-dot"></div>
          <div>
            <h1 className="brand-title">Admin Portofolio</h1>
            <p className="brand-subtitle">Panel Pengelolaan Portofolio & Proyek</p>
          </div>
        </div>

        <div className="admin-topbar-actions">
          {/* Status Badge */}
          <div
            className={`admin-status-pill ${
              isSupabaseConnected ? "status-online" : "status-offline"
            }`}
          >
            <span className="status-indicator"></span>
            <span>
              {isSupabaseConnected ? "Supabase Online" : "Mode Browser (Lokal)"}
            </span>
          </div>

          <button
            className="btn-header-secondary"
            onClick={() => navigate("/")}
            title="Buka Website Portofolio"
          >
            <FiArrowLeft />
            <span>Ke Website</span>
          </button>

          <button
            className="btn-header-danger"
            onClick={() => logout()}
            title="Keluar dari Admin"
          >
            <FiLogOut />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs (Hanya 3 Menu Sederhana) */}
      <nav className="admin-tabs-nav">
        <button
          className={`tab-btn ${activeTab === "projects" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          <FiFolder className="tab-icon" />
          <span>Kelola Proyek ({projects.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "profile" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <FiUser className="tab-icon" />
          <span>Profil Singkat</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "database" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("database")}
        >
          <FiDatabase className="tab-icon" />
          <span>Koneksi Database</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="admin-main-container">
        {/* ============================================================== */}
        {/* TAB 1: KELOLA PROYEK (CRUD PROJECT)                           */}
        {/* ============================================================== */}
        {activeTab === "projects" && (
          <section className="admin-tab-pane">
            {/* Action Bar: Search & Add Button */}
            <div className="projects-toolbar">
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Cari nama proyek, teknologi, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="clear-search-btn"
                    onClick={() => setSearchQuery("")}
                  >
                    <FiX />
                  </button>
                )}
              </div>

              <button
                className="btn-add-primary"
                onClick={handleOpenAddProject}
              >
                <FiPlus className="btn-icon" />
                <span>+ Tambah Proyek Baru</span>
              </button>
            </div>

            {/* Project List / Cards */}
            {filteredProjects.length === 0 ? (
              <div className="empty-projects-state">
                <FiFolder className="empty-icon" />
                <h3>Tidak ada proyek ditemukan</h3>
                <p>
                  {searchQuery
                    ? `Tidak ada proyek yang cocok dengan kata kunci "${searchQuery}".`
                    : "Belum ada proyek yang tersimpan. Klik tombol di bawah untuk menambahkan proyek pertama Anda!"}
                </p>
                <button
                  className="btn-add-primary"
                  onClick={handleOpenAddProject}
                >
                  <FiPlus />
                  <span>Tambah Proyek Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="projects-grid">
                {filteredProjects.map((proj, idx) => (
                  <article key={proj.id || proj.slug || idx} className="project-card">
                    {/* Thumbnail Image */}
                    <div className="card-thumb-wrap">
                      <img
                        src={proj.thumbnail || "/images/mypicnbg.png"}
                        alt={proj.title}
                        className="card-thumb"
                        onError={(e) => {
                          e.currentTarget.src = "/images/mypicnbg.png";
                        }}
                      />
                      <span className="card-category-badge">{proj.category}</span>
                    </div>

                    {/* Card Content */}
                    <div className="card-body">
                      <div className="card-title-row">
                        <h3 className="card-title">{proj.title}</h3>
                        <span className="card-year">{proj.year || "2026"}</span>
                      </div>

                      <p className="card-desc">
                        {proj.description || "Tidak ada deskripsi."}
                      </p>

                      {/* Tech Stack Chips */}
                      {proj.stack && proj.stack.length > 0 && (
                        <div className="card-stack-chips">
                          {proj.stack.map((item, sIdx) => (
                            <span key={sIdx} className="stack-chip">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Action Buttons */}
                    <div className="card-footer">
                      <div className="card-links">
                        {proj.demo && (
                          <a
                            href={proj.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-link-btn"
                            title="Buka Website Demo"
                          >
                            <FiExternalLink />
                            <span>Demo</span>
                          </a>
                        )}
                        {proj.repo && (
                          <a
                            href={proj.repo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-link-btn"
                            title="Buka GitHub Repo"
                          >
                            <FiGithub />
                            <span>Code</span>
                          </a>
                        )}
                      </div>

                      <div className="card-ctrls">
                        {/* Reorder Buttons */}
                        <button
                          className="ctrl-btn"
                          disabled={idx === 0}
                          onClick={() => handleMoveUp(idx)}
                          title="Geser urutan naik"
                        >
                          <FiArrowUp />
                        </button>
                        <button
                          className="ctrl-btn"
                          disabled={idx === projects.length - 1}
                          onClick={() => handleMoveDown(idx)}
                          title="Geser urutan turun"
                        >
                          <FiArrowDown />
                        </button>

                        {/* Edit Button */}
                        <button
                          className="ctrl-btn ctrl-edit"
                          onClick={() => handleOpenEditProject(idx)}
                          title="Edit Proyek"
                        >
                          <FiEdit2 />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          className="ctrl-btn ctrl-delete"
                          onClick={() => handleDeleteProject(idx, proj.title)}
                          title="Hapus Proyek"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PROFIL SINGKAT                                          */}
        {/* ============================================================== */}
        {activeTab === "profile" && (
          <section className="admin-tab-pane">
            <div className="admin-panel-card">
              <div className="panel-header">
                <h2>Profil & Biodata Utama</h2>
                <p>Perbarui informasi dasar yang tampil di beranda dan bagian About Me.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="simple-form">
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Contoh: Dhatin Nuril Arsandy"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Profesi / Title Utama</label>
                  <input
                    type="text"
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    placeholder="Contoh: Full-Stack Developer"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Deskripsi Singkat (About Me)</label>
                  <textarea
                    rows={4}
                    value={profileAbout}
                    onChange={(e) => setProfileAbout(e.target.value)}
                    placeholder="Tuliskan deskripsi ringkas tentang Anda..."
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Email Kontak</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>URL LinkedIn</label>
                    <input
                      type="url"
                      value={profileLinkedin}
                      onChange={(e) => setProfileLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>URL GitHub</label>
                  <input
                    type="url"
                    value={profileGithub}
                    onChange={(e) => setProfileGithub(e.target.value)}
                    placeholder="https://github.com/username"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-add-primary">
                    <FiCheck />
                    <span>Simpan Perubahan Profil</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 3: KONEKSI DATABASE (SUPABASE)                            */}
        {/* ============================================================== */}
        {activeTab === "database" && (
          <section className="admin-tab-pane">
            <div className="admin-panel-card">
              <div className="panel-header">
                <h2>Koneksi Database Supabase</h2>
                <p>
                  Secara bawaan, semua data proyek dan profil Anda tersimpan aman
                  di penyimpanan browser lokal. Hubungkan ke database Supabase jika
                  Anda ingin data tersimpan secara cloud online.
                </p>
              </div>

              {/* Status Box */}
              <div
                className={`db-status-banner ${
                  isSupabaseConnected ? "banner-connected" : "banner-disconnected"
                }`}
              >
                {isSupabaseConnected ? (
                  <>
                    <FiCheckCircle className="banner-icon" />
                    <div>
                      <strong>Terhubung ke Database Cloud Supabase</strong>
                      <p>Semua perubahan proyek otomatis disinkronkan ke server online.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FiAlertCircle className="banner-icon" />
                    <div>
                      <strong>Mode Penyimpanan Lokal (Offline)</strong>
                      <p>Perubahan proyek tersimpan di browser Anda saat ini.</p>
                    </div>
                  </>
                )}
              </div>

              {dbStatusMsg && (
                <div
                  className={`db-alert ${
                    dbStatusMsg.success ? "alert-success" : "alert-error"
                  }`}
                >
                  {dbStatusMsg.success ? <FiCheck /> : <FiAlertCircle />}
                  <span>{dbStatusMsg.text}</span>
                </div>
              )}

              <div className="simple-form">
                <div className="form-group">
                  <label>Supabase Project URL</label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Supabase Anon Key</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={dbKey}
                    onChange={(e) => setDbKey(e.target.value)}
                  />
                </div>

                <div className="db-actions-row">
                  <button
                    type="button"
                    className="btn-add-primary"
                    disabled={isTestingDb}
                    onClick={handleTestAndSaveDb}
                  >
                    <FiCheck />
                    <span>{isTestingDb ? "Menguji..." : "Hubungkan & Simpan"}</span>
                  </button>

                  {isSupabaseConnected && (
                    <>
                      <button
                        type="button"
                        className="btn-header-secondary"
                        disabled={isSyncingDb}
                        onClick={handleSyncDb}
                      >
                        <FiRefreshCw className={isSyncingDb ? "spin-icon" : ""} />
                        <span>{isSyncingDb ? "Menyinkronkan..." : "Sinkronkan Data"}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-header-danger"
                        onClick={handleDisconnectDb}
                      >
                        <FiX />
                        <span>Putuskan Koneksi</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL: TAMBAH & EDIT PROYEK (SIMPLE & CLEAR FORM)             */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="admin-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <h2>
                {editingIndex !== null ? "Edit Proyek" : "Tambah Proyek Baru"}
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProject} className="modal-form">
              <div className="modal-scroll-area">
                {/* 1. Title */}
                <div className="form-group">
                  <label>
                    Judul Proyek <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: E-Commerce Store Modern"
                    value={projectForm.title}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, title: e.target.value })
                    }
                  />
                </div>

                {/* 2. Category & Year */}
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Kategori</label>
                    <input
                      type="text"
                      list="category-options"
                      placeholder="Pilih atau ketik kategori..."
                      value={projectForm.category}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          category: e.target.value,
                        })
                      }
                    />
                    <datalist id="category-options">
                      {CATEGORY_PRESETS.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label>Tahun Pembuatan</label>
                    <input
                      type="number"
                      placeholder="2026"
                      value={projectForm.year}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          year: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {/* 3. Thumbnail Image & Upload */}
                <div className="form-group">
                  <label>Gambar / Thumbnail Proyek</label>
                  <div className="thumb-preview-box">
                    <img
                      src={projectForm.thumbnail || "/images/mypicnbg.png"}
                      alt="Preview"
                      className="preview-img"
                      onError={(e) => {
                        e.currentTarget.src = "/images/mypicnbg.png";
                      }}
                    />
                    <div className="thumb-inputs">
                      <div className="upload-btn-wrap">
                        <label className="btn-upload-label">
                          <FiUploadCloud />
                          <span>
                            {isUploadingThumb ? "Mengupload..." : "Pilih File Gambar"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            disabled={isUploadingThumb}
                          />
                        </label>
                        <span className="upload-note">PNG, JPG, WebP</span>
                      </div>

                      <input
                        type="text"
                        placeholder="Atau tempel URL gambar di sini..."
                        value={projectForm.thumbnail}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            thumbnail: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Links (Demo & GitHub) */}
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Link Website / Demo</label>
                    <input
                      type="url"
                      placeholder="https://proyek-anda.com"
                      value={projectForm.demo}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, demo: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Link GitHub / Source Code</label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/repo"
                      value={projectForm.repo}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, repo: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* 5. Tech Stack Tags */}
                <div className="form-group">
                  <label>Teknologi yang Digunakan (Tech Stack)</label>
                  
                  {/* Selected Tags */}
                  <div className="tags-chips-container">
                    {projectForm.stack?.map((tag, idx) => (
                      <span key={idx} className="tag-pill">
                        <span>{tag}</span>
                        <button
                          type="button"
                          className="tag-remove-btn"
                          onClick={() => handleRemoveStackTag(idx)}
                        >
                          <FiX />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Input Add Tag */}
                  <div className="add-tag-row">
                    <input
                      type="text"
                      placeholder="Ketik teknologi (contoh: Next.js) lalu Enter..."
                      value={customStackInput}
                      onChange={(e) => setCustomStackInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddStackTag(customStackInput);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-add-tag"
                      onClick={() => handleAddStackTag(customStackInput)}
                    >
                      + Tambah
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="quick-presets">
                    <span className="presets-label">Pilihan Cepat:</span>
                    {STACK_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className="preset-btn"
                        onClick={() => handleAddStackTag(preset)}
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Description */}
                <div className="form-group">
                  <label>Deskripsi Singkat Proyek</label>
                  <textarea
                    rows={4}
                    placeholder="Ceritakan fitur utama dan tujuan pembuatan proyek ini..."
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-add-primary">
                  <FiCheck />
                  <span>
                    {editingIndex !== null
                      ? "Simpan Perubahan"
                      : "Tambahkan Proyek"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
