import "./styles/TechStackNew.css";
import ASCIIText from "./ASCIIText";

interface TechItem {
  name: string;
  icon: string;
  url: string;
}

// All tech stack items with their icons and official URLs
// Inverted pyramid: 6 -> 5 -> 4 -> 3
const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";
const techStack: TechItem[][] = [
  // Row 1 - Frontend & core languages
  [
    { name: "React", icon: `${DEVICON}/react/react-original.svg`, url: "https://react.dev" },
    { name: "TypeScript", icon: `${DEVICON}/typescript/typescript-original.svg`, url: "https://typescriptlang.org" },
    { name: "HTML5", icon: `${DEVICON}/html5/html5-original.svg`, url: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
    { name: "CSS3", icon: `${DEVICON}/css3/css3-original.svg`, url: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
    { name: "Python", icon: `${DEVICON}/python/python-original.svg`, url: "https://python.org" },
    { name: "Java", icon: `${DEVICON}/java/java-original.svg`, url: "https://www.java.com" },
  ],
  // Row 2 - Backend & database
  [
    { name: "Node.js", icon: `${DEVICON}/nodejs/nodejs-original.svg`, url: "https://nodejs.org" },
    { name: "PHP", icon: `${DEVICON}/php/php-original.svg`, url: "https://php.net" },
    { name: "MySQL", icon: `${DEVICON}/mysql/mysql-original.svg`, url: "https://mysql.com" },
    { name: "Supabase", icon: `${DEVICON}/supabase/supabase-original.svg`, url: "https://supabase.com" },
    { name: "Git", icon: `${DEVICON}/git/git-original.svg`, url: "https://git-scm.com" },
  ],
  // Row 3 - Tools & design
  [
    { name: "GitHub", icon: `${DEVICON}/github/github-original.svg`, url: "https://github.com" },
    { name: "Figma", icon: `${DEVICON}/figma/figma-original.svg`, url: "https://figma.com" },
    { name: "Photoshop", icon: `${DEVICON}/photoshop/photoshop-original.svg`, url: "https://adobe.com/products/photoshop" },
    { name: "Illustrator", icon: `${DEVICON}/illustrator/illustrator-plain.svg`, url: "https://adobe.com/products/illustrator" },
  ],
  // Row 4 - Multimedia (3 items)
  [
    { name: "Canva", icon: `${DEVICON}/canva/canva-original.svg`, url: "https://canva.com" },
    { name: "Premiere Pro", icon: `${DEVICON}/premierepro/premierepro-original.svg`, url: "https://adobe.com/products/premiere" },
    { name: "CapCut", icon: "/images/capcut.svg", url: "https://www.capcut.com" },
  ],
  // Row 5 - Motion & Web Stack (tip of pyramid: 2 items)
  [
    { name: "After Effects", icon: `${DEVICON}/aftereffects/aftereffects-original.svg`, url: "https://adobe.com/products/aftereffects" },
    { name: "Tailwind CSS", icon: `${DEVICON}/tailwindcss/tailwindcss-original.svg`, url: "https://tailwindcss.com" },
  ],
];

const TechStackNew = () => {
  return (
    <div className="techstack-new">
      {/* Lightweight Animated Ambient Glow Background */}
      <div className="techstack-ambient-bg">
        <div className="techstack-glow-orb techstack-glow-1"></div>
        <div className="techstack-glow-orb techstack-glow-2"></div>
        <div className="techstack-grid-pattern"></div>
      </div>

      {/* Content */}
      <div className="techstack-content">
        <div className="techstack-title-container">
          <h2 className="techstack-sr-title">TECH STACK</h2>
          <ASCIIText
            text="TECH STACK"
            asciiFontSize={7}
            textScale={1.15}
            textColor="#ffffff"
            colors={['#ffffff', '#ff9a3d', '#ff7a00']}
            waves={0.8}
            waveSpeed={0.8}
            chroma={0.6}
            tilt={0.8}
            scramble={0.5}
            blocks={0.85}
          />
        </div>
        
        <div className="techstack-pyramid">
          {techStack.map((row, rowIndex) => (
            <div key={rowIndex} className="techstack-row">
              {row.map((tech, techIndex) => (
                <a
                  key={techIndex}
                  href={tech.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="techstack-item"
                  title={tech.name}
                  data-cursor="disable"
                >
                  <img
                    src={tech.icon}
                    alt={tech.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (tech.name === "CapCut") {
                        e.currentTarget.src = "/assets/images/capcut.svg";
                      }
                    }}
                  />
                  <span>{tech.name}</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechStackNew;
