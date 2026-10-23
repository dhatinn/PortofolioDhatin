// Simple text splitter utility to replace GSAP SplitText
export class TextSplitter {
  chars: Element[] = [];
  words: Element[] = [];
  lines: Element[] = [];
  elements: Element[] = [];
  selector: string | ((...args: unknown[]) => unknown);
  private originalHTML: Map<Element, string> = new Map();

  constructor(target: string | Element | NodeListOf<Element> | Element[], vars?: { type?: string; linesClass?: string }) {
    const type = vars?.type || "chars,words,lines";
    const linesClass = vars?.linesClass || "split-line";

    // Get elements
    let elements: Element[] = [];
    if (typeof target === "string") {
      elements = Array.from(document.querySelectorAll(target));
    } else if (target instanceof NodeList) {
      elements = Array.from(target);
    } else if (Array.isArray(target)) {
      elements = target;
    } else {
      elements = [target];
    }

    this.selector = typeof target === "string" ? target : "";
    this.elements = elements;

    elements.forEach((element) => {
      // Store original HTML for revert
      this.originalHTML.set(element, element.innerHTML);

      if (type.includes("chars") && type.includes("words")) {
        // Split into words first, then chars
        this.splitWords(element);
        this.splitCharsFromWords(element);
      } else if (type.includes("chars")) {
        this.splitChars(element);
      } else if (type.includes("words")) {
        this.splitWords(element);
      }

      if (type.includes("lines")) {
        this.splitLines(element, linesClass);
      }
    });
  }

  private splitChars(element: Element) {
    const text = element.textContent || "";
    const chars = text.split("");
    
    element.innerHTML = chars
      .map((char) => {
        if (char === " ") {
          return '<span class="split-char"> </span>';
        }
        if (char === "\n") {
          return "<br>";
        }
        return `<span class="split-char">${char}</span>`;
      })
      .join("");

    this.chars.push(...Array.from(element.querySelectorAll(".split-char")));
  }

  private splitWords(element: Element) {
    let raw = this.originalHTML.get(element) || element.innerHTML || element.textContent || "";

    // Normalize HTML <strong> and <b> tags (with any classes or attributes) into **markdown** format
    raw = raw.replace(/<strong[^>]*>(.*?)<\/strong>/gis, "**$1**");
    raw = raw.replace(/<b[^>]*>(.*?)<\/b>/gis, "**$1**");

    // Clean any stray HTML tags so no HTML attributes can ever leak into word tokens
    raw = raw.replace(/<[^>]+>/g, "");

    // If no explicit bold tags exist, automatically bold key highlights for professional presentation
    if (!raw.includes("**")) {
      const KEY_PHRASES = [
        "sixth-semester Informatics Engineering student",
        "STMIK Mardira Indonesia",
        "full-stack web development",
        "React.js",
        "TypeScript",
        "Node.js",
        "Supabase",
        "graphic design",
        "video editing",
        "digital project management",
        "real-world projects",
        "government agencies",
        "educational institutions",
        "proactive communication",
        "on-time delivery",
        "Teknik Informatika semester enam",
        "pengembangan web full-stack",
        "desain grafis",
        "penyuntingan video",
        "manajemen proyek digital",
        "proyek nyata",
        "instansi pemerintah",
        "lembaga pendidikan",
        "komunikasi proaktif",
        "ketepatan waktu",
      ];
      for (const phrase of KEY_PHRASES) {
        if (raw.includes(phrase)) {
          raw = raw.split(phrase).join(`**${phrase}**`);
        }
      }
    }

    const tokens = raw.split(/(\*\*.*?\*\*)/g);
    const htmlChunks: string[] = [];

    tokens.forEach((token) => {
      if (!token) return;
      const isBold = token.startsWith("**") && token.endsWith("**");
      const content = isBold ? token.slice(2, -2) : token;
      const words = content.split(/(\s+)/);

      words.forEach((w) => {
        if (w.length === 0) return;
        if (w.trim().length === 0) {
          htmlChunks.push(w);
        } else {
          const boldClass = isBold ? " split-bold" : "";
          const innerContent = isBold ? `<strong>${w}</strong>` : w;
          htmlChunks.push(`<span class="split-word${boldClass}">${innerContent}</span>`);
        }
      });
    });

    element.innerHTML = htmlChunks.join("");
    this.words.push(...Array.from(element.querySelectorAll(".split-word")));
  }

  private splitCharsFromWords(element: Element) {
    const words = element.querySelectorAll(".split-word");
    words.forEach((word) => {
      const text = word.textContent || "";
      const chars = text.split("");
      word.innerHTML = chars
        .map((char) => `<span class="split-char">${char}</span>`)
        .join("");
      this.chars.push(...Array.from(word.querySelectorAll(".split-char")));
    });
  }

  private splitLines(element: Element, linesClass: string) {
    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      const items = element.querySelectorAll(".split-word, .split-char");
      if (items.length === 0) return;

      let currentLine: Element[] = [];
      const lines: Element[][] = [];
      let currentTop = 0;

      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (currentTop === 0) {
          currentTop = rect.top;
        }

        if (Math.abs(rect.top - currentTop) > 5) {
          // New line
          if (currentLine.length > 0) {
            lines.push([...currentLine]);
          }
          currentLine = [item];
          currentTop = rect.top;
        } else {
          currentLine.push(item);
        }
      });

      if (currentLine.length > 0) {
        lines.push(currentLine);
      }

      // Wrap lines
      lines.forEach((line) => {
        if (line.length === 0) return;
        const lineWrapper = document.createElement("span");
        lineWrapper.className = linesClass;
        lineWrapper.style.display = "block";
        const firstItem = line[0];
        firstItem.parentNode?.insertBefore(lineWrapper, firstItem);
        line.forEach((item) => {
          if (item.parentNode === lineWrapper.parentNode) {
            lineWrapper.appendChild(item);
          }
        });
      });

      this.lines.push(...Array.from(element.querySelectorAll(`.${linesClass}`)));
    });
  }

  revert() {
    this.elements.forEach((element) => {
      const original = this.originalHTML.get(element);
      if (original !== undefined) {
        element.innerHTML = original;
      }
    });
    this.chars = [];
    this.words = [];
    this.lines = [];
    this.originalHTML.clear();
  }
}

