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
  sk: SkillCategoryData[] = defaultSkills
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

  return {
    placeholderImage: PLACEHOLDER_IMAGE,
    developer: {
      name: nameParts[0] || "Dhatin",
      fullName: p.name,
      initials: initials || "DN",
      title: p.title?.en || "Full-Stack Developer",
      taglines: p.taglines?.length
        ? p.taglines
        : ["Full-Stack Developer", "Graphic Designer"],
      description: p.about?.en || "",
      photo: p.photo || "/images/profile.jpg",
      cv: p.cv || "/cv.pdf",
      available: p.available?.en || "Available for internship & freelance",
    },
    social: {
      github: getGithubUsername(p.github || ""),
      email: p.email || "",
      location: p.location || "Bandung, Indonesia",
    },
    about: {
      title: "About Me",
      description: p.about?.en || "",
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
      whatsapp: `https://wa.me/${p.whatsapp?.replace(/[^0-9]/g, "")}`,
      github: p.github,
      linkedin: p.linkedin,
    },
    skills: {
      develop: {
        title: devService.title?.toUpperCase() || "FULL-STACK DEV",
        description: devService.desc,
        details:
          devService.details ||
          "Building responsive websites and web apps end-to-end — from React/TypeScript frontends to Node.js/PHP backends with MySQL or Supabase, including payment gateway and WhatsApp integrations.",
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
        title: `${designService.title || "DESIGN"} & ${videoService.title || "VIDEO"}`.toUpperCase(),
        description: `${designService.desc} ${videoService.desc}`,
        details:
          designService.details || `${designService.desc} ${videoService.desc}`,
        tools:
          designService.tools && designService.tools.length > 0
            ? designService.tools
            : skillItems("Design & Multimedia"),
      },
    },
  };
};

export const config = buildConfig();
