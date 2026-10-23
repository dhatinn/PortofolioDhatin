import { profile as defaultProfile } from "./data/profile";
import { experience as defaultExperience } from "./data/experience";
import { projects as defaultProjects } from "./data/projects";
import { skills as defaultSkills } from "./data/skills";
import {
  ProfileData,
  ProjectData,
  ExperienceData,
  SkillCategoryData,
  PortfolioConfig,
} from "./types/portfolio";

export const PLACEHOLDER_IMAGE = "/images/placeholder.webp";

export const buildConfig = (
  p: ProfileData = defaultProfile,
  exp: ExperienceData[] = defaultExperience,
  proj: ProjectData[] = defaultProjects,
  sk: SkillCategoryData[] = defaultSkills,
  lang: "id" | "en" = "id"
): PortfolioConfig => {
  const nameParts = (p.name || "Dhatin").trim().split(/\s+/);
  const initials = nameParts
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const skillItems = (enCat: string) =>
    sk.find((s) => s.category?.en?.toLowerCase() === enCat.toLowerCase())
      ?.items ?? [];

  const getGithubUsername = (url: string) =>
    (url || "").replace(/\/+$/, "").split("/").pop() ?? "";

  const devService = p.services?.[0] || {
    title: "Web Development",
    desc: "Responsive websites and web apps with modern technologies.",
  };
  const designService = p.services?.[1] || {
    title: "Graphic Design",
    desc: "Visual branding and designs.",
  };
  const videoService = p.services?.[2] || {
    title: "Video Editing",
    desc: "Commercial video editing & color grading.",
  };

  const isId = lang === "id";

  return {
    placeholderImage: PLACEHOLDER_IMAGE,
    developer: {
      name: nameParts[0] || "Dhatin",
      fullName: p.name,
      initials: initials || "DN",
      title: isId ? (p.title?.id || p.title?.en || "Full-Stack Developer") : (p.title?.en || "Full-Stack Developer"),
      taglines: p.taglines?.length
        ? p.taglines
        : ["Full-Stack Developer", "Graphic Designer"],
      description: isId ? (p.about?.id || p.about?.en || "") : (p.about?.en || ""),
      photo: p.photo || "/images/profile.jpg",
      cv: p.cv || "/cv.pdf",
      available: isId ? (p.available?.id || "Terbuka untuk magang & freelance") : (p.available?.en || "Available for internship & freelance"),
    },
    social: {
      github: getGithubUsername(p.github || ""),
      email: p.email || "",
      location: p.location || "Bandung, Indonesia",
    },
    about: {
      title: isId ? "Tentang Saya" : "About Me",
      description: isId ? (p.about?.id || p.about?.en || "") : (p.about?.en || ""),
    },
    experiences: (exp || []).map((e) => ({
      position: e.role,
      company: e.company,
      period: e.period,
      location: e.location,
      description: e.highlights?.[0] ?? "",
      responsibilities: e.highlights || [],
      technologies: e.tags || [],
    })),
    projects: (proj || []).map((project, index) => ({
      id: project.id ?? index + 1,
      slug: project.slug,
      title: project.title,
      year: project.year,
      category: project.category,
      technologies: (project.stack || []).join(", "),
      image: project.thumbnail || PLACEHOLDER_IMAGE,
      description: project.description,
      link: project.demo || project.repo || "",
    })),
    contact: {
      email: p.email,
      phone: p.phone,
      whatsapp:
        p.whatsapp && !p.whatsapp.includes("85142156672")
          ? `https://wa.me/${p.whatsapp.replace(/[^0-9]/g, "")}`
          : "",
      github: p.github,
      linkedin: p.linkedin,
    },
    skills: {
      develop: {
        title: isId ? "PENGEMBANGAN WEB" : (devService.title?.toUpperCase() || "FULL-STACK DEV"),
        description: isId
          ? "Website dan aplikasi web responsif dengan React, Node.js, dan Supabase."
          : devService.desc,
        details:
          devService.details ||
          (isId
            ? "Membangun website dan aplikasi web responsif dari hulu ke hilir — mulai dari antarmuka React/TypeScript hingga backend Node.js/PHP dengan database MySQL atau Supabase, termasuk integrasi payment gateway dan WhatsApp."
            : "Building responsive websites and web apps end-to-end — from React/TypeScript frontends to Node.js/PHP backends with MySQL or Supabase, including payment gateway and WhatsApp integrations."),
        tools:
          devService.tools && devService.tools.length > 0
            ? devService.tools
            : [
                ...skillItems("Frontend"),
                ...skillItems("Backend & Database"),
                ...skillItems("Tools"),
              ],
      },
      design: {
        title: isId
          ? "DESAIN GRAFIS & VIDEO"
          : `${designService.title || "DESIGN"} & ${videoService.title || "VIDEO"}`.toUpperCase(),
        description: isId
          ? "Desain visual media sosial, branding, dan editing video komersial sinematik."
          : `${designService.desc} ${videoService.desc}`,
        details:
          designService.details ||
          (isId
            ? "Desain grafis untuk media sosial, poster, brosur, identitas visual, serta penyuntingan video komersial dengan color grading, audio mixing, dan efek visual."
            : `${designService.desc} ${videoService.desc}`),
        tools:
          designService.tools && designService.tools.length > 0
            ? designService.tools
            : skillItems("Design & Multimedia"),
      },
    },
  };
};

export const config = buildConfig();
