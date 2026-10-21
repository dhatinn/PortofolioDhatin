// ===== data/profile.ts =====
export const profile = {
  name: "Dhatin Nuril Arsandy",
  taglines: ["Full-Stack Developer", "Graphic Designer", "Video Editor"],
  title: {
    en: "Informatics Engineering Student | Full-Stack Developer & Multimedia Designer",
    id: "Mahasiswa Teknik Informatika | Full-Stack Developer & Multimedia Designer",
  },
  location: "Bandung, Indonesia",
  phone: "+62 851-4215-6672",
  whatsapp: "6285142156672",
  email: "dhatinsandy24@gmail.com",
  github: "https://github.com/dhatinn",
  linkedin: "", // TODO: isi jika ada
  photo: "/images/mypicnbg.png", // Dhatin's photo with transparent background
  cv: "/cv.pdf", // TODO: siapkan file CV PDF
  available: {
    en: "Available for internship & freelance",
    id: "Terbuka untuk magang & freelance",
  },
  about: {
    en: "Adaptable and communicative sixth-semester Informatics Engineering student at STMIK Mardira Indonesia with hands-on experience in full-stack web development (React.js, TypeScript, Node.js, Supabase), graphic design, video editing, and digital project management. I deliver real-world projects for clients across sectors, including government agencies, individuals, and educational institutions, with proactive communication and on-time delivery.",
    id: "TODO: terjemahkan paragraf About ke Bahasa Indonesia",
  },
  highlights: [
    { value: "2021", label: { en: "Freelancing since", id: "Freelance sejak" } },
    { value: "Hundreds", label: { en: "Applicants served on a live system", id: "Pendaftar dilayani di sistem live" } },
    { value: "3+", label: { en: "Real client & institution projects", id: "Proyek klien & institusi nyata" } },
  ],
  education: {
    school: "STMIK Mardira Indonesia, Bandung",
    degree: "S1 Teknik Informatika",
    period: "2023 – Sekarang",
    semester: 6,
  },
  languages: [
    { name: { en: "Indonesian", id: "Bahasa Indonesia" }, level: { en: "Native", id: "Native" } },
    { name: { en: "English", id: "Bahasa Inggris" }, level: { en: "Fluent", id: "Lancar" } },
  ],
  services: [
    { title: "Web Development", desc: "Responsive websites and web apps with React, Node.js, and Supabase." },
    { title: "Graphic Design", desc: "Social media, posters, brochures, and apparel designs for your brand." },
    { title: "Video Editing", desc: "Commercial videos with color grading, audio mixing, and visual effects." },
  ],
};
