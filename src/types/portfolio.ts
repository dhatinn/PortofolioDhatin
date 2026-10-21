export interface BadgeConfig {
  badgeRole?: string;
  badgeId?: string;
  initials?: string;
  accentColor?: string;
  subText?: string;
}

export interface ProfileData {
  name: string;
  taglines: string[];
  title: {
    en: string;
    id: string;
  };
  location: string;
  phone: string;
  whatsapp: string;
  email: string;
  github: string;
  linkedin: string;
  photo: string;
  cv: string;
  available: {
    en: string;
    id: string;
  };
  about: {
    en: string;
    id: string;
  };
  highlights: Array<{
    value: string;
    label: { en: string; id: string };
  }>;
  education: {
    school: string;
    degree: string;
    period: string;
    semester: number;
  };
  languages: Array<{
    name: { en: string; id: string };
    level: { en: string; id: string };
  }>;
  services: Array<{
    title: string;
    desc: string;
    details?: string;
    tools?: string[];
  }>;
  badge?: BadgeConfig;
}

export interface ProjectData {
  id?: number;
  slug: string;
  title: string;
  year: number;
  category: string;
  description: string;
  caseStudy?: {
    problem?: string;
    solution?: string;
    role?: string;
    impact?: string;
  } | null;
  stack: string[];
  thumbnail: string;
  demo: string;
  repo: string;
}

export interface ExperienceData {
  role: string;
  company: string;
  location: string;
  period: string;
  highlights: string[];
  tags: string[];
}

export interface SkillCategoryData {
  category: {
    en: string;
    id: string;
  };
  items: string[];
}

export interface PortfolioConfig {
  placeholderImage: string;
  developer: {
    name: string;
    fullName: string;
    initials: string;
    title: string;
    taglines: string[];
    description: string;
    photo: string;
    cv: string;
    available: string;
  };
  social: {
    github: string;
    email: string;
    location: string;
  };
  about: {
    title: string;
    description: string;
  };
  experiences: Array<{
    position: string;
    company: string;
    period: string;
    location: string;
    description: string;
    responsibilities: string[];
    technologies: string[];
  }>;
  projects: Array<{
    id: number;
    slug: string;
    title: string;
    year: number;
    category: string;
    technologies: string;
    image: string;
    description: string;
    link: string;
  }>;
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    github: string;
    linkedin: string;
  };
  skills: {
    develop: {
      title: string;
      description: string;
      details: string;
      tools: string[];
    };
    design: {
      title: string;
      description: string;
      details: string;
      tools: string[];
    };
  };
}
